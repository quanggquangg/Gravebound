'use strict';
// Gravebound — Tiện ích, canvas và âm thanh
// ───────────────────────── tiện ích ─────────────────────────
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function turn(a, target, step) { return a + clamp(angDiff(a, target), -step, step); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function inArc(ax, ay, face, range, arc, tx, ty, tr) {
  const d = dist(ax, ay, tx, ty);
  if (d > range + tr) return false;
  if (d < tr + 4) return true;
  return Math.abs(angDiff(face, Math.atan2(ty - ay, tx - ax))) <= arc / 2 + Math.atan2(tr, d);
}
const $ = id => document.getElementById(id);

// ───────────────────────── canvas ─────────────────────────
const canvas = $('game');
// bảng vẽ chính; sổ tay quái vật tạm đổi sang canvas nhỏ để vẽ chân dung bằng cùng các hàm vẽ
let ctx = canvas.getContext('2d');
// hệ số phóng từ tọa độ thế giới ra điểm ảnh thật của canvas
let WZ = 1;
let DPR = 1, CW = 800, CH = 600, ZOOM = 1, VIGNETTE = null;
// Đồ họa thấp: bỏ cỏ động, sương mù, giảm độ phân giải lớp ánh sáng (mặc định bật trên điện thoại)
let FX_LOW = (() => {
  try { const v = localStorage.getItem('vvv-fx'); if (v) return v === 'low'; } catch (e) { /* bỏ qua */ }
  try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
})();
const lightCanvas = document.createElement('canvas'), lctx = lightCanvas.getContext('2d');
let LSCALE = 0.25;
// độ phân giải động cho màn hình mật độ cao (điện thoại, máy Retina): khung hình tụt thì bớt điểm ảnh, không bao giờ thấp hơn 1:1
const RES_STEPS = [1, 0.8, 0.66];
const RES = { i: 0, acc: 0, n: 0, good: 0, ups: 0 };
function resWatch(ms) {
  if (G.mode !== 'play' || ms > 250 || document.hidden || Math.min(window.devicePixelRatio || 1, 2) <= 1) { RES.acc = RES.n = 0; return; }
  RES.acc += ms; RES.n++;
  if (RES.acc < 3000) return;
  const fps = RES.n * 1000 / RES.acc; RES.acc = RES.n = 0;
  if (fps < 42 && RES.i < RES_STEPS.length - 1) { RES.i++; RES.good = 0; resize(); }
  else if (fps >= 57 && RES.i > 0 && RES.ups < 1 && ++RES.good >= 7) { RES.i--; RES.ups++; RES.good = 0; resize(); }
  else if (fps < 57) RES.good = 0;
}
function resize() {
  // kích thước bố cục (không tính phép xoay của chế độ xoay ngang)
  CW = Math.max(1, canvas.clientWidth); CH = Math.max(1, canvas.clientHeight);
  const d = Math.min(window.devicePixelRatio || 1, 2);
  DPR = d > 1 ? Math.max(1, d * RES_STEPS[RES.i]) : d;
  canvas.width = Math.round(CW * DPR); canvas.height = Math.round(CH * DPR);
  ZOOM = clamp(Math.sqrt(CW * CH) / 720, 0.66, 1.6);
  WZ = DPR * ZOOM;
  VIGNETTE = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.78);
  VIGNETTE.addColorStop(0, 'rgba(6,5,3,0)');
  VIGNETTE.addColorStop(1, 'rgba(6,5,3,0.66)');
  // lớp bóng tối chỉ gồm các dải chuyển mượt nên độ phân giải thấp vẫn đẹp mà nhẹ hơn nhiều
  LSCALE = FX_LOW ? 0.18 : 0.25;
  lightCanvas.width = Math.max(1, Math.ceil(canvas.width * LSCALE)); lightCanvas.height = Math.max(1, Math.ceil(canvas.height * LSCALE));
}
window.addEventListener('resize', resize);
resize();

