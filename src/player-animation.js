'use strict';
// Presentation only: timings, hitboxes, stamina and movement remain authoritative in player.js.
const animSmooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
function animKeys(k, keys) {
  k = clamp(k, 0, 1);
  for (let i = 1; i < keys.length; i++) if (k <= keys[i][0]) {
    const a = keys[i - 1], b = keys[i];
    return lerp(a[1], b[1], animSmooth((k - a[0]) / (b[0] - a[0])));
  }
  return keys[keys.length - 1][1];
}
function playerMotion(p, mv) {
  const last = p._visual, now = G.clock;
  const dt = last ? clamp(now - last.clock, 0, 0.06) : 0;
  const dx = last ? p.x - last.x : 0, dy = last ? p.y - last.y : 0;
  const distance = Math.hypot(dx, dy), teleport = distance > 100;
  const moving = distance > 0.01 && !teleport && !p.mounted && p.state !== 'roll';
  const direction = moving ? Math.atan2(dy, dx) - p.face : (last ? last.dir : 0);
  const stride = (last && !teleport ? last.stride : 0) + (moving ? distance * Math.PI / 25 : 0);
  const pose = { lean: mv * (p.sprinting ? 2.8 : 1.1), twist: Math.sin(stride) * mv * 0.035, sq: [1, 1], step: 0 };
  const out = { pose, wAng: 0.6 + Math.sin(stride) * Math.min(1, mv) * 0.09, trail: null, thrust: 0, stab: false, spinRot: 0, fx: null, charge: 0, castK: 0, wide: 0, flask: 0, stride, gaitDir: direction, cape: Math.sin(now * 3.2 - 0.6) * 0.8 + Math.sin(stride - 0.9) * mv * 2.4 };
  const A = p.atk;
  if (p.state === 'attack' && A) {
    const ph = p.t < A.wind ? 0 : p.t < A.wind + A.act ? 1 : 2;
    const k = clamp(ph === 0 ? p.t / Math.max(0.001, A.wind) : ph === 1 ? (p.t - A.wind) / Math.max(0.001, A.act) : (p.t - A.wind - A.act) / Math.max(0.001, A.rec), 0, 1);
    const e = animSmooth(k), strike = animKeys(k, [[0, 0], [0.62, 0.92], [1, 1]]);
    const sw = A.swing || 1, side = A.side === 'left' ? -1 : 1;
    const heavy = A.kind === 'heavy' || A.kind === 'crit' ? 1.25 : 1;
    const an = A.anim || (A.thrust ? 'thrust' : 'slash');
    const phase = (a, b, c = 0) => ph === 0 ? lerp(c, a, e) : ph === 1 ? lerp(a, b, strike) : lerp(b, c, e);
    pose.lean = phase(-2.2, 4.5) * heavy; pose.step = phase(-0.12, 0.7);
    pose.twist = phase(0.33, -0.32) * sw * side;
    pose.sq = [1 + phase(-0.025, 0.035), 1 + phase(0.018, -0.025)];
    out.wAng = phase(1.9 * sw, -1.4 * sw, 0.6);
    if (ph === 1) out.trail = [lerp(1.9 * sw, out.wAng, 0.25), out.wAng];
    if (an === 'thrust' || (an === 'dash' && A.thrust)) {
      out.wAng = phase(-0.24, -0.08, 0.6); out.thrust = phase(-0.35, 0.9);
      if (A.multi && ph === 1) out.thrust = lerp(-0.35, 0.9, Math.sin(k * A.multi * Math.PI) ** 2);
      out.trail = null; out.stab = ph === 1; pose.twist *= 0.4; pose.lean = phase(-2.8, 5) * heavy;
    } else if (an === 'overhead') {
      out.wAng = phase(2.8, -0.1, 0.6); out.thrust = phase(-0.12, 0.35); pose.lean = phase(-3, 5.5) * heavy; pose.twist *= 0.35;
      out.trail = null; if (ph === 1) out.fx = 'chop';
    } else if (an === 'bow' || an === 'cast') {
      out.wAng = phase(-0.15, -0.04, 0.6); out.charge = ph === 0 ? e : ph === 1 ? 1 - animSmooth(k / 0.25) : 0;
      pose.lean = phase(-1.7, 1.2); pose.twist = phase(0.12, -0.08); out.trail = null;
    } else if (an === 'spin') {
      out.wAng = phase(1.7, 1.7, 0.6); out.spinRot = ph === 1 ? -k * TAU * (A.turns || 1) : 0;
      pose.twist = 0; if (ph === 1) out.fx = 'spin';
    }
    if (an === 'dash' && ph === 1) out.fx = 'dash';
    if (A.side === 'dual') pose.twist *= 0.45;
  } else if (p.state === 'guard') {
    const k = animSmooth(p.t / 0.12); out.wAng = lerp(0.6, twoHanded() ? -1.1 : 1.1, k);
    pose.lean = -1.6 * k; pose.twist = -0.1 * k; out.wide = k;
  } else if (p.state === 'deflect') {
    const k = clamp(p.t / 0.42, 0, 1), punch = animKeys(k, [[0, 0], [0.17, 1], [0.4, 0.85], [1, 0]]);
    out.wAng = 0.6 - 1.45 * punch; pose.twist = -0.32 * punch; pose.lean = -1.8 * punch; out.wide = punch;
  } else if (p.state === 'hurt') {
    const k = clamp(p.t / (p.hurtDur || 0.3), 0, 1), recoil = animKeys(k, [[0, 0.3], [0.16, 1], [0.48, 0.7], [1, 0]]);
    pose.lean = -5 * recoil; pose.twist = 0.22 * recoil; pose.sq = [1 - 0.06 * recoil, 1 + 0.035 * recoil]; out.wAng += 0.5 * recoil;
  } else if (p.state === 'cast') {
    const sp = p.spell ? SPELLS[p.spell] : null, ct = sp ? sp.cast : 0.1, rec = sp ? sp.rec : 0.35;
    out.castK = p.t < ct ? animSmooth(p.t / ct) : 1 - animSmooth((p.t - ct) / Math.max(0.01, rec));
    pose.lean = -1.8 * out.castK; pose.twist = -0.16 * out.castK; out.wAng = 0.6 + 0.5 * out.castK;
  } else if (p.state === 'drink') {
    out.flask = animKeys(p.t, [[0, 0], [0.28, 1], [0.62, 1], [1, 0]]);
    pose.lean = -1.4 * out.flask; pose.twist = 0.12 * out.flask; out.wAng = 0.6 + 0.9 * out.flask;
  } else if (p.state === 'throw') {
    const k = clamp(p.t / 0.4, 0, 1);
    out.wAng = animKeys(k, [[0, 0.6], [0.32, 2], [0.48, -0.5], [1, 0.6]]);
    pose.lean = animKeys(k, [[0, 0], [0.32, -2.5], [0.5, 3], [1, 0]]);
    pose.twist = animKeys(k, [[0, 0], [0.32, 0.28], [0.5, -0.3], [1, 0]]);
  } else if (p.state === 'roll') out.wAng = lerp(0.6, 2.1, Math.sin(Math.PI * clamp(p.t / p.roll.dur, 0, 1)));
  if (twoHanded() && p.state !== 'drink') {
    out.wide = Math.max(out.wide, 0.35);
    pose.twist *= 0.72;
    if (p.state === 'idle') { pose.lean += 0.5; out.wAng -= 0.16; }
  }
  // Blend only state entrances. Attack phases use exact timed curves, never a lagging spring.
  const key = p.state, changed = last && (last.state !== key || last.atk !== A || p.t < last.t);
  let from = changed ? last.out : last && last.from, entered = changed ? now : last ? last.entered : now - 1;
  const blend = animSmooth((now - entered) / (key === 'hurt' ? 0.035 : 0.065));
  if (from && blend < 1 && key !== 'roll') {
    out.wAng = lerp(from.wAng, out.wAng, blend);
    for (const k of ['lean', 'twist', 'step']) pose[k] = lerp(from.pose[k], pose[k], blend);
  } else from = null;
  p._visual = { clock: now, x: p.x, y: p.y, dir: direction, stride, state: key, atk: A, t: p.t, entered, from, out };
  return out;
}
function drawPlayerFeet(L, s, o, mv, st, fall) {
  const m = Math.min(1.2, mv), dir = o.gaitDir || 0;
  for (const side of [-1, 1]) {
    const phase = st + (side < 0 ? Math.PI : 0), sweep = Math.cos(phase) * 9 * m;
    const lift = Math.max(0, Math.sin(phase)) * m;
    let x = 3 + Math.cos(dir) * sweep + (o.step || 0) * (side > 0 ? 7 : -3);
    let y = side * (6 + (o.wide || 0) * 2) + Math.sin(dir) * sweep;
    if (o.kneel) x = side > 0 ? 7 : -5;
    x = lerp(x, -8, fall); y *= 1 - fall * 0.25;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x * s, y * s + 1, 4.4 * s, 2.6 * s, 0, 0, TAU); ctx.fill();
    const kneeX = (x * 0.45 - lift * 2) * s, kneeY = (side * 4 + y * 0.45) * s;
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-2 * s, side * 4 * s); ctx.lineTo(kneeX, kneeY); ctx.lineTo(x * s, (y - lift * 1.5) * s);
    ctx.strokeStyle = OL; ctx.lineWidth = 4.2 * s; ctx.stroke(); ctx.strokeStyle = tint(L.body, 0.7); ctx.lineWidth = 2.6 * s; ctx.stroke();
    ctx.fillStyle = L.boot || '#5a4330'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse((x + 1) * s, (y - lift * 1.5) * s, (4.5 + lift * 0.4) * s, 2.7 * s, Math.sin(dir) * 0.18, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineCap = 'butt';
  }
}
// A two-link arm with fixed upper/forearm lengths. The elbow bends outward.
function playerArm(sx, sy, hx, hy, s, col, bend) {
  const dx = hx - sx, dy = hy - sy, distance = Math.hypot(dx, dy);
  const length = 9.5 * s, d = clamp(distance, 0.001, length * 2 - 0.01);
  const ux = distance > 0.001 ? dx / distance : 1, uy = distance > 0.001 ? dy / distance : 0;
  const tx = sx + ux * d, ty = sy + uy * d;
  const h = Math.sqrt(Math.max(0, length * length - d * d / 4));
  const ex = sx + ux * d / 2 - uy * h * bend, ey = sy + uy * d / 2 + ux * h * bend;
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(tx, ty);
  ctx.strokeStyle = OL; ctx.lineWidth = 4.6 * s; ctx.stroke(); ctx.strokeStyle = tint(col, 0.85); ctx.lineWidth = 2.8 * s; ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#3a2f24'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(tx, ty, 2.5 * s, 0, TAU); ctx.fill(); ctx.stroke();
}
// Translate the whole weapon until BOTH grips lie inside their arm reach circles.
function playerGrip(L, s, angle, o) {
  let ox = 3 * s + (o.thrust || 0) * 14 * s + (o.armX || 0) * s, oy = 8 * s;
  const bow = L.weapon === 'bow';
  const gap = bow ? (6 + Math.cos(1.25) * 13 - 3 - (o.charge || 0) * 10) * s : (['spear', 'scythe', 'staff'].includes(L.weapon) ? Math.min(10, L.wlen * 0.24) : -4.5) * s;
  const gx = Math.cos(angle) * gap, gy = Math.sin(angle) * gap;
  const rx = Math.cos(angle) * 1.5 * s, ry = Math.sin(angle) * 1.5 * s;
  const reach = 17.5 * s;
  for (let i = 0; i < 16; i++) {
    for (const [dx, dy, sy] of [[gx, gy, -9 * s], [rx, ry, 9 * s]]) {
      const vx = ox + dx - s, vy = oy + dy - sy, d = Math.hypot(vx, vy);
      if (d > reach) { ox -= vx * (1 - reach / d); oy -= vy * (1 - reach / d); }
    }
  }
  return { ox, oy, left: [ox + gx, oy + gy], right: [ox + rx, oy + ry] };
}