const FONT_D = '"Cormorant SC","Cormorant Garamond",Georgia,serif';
const FONT_I = '"Cormorant Garamond",Georgia,serif';
const FONT_U = '"Be Vietnam Pro",system-ui,sans-serif';

// ───────────────────────── âm thanh (tổng hợp bằng WebAudio) ─────────────────────────
let AC = null, master = null, muted = false, noiseBuf = null, musicOut = null, verbSend = null;
// Chuỗi âm thanh: tiếng hiệu ứng (master) và nhạc (musicOut) → nén → giới hạn đỉnh → loa.
// Bộ nén giữ cho nhiều tiếng dồn cùng lúc không bị rè; một phần tiếng hiệu ứng đi qua vang (reverb) nhẹ cho có không gian.
function audioInit() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.22;
      const lim = AC.createDynamicsCompressor();
      lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
      const makeup = AC.createGain(); makeup.gain.value = 1.5; comp.connect(makeup); makeup.connect(lim); lim.connect(AC.destination);
      master = AC.createGain(); master.gain.value = 0.62 * (typeof SET !== 'undefined' ? SET.sfx : 0.8); master.connect(comp);
      musicOut = AC.createGain(); musicOut.gain.value = 1; musicOut.connect(comp);
      // vang: đáp ứng xung là tiếng ồn tắt dần 1,6 giây, trộn rất nhẹ
      const len = Math.floor(AC.sampleRate * 1.6), ir = AC.createBuffer(2, len, AC.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      const conv = AC.createConvolver(); conv.buffer = ir;
      verbSend = AC.createGain(); verbSend.gain.value = 0.16; master.connect(verbSend); verbSend.connect(conv);
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; conv.connect(lp); lp.connect(comp);
      // quay lại tab hoặc mở lại app: đánh thức âm thanh (điện thoại hay treo AudioContext khi chuyển app)
      document.addEventListener('visibilitychange', () => { if (!document.hidden && AC && AC.state !== 'running') AC.resume(); });
    }
    if ((AC.state === 'suspended' || AC.state === 'interrupted') && AC.resume) AC.resume().catch(() => {});
  } catch (e) { AC = null; }
}
// giới hạn số tiếng phát cùng lúc; tiếng trùng tên phát quá dày thì bỏ bớt
let VOICES = 0;
const VOICE_CAP = 30, LAST_SFX = {};
function tone(f, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
  if (!AC || muted || VOICES > VOICE_CAP) return;
  const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // sóng vuông, răng cưa rất chói: lọc bớt tần số cao cho tiếng tròn hơn
  let out = o;
  if (type === 'square' || type === 'sawtooth') { const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(4200, f * 7 + 600); o.connect(lp); out = lp; }
  out.connect(g); g.connect(master);
  VOICES++; o.onended = () => { VOICES = Math.max(0, VOICES - 1); };
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol = 0.2, freq = 1200, q = 1, delay = 0, type = 'bandpass') {
  if (!AC || muted || VOICES > VOICE_CAP) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  // lặp bộ đệm và bắt đầu ở vị trí ngẫu nhiên: tiếng dài hơn 2 giây không bị cắt ngang, mỗi lần nghe hơi khác nhau
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.006, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master);
  VOICES++; s.onended = () => { VOICES = Math.max(0, VOICES - 1); };
  s.start(t0, Math.random() * 1.9); s.stop(t0 + dur + 0.05);
}
// phát tiếng có tên nhưng không dày hơn gap giây một lần (nhiều quái cùng chém, nhiều vụ nổ cùng lúc)
function sfxOnce(name, gap = 0.05) { const now = AC ? AC.currentTime : 0; if (LAST_SFX[name] && now - LAST_SFX[name] < gap) return false; LAST_SFX[name] = now; return true; }
// tiếng gió vụt: tiếng ồn qua bộ lọc có tần số trượt (vung vũ khí, lăn, cánh vỗ)
function whoosh(dur, vol, f0, f1, q = 1.2, delay = 0) {
  if (!AC || muted || VOICES > VOICE_CAP) return;
  noise(0.001, 0.0001); // tạo bộ đệm nếu chưa có
  const t0 = AC.currentTime + delay, src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  VOICES++; src.onended = () => { VOICES = Math.max(0, VOICES - 1); };
  src.start(t0, Math.random() * 1.9); src.stop(t0 + dur + 0.05);
}
const SFX = {
  swing: () => { if (sfxOnce('swing', 0.04)) whoosh(0.18, 0.13, 900, 3200, 1.1); },
  heavy: () => { if (sfxOnce('heavy', 0.06)) { whoosh(0.32, 0.18, 420, 1600, 0.9); tone(90, 0.2, 'sine', 0.05, -30, 0.08); } },
  hit: () => { if (!sfxOnce('hit', 0.03)) return; noise(0.1, 0.26, 900, 1.1, 0, 'lowpass'); tone(150, 0.12, 'sine', 0.1, -80); noise(0.03, 0.12, 3200, 2); },
  crit: () => { noise(0.3, 0.34, 600, 1, 0, 'lowpass'); tone(80, 0.45, 'sine', 0.16, -40); tone(1240, 0.5, 'triangle', 0.04, -300, 0.02); },
  hurt: () => { if (!sfxOnce('hurt', 0.08)) return; noise(0.14, 0.26, 700, 1, 0, 'lowpass'); tone(120, 0.22, 'sine', 0.1, -50); tone(310, 0.16, 'triangle', 0.03, -120, 0.03); },
  roll: () => { whoosh(0.26, 0.09, 380, 1200, 0.8); noise(0.12, 0.08, 260, 0.8, 0.16, 'lowpass'); },
  spell: () => { if (!sfxOnce('spell', 0.06)) return; tone(1200, 0.25, 'triangle', 0.06, -500); tone(1800, 0.22, 'sine', 0.035, -800); whoosh(0.3, 0.05, 2000, 5000, 2); },
  drink: () => { for (let i = 0; i < 3; i++) tone(360 + i * 60, 0.12, 'sine', 0.06, 220, i * 0.14); tone(880, 0.6, 'sine', 0.03, 200, 0.45); },
  grace: () => { if (sfxOnce('grace', 0.3)) [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.3, 'sine', 0.05, 0, i * 0.12)); },
  death: () => { tone(98, 2.4, 'sawtooth', 0.07, -40); tone(147, 2.4, 'sine', 0.06, -60); noise(2.2, 0.08, 300, 0.6, 0.1, 'lowpass'); },
  felled: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 2, 'triangle', 0.05, 0, i * 0.18)),
  boom: () => { if (!sfxOnce('boom', 0.09)) return; noise(0.55, 0.36, 240, 0.7, 0, 'lowpass'); tone(58, 0.55, 'sine', 0.18, -28); },
  pickup: () => { if (sfxOnce('pickup', 0.08)) { tone(880, 0.3, 'sine', 0.05); tone(1320, 0.4, 'sine', 0.04, 0, 0.08); } },
  glint: () => { if (sfxOnce('glint', 0.07)) tone(2400, 0.09, 'sine', 0.025); },
  roar: () => { if (!sfxOnce('roar', 0.4)) return; noise(1.3, 0.26, 280, 0.6, 0, 'lowpass'); tone(68, 1.2, 'sawtooth', 0.08, 18); tone(102, 1.0, 'sawtooth', 0.04, -20, 0.1); },
  whistle: () => { tone(1500, 0.18, 'sine', 0.05, 400); tone(1900, 0.25, 'sine', 0.05, 300, 0.18); },
  block: () => { if (!sfxOnce('block', 0.04)) return; noise(0.1, 0.22, 2200, 2); tone(620, 0.22, 'triangle', 0.05, -40); tone(931, 0.18, 'triangle', 0.03, -60); },
  parry: () => { tone(2200, 0.5, 'triangle', 0.07, -400); tone(3300, 0.35, 'sine', 0.03, -500); noise(0.2, 0.26, 3600, 3); },
  fire: (d = 1.7) => { if (sfxOnce('fire', 0.2)) noise(d, 0.2, 700, 0.5); },
  wing: () => { if (sfxOnce('wing', 0.15)) whoosh(0.5, 0.2, 180, 520, 0.7); },
  bleed: () => { tone(180, 0.25, 'sawtooth', 0.06, -60); noise(0.25, 0.26, 900, 1); },
  poison: () => tone(160, 0.5, 'sine', 0.06, -60),
  // ── tiếng mới ──
  step: surf => {
    if (!sfxOnce('step', 0.09)) return;
    if (surf === 'water') { noise(0.16, 0.06, 2400, 1.4); noise(0.1, 0.04, 700, 1, 0.02); }
    else if (surf === 'stone') { noise(0.05, 0.06, 1900, 2.2); noise(0.06, 0.04, 380, 1, 0, 'lowpass'); }
    else noise(0.08, 0.05, 520, 0.9, 0, 'lowpass');
  },
  gallop: () => { if (!sfxOnce('gallop', 0.08)) return; noise(0.07, 0.09, 300, 1, 0, 'lowpass'); noise(0.07, 0.07, 340, 1, 0.09, 'lowpass'); },
  die: () => { if (!sfxOnce('die', 0.06)) return; noise(0.35, 0.14, 420, 0.8, 0, 'lowpass'); tone(110, 0.4, 'sine', 0.07, -60); },
  chest: () => { tone(170, 0.45, 'sawtooth', 0.035, -60); noise(0.4, 0.1, 500, 1.5); noise(0.08, 0.2, 260, 1, 0.42, 'lowpass'); tone(660, 0.6, 'sine', 0.04, 0, 0.5); tone(990, 0.7, 'sine', 0.03, 0, 0.6); },
  lever: () => { noise(0.08, 0.22, 1600, 3); tone(240, 0.3, 'triangle', 0.05, -80, 0.04); noise(1.4, 0.16, 120, 0.6, 0.25, 'lowpass'); tone(48, 1.2, 'sine', 0.1, -8, 0.3); },
  levelup: () => { [392, 523.25, 659.25, 1046.5].forEach((f, i) => tone(f, 0.9, 'triangle', 0.045, 0, i * 0.07)); whoosh(0.8, 0.05, 1500, 5000, 1.5, 0.1); },
  ui: () => { if (sfxOnce('ui', 0.04)) tone(1560, 0.05, 'sine', 0.03); },
  uiOpen: () => { whoosh(0.22, 0.05, 700, 2400, 1); tone(880, 0.25, 'sine', 0.025, 0, 0.05); },
  uiClose: () => whoosh(0.18, 0.04, 2000, 600, 1),
  lock: () => { tone(1100, 0.06, 'triangle', 0.03); tone(1650, 0.06, 'triangle', 0.02, 0, 0.04); },
  exhaust: () => { if (sfxOnce('exhaust', 1)) { noise(0.45, 0.06, 700, 0.8, 0, 'lowpass'); noise(0.35, 0.05, 900, 0.8, 0.5, 'lowpass'); } },
  heart: () => { tone(58, 0.14, 'sine', 0.16, -12); tone(52, 0.16, 'sine', 0.12, -10, 0.2); },
  summon: () => { [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, 1.4, 'sine', 0.035, 0, i * 0.05)); whoosh(1.2, 0.05, 300, 2600, 0.8); },
  equip: () => { noise(0.06, 0.12, 2600, 3); tone(1320, 0.12, 'triangle', 0.025, 0, 0.03); },
  crack: () => { noise(0.18, 0.3, 1400, 1.5); tone(200, 0.3, 'sawtooth', 0.05, -120); },
};
