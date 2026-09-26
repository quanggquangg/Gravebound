'use strict';
// Gravebound — Dáng vẽ riêng của từng boss hình người và Thú Aurum.
// Mỗi dáng (L.bform) thay áo choàng, thân, đầu và đồ ở tay trái trong drawHumanoid; vũ khí riêng thêm vào WFORM.
// Hệ tọa độ: nhìn từ trên xuống, mặt hướng +x, tay cầm vũ khí phía +y, tay trái phía -y; s là tỉ lệ thân.

function poly(pts, fill, stroke = OL, lw = 1.4) {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function blob(x, y, rx, ry, fill, rot = 0, stroke = OL, lw = 1.4) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
// áo choàng rách: mép sau lởm chởm, bay theo gió
function tatteredCape(s, col, len, half, wave, teeth = 7, trim) {
  ctx.beginPath(); ctx.moveTo(-1 * s, -half * s);
  ctx.quadraticCurveTo(-len * 0.5 * s, (-half - 2) * s + wave, -len * s, -half * 0.9 * s + wave);
  for (let i = 0; i <= teeth; i++) {
    const u = i / teeth, y = (-half * 0.9 + u * half * 1.8) * s, dx = ((i * 7) % 3) * 1.6 * s + (i % 2 ? 2.4 : 0) * s + Math.sin(G.clock * 3 + i) * 1.2 * s;
    ctx.lineTo(-len * s + dx + (Math.abs(u - 0.5) * 6) * s, y + wave * (1 - u * 2));
  }
  ctx.quadraticCurveTo(-len * 0.5 * s, (half + 2) * s - wave, -1 * s, half * s); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = tint(col, 0.6); ctx.lineWidth = 1.2 * s; ctx.beginPath();
  for (const k of [-0.5, 0, 0.5]) { ctx.moveTo(-5 * s, k * half * s); ctx.quadraticCurveTo(-len * 0.55 * s, k * half * 1.1 * s + wave, -len * 0.85 * s, k * half * 0.95 * s + wave); }
  ctx.stroke();
  if (trim) { ctx.strokeStyle = trim; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(-1 * s, -half * s); ctx.quadraticCurveTo(-len * 0.5 * s, (-half - 2) * s + wave, -len * s, -half * 0.9 * s + wave); ctx.moveTo(-1 * s, half * s); ctx.quadraticCurveTo(-len * 0.5 * s, (half + 2) * s - wave, -len * s, half * 0.9 * s - wave); ctx.stroke(); }
}
function glowEyes(x, y, gap, r, col) { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y - gap, r, 0, TAU); ctx.arc(x, y + gap, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
function resetLine() { ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.6; }

function royalCape(s, col, trim, len, w0, w1, wave) {
  const hem = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8, y = (-w1 + u * 2 * w1) * s; hem.push([-len * s + Math.sin(u * Math.PI * 4 + G.clock * 2) * 1.4 * s + Math.abs(u - 0.5) * 5 * s, y + wave * (1 - 2 * u)]); }
  const path = () => { ctx.beginPath(); ctx.moveTo(0, -w0 * s); ctx.quadraticCurveTo(-len * 0.45 * s, (-w1 + 1) * s + wave, hem[0][0], hem[0][1]); for (const [x, y] of hem) ctx.lineTo(x, y); ctx.quadraticCurveTo(-len * 0.45 * s, (w1 - 1) * s - wave, 0, w0 * s); ctx.closePath(); };
  path(); ctx.fillStyle = litGrad(col, -len * 0.4 * s, -3 * s, len * 0.8 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.strokeStyle = tint(col, 0.55); ctx.lineWidth = 1.2 * s; ctx.beginPath(); for (const k of [-0.55, -0.2, 0.2, 0.55]) { ctx.moveTo(-4 * s, k * w0 * s); ctx.quadraticCurveTo(-len * 0.5 * s, k * (w0 + w1) * 0.5 * s + wave, -len * 0.92 * s, k * w1 * s); } ctx.stroke();
  ctx.strokeStyle = trim; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(hem[0][0], hem[0][1]); for (const [x, y] of hem) ctx.lineTo(x + 1.5 * s, y); ctx.stroke();
}
const BFORM = {
  // ─── Varek, Kẻ Gác Cổng Bội Thề: áo choàng rách tả tơi, mũ trùm nhọn, mắt vàng trong bóng tối ───
  varek: {
    noCloak: true,
    back(L, s, o, wave) { tatteredCape(s, L.cloak, 27, 11, wave, 9); },
    body(L, s) {
      blob(0, 0, 9.5 * s, 12 * s, litGrad(L.body, 3 * s, -3 * s, 13 * s));
      // dây da chéo ngực và túi dao
      ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(-6 * s, -9 * s); ctx.lineTo(6 * s, 8 * s); ctx.stroke();
      ctx.strokeStyle = L.trim; ctx.lineWidth = 0.8 * s; ctx.stroke();
      for (const k of [-0.2, 0.2, 0.55]) blob(-6 * s + k * 12 * s, -9 * s + k * 17 * s, 1.6 * s, 1.1 * s, '#c9a34a', 0.9, OL, 0.8);
      for (const sy of [-1, 1]) { poly([[3 * s, sy * 7 * s], [-4 * s, sy * 7.5 * s], [-3 * s, sy * 13 * s], [4 * s, sy * 12.5 * s]], litGrad('#3a3228', 0, sy * 10 * s, 7 * s), OL, 1.4); }
      resetLine();
    },
    head(L, s, o) {
      // mũ trùm nhọn kéo dài về sau, viền sờn
      poly([[8 * s, 0], [5 * s, -6.5 * s], [-3 * s, -7 * s], [-13 * s, -1 * s], [-3 * s, 7 * s], [5 * s, 6.5 * s]], litGrad(L.cloak, 3 * s, -2 * s, 10 * s), OL, 1.6);
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.beginPath(); ctx.ellipse(5 * s, 0, 3.2 * s, 4.6 * s, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = tint(L.cloak, 0.55); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(4 * s, -5 * s); ctx.lineTo(-10 * s, -1 * s); ctx.moveTo(4 * s, 5 * s); ctx.lineTo(-10 * s, 0.5 * s); ctx.stroke();
      if (o.eyes) glowEyes(6.2 * s, 0, 1.9 * s, 1.1 * s, o.eyes);
    },
  },
  // ─── Varek, Vua Ẩn Mặt: áo choàng đỏ thẫm viền lông, vương miện gai vàng, giáp đen chạm vàng ───
  hiddenking: {
    noCloak: true,
    back(L, s, o, wave) {
      if (o.aura) { ctx.save(); ctx.rotate(G.clock * 0.4); ctx.strokeStyle = 'rgba(255,214,110,.55)'; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18 * s, Math.sin(a) * 18 * s); ctx.lineTo(Math.cos(a) * (i % 2 ? 24 : 28) * s, Math.sin(a) * (i % 2 ? 24 : 28) * s); ctx.stroke(); } ctx.restore(); }
      // áo choàng hoàng gia xòe rộng, gấu viền vàng
      royalCape(s, L.cloak, L.trim, 30, 12, 17, wave);
      // cổ áo lông chồn trắng đốm đen
      ctx.fillStyle = '#ece6da'; ctx.beginPath(); ctx.ellipse(-2 * s, 0, 5 * s, 14 * s, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#1a1612'; for (const k of [-10, -5, 0, 5, 10]) { ctx.beginPath(); ctx.ellipse(-3 * s, k * s, 0.8 * s, 1.3 * s, 0, 0, TAU); ctx.fill(); }
    },
    body(L, s) {
      blob(0, 0, 9.5 * s, 12.5 * s, litGrad(L.body, 3 * s, -3 * s, 13 * s));
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(6 * s, -7 * s); ctx.quadraticCurveTo(9 * s, 0, 6 * s, 7 * s); ctx.moveTo(-2 * s, -11 * s); ctx.lineTo(-2 * s, 11 * s); ctx.stroke();
      ctx.fillStyle = L.trim; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 1.6 * s : 3.2 * s; ctx.lineTo(3 * s + Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      for (const sy of [-1, 1]) {
        for (let k = 0; k < 3; k++) blob((2 - k * 2) * s, sy * (10 + k * 0.6) * s, (5.4 - k * 0.8) * s, (4.2 - k * 0.5) * s, litGrad(k ? tint(L.body, 1.2) : L.body, 2 * s, sy * 9 * s, 6 * s), 0, OL, 1.2);
        ctx.strokeStyle = L.trim; ctx.lineWidth = 0.9 * s; ctx.beginPath(); ctx.arc(2 * s, sy * 10 * s, 4.6 * s, sy > 0 ? 0.2 : -2.9, sy > 0 ? 2.9 : -0.2); ctx.stroke();
      }
      resetLine();
    },
    head(L, s, o) {
      blob(2 * s, 0, 6.4 * s, 6.4 * s, litGrad(L.head, 4 * s, -2.5 * s, 8 * s));
      // vương miện: vòng vàng với bảy mũi gai
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) { const a = -1.9 + i / 6 * 3.8 + Math.PI, bx = 2 * s + Math.cos(a) * 5.6 * s, by = Math.sin(a) * 5.6 * s, tx = 2 * s + Math.cos(a) * 10.5 * s, ty = Math.sin(a) * 10.5 * s, nx = -Math.sin(a) * 1.4 * s, ny = Math.cos(a) * 1.4 * s; poly([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]], '#f0c85a', OL, 1); }
      ctx.strokeStyle = '#f0c85a'; ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.arc(2 * s, 0, 5.6 * s, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#c0301c'; ctx.beginPath(); ctx.arc(-3.6 * s, 0, 1.2 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(6 * s, 0, 2.4 * s, 4 * s, 0, 0, TAU); ctx.fill();
      if (o.eyes) glowEyes(6.4 * s, 0, 2 * s, 1.1 * s, o.eyes);
    },
  },
  // ─── Aurel, Vị Vua Tro Tàn: giáp tro nứt ánh lửa, áo choàng vàng sờn, hào quang mặt trời, vương miện tro ───
  aurel: {
    noCloak: true,
    back(L, s, o, wave) {
      const t = G.clock;
      ctx.save(); ctx.rotate(t * 0.25);
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r0 = 16 * s, r1 = (i % 2 ? 25 : 31 + Math.sin(t * 3 + i) * 2) * s; ctx.strokeStyle = `rgba(255,${200 + (i % 3) * 15},110,${i % 2 ? 0.35 : 0.6})`; ctx.lineWidth = (i % 2 ? 1.4 : 2.4); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
      ctx.restore();
      tatteredCape(s, L.cloak, 26, 12, wave, 8, '#fff0b0');
    },
    body(L, s) {
      blob(0, 0, 10 * s, 13 * s, litGrad(L.body, 3 * s, -3 * s, 14 * s));
      // vết nứt giáp lộ lửa bên trong
      const p = 0.55 + Math.sin(G.clock * 4) * 0.25;
      ctx.strokeStyle = `rgba(255,170,70,${p})`; ctx.shadowColor = '#ff9a3a'; ctx.shadowBlur = 8; ctx.lineWidth = 1.2 * s; ctx.beginPath();
      ctx.moveTo(5 * s, -8 * s); ctx.lineTo(1 * s, -4 * s); ctx.lineTo(3 * s, 0); ctx.lineTo(-1 * s, 5 * s); ctx.moveTo(-4 * s, -9 * s); ctx.lineTo(-6 * s, -3 * s); ctx.moveTo(-3 * s, 7 * s); ctx.lineTo(1 * s, 10 * s); ctx.stroke(); ctx.shadowBlur = 0;
      for (const sy of [-1, 1]) {
        poly([[5 * s, sy * 7 * s], [-5 * s, sy * 7 * s], [-7 * s, sy * 15 * s], [0, sy * 16.5 * s], [6 * s, sy * 13 * s]], litGrad(tint(L.body, 1.15), 0, sy * 11 * s, 8 * s), OL, 1.4);
        ctx.strokeStyle = L.trim; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(-6 * s, sy * 14 * s); ctx.lineTo(5 * s, sy * 12 * s); ctx.stroke();
        ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(-1 * s, sy * 12 * s, 1.1 * s, 0, TAU); ctx.fill();
      }
      resetLine();
    },
    head(L, s, o) {
      blob(2 * s, 0, 6.6 * s, 6.6 * s, litGrad(L.head, 4 * s, -2.5 * s, 8 * s));
      // vương miện tro: gai lởm chởm cháy âm ỉ ở đầu
      for (let i = 0; i < 9; i++) { const a = Math.PI - 2.2 + i / 8 * 4.4, bx = 2 * s + Math.cos(a) * 6 * s, by = Math.sin(a) * 6 * s, l = (i % 2 ? 9 : 12.5) * s, tx = 2 * s + Math.cos(a) * l, ty = Math.sin(a) * l, nx = -Math.sin(a) * 1.3 * s, ny = Math.cos(a) * 1.3 * s; poly([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]], i % 2 ? '#5a5048' : '#6e6258', OL, 1); ctx.fillStyle = 'rgba(255,170,70,.9)'; ctx.beginPath(); ctx.arc(tx, ty, 0.9 * s, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.beginPath(); ctx.ellipse(6 * s, 0, 2.2 * s, 4.2 * s, 0, 0, TAU); ctx.fill();
      glowEyes(6.6 * s, 0, 2 * s, 1.2 * s, o.eyes || '#fff3c0');
    },
  },
  // ─── Dornach, Vệ Binh Greystone: giáp tấm dày, mũ thùng có chùm lông đỏ, khiên tháp ở tay trái ───
  warden: {
    noCloak: true,
    back(L, s, o, wave) {
      // áo khoác ngắn nặng nề thêu hình tháp canh
      poly([[-2 * s, -11 * s], [-17 * s, -10 * s + wave * 0.3], [-19 * s, 10 * s - wave * 0.3], [-2 * s, 11 * s]], litGrad(L.cloak, -9 * s, 0, 14 * s), OL, 1.6);
      ctx.fillStyle = L.trim; ctx.fillRect(-15 * s, -3 * s, 7 * s, 6 * s); ctx.fillRect(-16.5 * s, -4 * s, 2 * s, 8 * s);
      ctx.fillStyle = tint(L.cloak, 0.7); ctx.fillRect(-13 * s, -1 * s, 2 * s, 2 * s);
    },
    offhand(L, s, o) {
      // khiên tháp: tấm sắt dày cong, đinh tán dọc mép, dải huy hiệu
      ctx.save(); ctx.translate(8 * s, -10 * s); ctx.rotate(o.guard ? 0.1 : -0.25);
      ctx.fillStyle = litGrad('#5a606a', 1 * s, -6 * s, 16 * s); ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(-3 * s, -14 * s, 6.5 * s, 26 * s, 2 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = L.trim; ctx.fillRect(-1 * s, -12 * s, 2.5 * s, 22 * s);
      ctx.fillStyle = '#c8ccd2'; for (let k = -12; k <= 10; k += 4.4) for (const x of [-2, 2.5]) { ctx.beginPath(); ctx.arc(x * s, k * s, 0.8 * s, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3 * s, -13 * s); ctx.lineTo(3 * s, 11 * s); ctx.stroke();
      ctx.restore();
    },
    body(L, s) {
      ctx.beginPath(); ctx.roundRect(-10 * s, -12.5 * s, 20 * s, 25 * s, 7 * s); ctx.fillStyle = litGrad(L.body, 4 * s, -4 * s, 16 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = tint(L.body, 0.55); ctx.lineWidth = 1.2 * s; ctx.beginPath(); for (const k of [-5, 0, 5]) { ctx.moveTo(-8 * s, k * s); ctx.quadraticCurveTo(0, k * s + 1.5 * s, 8 * s, k * s); } ctx.stroke();
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(-9 * s, 0); ctx.lineTo(9 * s, 0); ctx.stroke();
      for (const sy of [-1, 1]) {
        // giáp vai vuông khổng lồ có ba gai
        ctx.beginPath(); ctx.roundRect(-6 * s, sy > 0 ? 7 * s : -15 * s, 12 * s, 8 * s, 2.5 * s); ctx.fillStyle = litGrad(tint(L.body, 1.2), 1 * s, sy * 11 * s, 8 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
        for (const k of [-3.5, 0, 3.5]) poly([[k * s - 1.4 * s, sy * 14.6 * s], [k * s, sy * 19 * s], [k * s + 1.4 * s, sy * 14.6 * s]], '#c8ccd2', OL, 1);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-5 * s, sy > 0 ? 8 * s : -14 * s, 10 * s, 1.2 * s);
      }
      resetLine();
    },
    head(L, s, o, wave) {
      // chùm lông đỏ chạy dọc đỉnh mũ, bay ra sau
      ctx.strokeStyle = OL; ctx.lineWidth = 5.4 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(-6 * s, wave * 0.5, -15 * s, wave); ctx.stroke();
      ctx.strokeStyle = '#a02a20'; ctx.lineWidth = 3.8 * s; ctx.stroke(); ctx.strokeStyle = '#d04a38'; ctx.lineWidth = 1.2 * s; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.roundRect(-4.5 * s, -6.2 * s, 12.5 * s, 12.4 * s, 3 * s); ctx.fillStyle = litGrad(L.head, 4 * s, -3 * s, 9 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 3.2 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(-6 * s, wave * 0.5, -13 * s, wave); ctx.stroke(); ctx.strokeStyle = '#b8342a'; ctx.lineWidth = 2.4 * s; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#0c0c0e'; ctx.fillRect(6 * s, -4 * s, 1.8 * s, 8 * s); ctx.fillRect(4.5 * s, -0.8 * s, 3.4 * s, 1.6 * s);
      ctx.fillStyle = '#c8ccd2'; for (const y of [-4.6, 4.6]) { ctx.beginPath(); ctx.arc(-2.5 * s, y * s, 0.9 * s, 0, TAU); ctx.fill(); }
      if (o.eyes) glowEyes(7 * s, 0, 2 * s, 0.9 * s, o.eyes);
    },
  },
  // ─── Seluna, Nữ Vương Hồn Ma: không chân, thân tan thành đuôi khói, tóc dài bay, vương miện băng ───
  wraith: {
    noCloak: true,
    back(L, s, o) {
      const t = G.clock;
      for (let k = 0; k < 4; k++) {
        const w = (9 - k * 1.8) * s, len = (26 + k * 5) * s, ph = t * 3 + k * 1.3;
        const g = ctx.createLinearGradient(0, 0, -len, 0); g.addColorStop(0, `rgba(190,215,250,${0.85 - k * 0.12})`); g.addColorStop(0.6, `rgba(150,180,235,${0.45 - k * 0.08})`); g.addColorStop(1, 'rgba(150,180,235,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w);
        ctx.bezierCurveTo(-len * 0.35, -w + Math.sin(ph) * 4 * s, -len * 0.7, -w * 0.4 + Math.sin(ph + 1) * 5 * s, -len, Math.sin(ph + 2) * 5 * s);
        ctx.bezierCurveTo(-len * 0.7, w * 0.4 + Math.sin(ph + 1.5) * 5 * s, -len * 0.35, w + Math.sin(ph + 0.5) * 4 * s, 0, w); ctx.closePath(); ctx.fill();
      }
      // tóc dài bạc xanh bay ra sau
      ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) { const ph = t * 4 + i; ctx.strokeStyle = i % 2 ? 'rgba(220,235,255,.8)' : 'rgba(170,195,235,.8)'; ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.moveTo(-1 * s, i * 1.2 * s); ctx.quadraticCurveTo(-10 * s, i * 2.4 * s + Math.sin(ph) * 3 * s, -20 * s, i * 3.2 * s + Math.sin(ph + 1) * 4 * s); ctx.stroke(); }
      ctx.lineCap = 'butt';
    },
    body(L, s) {
      const gl = ctx.createRadialGradient(1 * s, 0, 1, 1 * s, 0, 12 * s); gl.addColorStop(0, 'rgba(230,245,255,.95)'); gl.addColorStop(0.6, L.body); gl.addColorStop(1, 'rgba(90,110,160,.8)');
      blob(0, 0, 7 * s, 10 * s, gl);
      // tay gầy guộc và ngọn lửa hồn trong ngực
      for (const sy of [-1, 1]) { olLine(1 * s, sy * 8 * s, 6 * s, sy * 11 * s, 1.8 * s, '#b8c8e8'); }
      ctx.fillStyle = 'rgba(160,240,255,.9)'; ctx.shadowColor = '#9ff0ff'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(2 * s, 0, (1.8 + Math.sin(G.clock * 6) * 0.4) * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.ellipse(0, 0, 7 * s, 10 * s, 0, -1.2, 1.2); ctx.stroke();
      resetLine();
    },
    head(L, s, o) {
      blob(2 * s, 0, 5.6 * s, 5.6 * s, litGrad('#dfe8f8', 4 * s, -2 * s, 7 * s));
      // vương miện băng: gai trong suốt xòe ra sau
      for (let i = 0; i < 7; i++) { const a = Math.PI - 1.5 + i / 6 * 3, bx = 2 * s + Math.cos(a) * 5 * s, by = Math.sin(a) * 5 * s, l = (i % 2 ? 9 : 12) * s; poly([[bx - Math.sin(a) * 1.3 * s, by + Math.cos(a) * 1.3 * s], [2 * s + Math.cos(a) * l, Math.sin(a) * l], [bx + Math.sin(a) * 1.3 * s, by - Math.cos(a) * 1.3 * s]], 'rgba(200,235,255,.85)', 'rgba(40,70,110,.8)', 1); }
      ctx.fillStyle = 'rgba(20,30,50,.6)'; ctx.beginPath(); ctx.ellipse(6 * s, 0, 1.6 * s, 3.6 * s, 0, 0, TAU); ctx.fill();
      glowEyes(6.3 * s, 0, 1.8 * s, 1 * s, o.eyes || '#bff5ff');
    },
  },
  // ─── Selvara, Nữ Hoàng Trăng Pha Lê: váy tròn xòe, vương miện pha lê cao, pha lê bay quanh người ───
  selvara: {
    noCloak: true,
    back(L, s, o) {
      const g = ctx.createRadialGradient(-2 * s, 0, 2 * s, -3 * s, 0, 19 * s); g.addColorStop(0, tint(L.body, 1.3)); g.addColorStop(0.7, L.cloak); g.addColorStop(1, tint(L.cloak, 0.7));
      blob(-3 * s, 0, 18 * s, 17 * s, g, 0, OL, 1.8);
      ctx.strokeStyle = 'rgba(200,225,255,.35)'; ctx.lineWidth = 1 * s; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.moveTo(-3 * s + Math.cos(a) * 7 * s, Math.sin(a) * 7 * s); ctx.lineTo(-3 * s + Math.cos(a) * 17 * s, Math.sin(a) * 16 * s); } ctx.stroke();
      // viền váy nạm pha lê
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + 0.1, x = -3 * s + Math.cos(a) * 17 * s, y = Math.sin(a) * 16 * s; poly([[x, y - 1.8 * s], [x + 1.3 * s, y], [x, y + 1.8 * s], [x - 1.3 * s, y]], 'rgba(220,240,255,.9)', 'rgba(40,70,110,.7)', 0.8); }
    },
    body(L, s) {
      blob(0, 0, 7.5 * s, 9.5 * s, litGrad(L.body, 3 * s, -3 * s, 11 * s));
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(4 * s, -7 * s); ctx.quadraticCurveTo(7 * s, 0, 4 * s, 7 * s); ctx.stroke();
      poly([[5 * s, 0], [3 * s, -2 * s], [1 * s, 0], [3 * s, 2 * s]], '#cfeaff', 'rgba(40,70,110,.8)', 1);
      for (const sy of [-1, 1]) poly([[4 * s, sy * 7 * s], [0, sy * 12.5 * s], [-4 * s, sy * 7.5 * s], [0, sy * 8 * s]], 'rgba(190,225,255,.9)', 'rgba(40,70,110,.8)', 1.1);
      resetLine();
    },
    head(L, s, o) {
      blob(-1 * s, 0, 4 * s, 3.4 * s, '#c8d8f8', 0, OL, 1.2);
      blob(2 * s, 0, 5.6 * s, 5.6 * s, litGrad(L.head, 4 * s, -2 * s, 7 * s));
      ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10;
      for (let i = 0; i < 5; i++) { const a = Math.PI - 1.1 + i / 4 * 2.2, l = (i === 2 ? 16 : i % 2 ? 12 : 10) * s, bx = 2 * s + Math.cos(a) * 4.5 * s, by = Math.sin(a) * 4.5 * s, nx = -Math.sin(a) * 1.8 * s, ny = Math.cos(a) * 1.8 * s; poly([[bx + nx, by + ny], [2 * s + Math.cos(a) * l, Math.sin(a) * l], [bx - nx, by - ny]], 'rgba(200,235,255,.92)', 'rgba(40,70,110,.8)', 1); }
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(30,40,80,.5)'; ctx.beginPath(); ctx.ellipse(6 * s, 0, 1.4 * s, 3.4 * s, 0, 0, TAU); ctx.fill();
      glowEyes(6.3 * s, 0, 1.8 * s, 0.9 * s, o.eyes || '#cfeaff');
    },
    top(L, s) {
      // bốn mảnh pha lê bay quanh
      const t = G.clock;
      for (let i = 0; i < 4; i++) { const a = t * 1.4 + i / 4 * TAU, x = Math.cos(a) * 24 * s, y = Math.sin(a) * 22 * s; ctx.save(); ctx.translate(x, y); ctx.rotate(a * 2); ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10; poly([[0, -4 * s], [2 * s, 0], [0, 4 * s], [-2 * s, 0]], 'rgba(210,240,255,.9)', 'rgba(40,70,110,.8)', 1); ctx.restore(); }
      ctx.shadowBlur = 0;
    },
  },
  // ─── Veyl, Đô Đốc Chết Đuối: thân phù nề, áo khoác hải quân đuôi dài, cầu vai vàng, mũ ba sừng, hà bám ───
  admiral: {
    noCloak: true,
    back(L, s, o, wave) {
      for (const sy of [-1, 1]) poly([[-4 * s, sy * 3 * s], [-8 * s, sy * 11 * s], [-25 * s, sy * 12 * s + wave], [-23 * s, sy * 6 * s + wave], [-26 * s, sy * 2 * s + wave]], litGrad(L.cloak, -14 * s, sy * 7 * s, 14 * s), OL, 1.5);
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1 * s; ctx.beginPath(); for (const sy of [-1, 1]) { ctx.moveTo(-8 * s, sy * 11 * s); ctx.lineTo(-25 * s, sy * 12 * s + wave); } ctx.stroke();
      ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round'; ctx.beginPath(); for (const k of [-6, 2, 8]) { ctx.moveTo(-8 * s, k * s); ctx.quadraticCurveTo(-16 * s, k * s + wave, -22 * s, k * 1.3 * s - wave); } ctx.stroke(); ctx.lineCap = 'butt';
    },
    body(L, s) {
      blob(0, 0, 11.5 * s, 14 * s, litGrad(L.body, 4 * s, -4 * s, 16 * s));
      ctx.strokeStyle = tint(L.body, 0.6); ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(8 * s, -9 * s); ctx.quadraticCurveTo(12 * s, 0, 8 * s, 9 * s); ctx.stroke();
      ctx.fillStyle = L.trim; for (const y of [-3.5, 3.5]) for (const x of [-4, 0, 4]) { ctx.beginPath(); ctx.arc(x * s + 3 * s, y * s, 1 * s, 0, TAU); ctx.fill(); }
      for (const sy of [-1, 1]) {
        blob(1 * s, sy * 12 * s, 5.5 * s, 3.6 * s, litGrad(L.trim, 2 * s, sy * 11 * s, 6 * s), 0, OL, 1.2);
        ctx.strokeStyle = L.trim; ctx.lineWidth = 0.9; ctx.beginPath(); for (let k = -4; k <= 5; k += 1.5) { ctx.moveTo(k * s, sy * 15 * s); ctx.lineTo(k * s - 0.6 * s, sy * 17.5 * s); } ctx.stroke();
      }
      // hà và rêu bám trên vai trái
      for (const [x, y, r] of [[-3, -9, 1.6], [-5, -6, 1.2], [-1, -11, 1.1], [-6, 9, 1.4], [-4, 11, 1]]) blob(x * s, y * s, r * s, r * s, '#b8b4a0', 0, 'rgba(40,40,30,.8)', 0.8);
      ctx.fillStyle = 'rgba(200,230,240,.3)'; ctx.beginPath(); ctx.ellipse(4 * s, -5 * s, 4 * s, 1.5 * s, 0.4, 0, TAU); ctx.fill();
      resetLine();
    },
    head(L, s, o) {
      blob(2.5 * s, 0, 7 * s, 7 * s, litGrad(L.head, 4 * s, -3 * s, 9 * s));
      // mũ ba sừng viền vàng
      ctx.beginPath(); ctx.moveTo(10 * s, 0); ctx.quadraticCurveTo(4 * s, -6 * s, -5 * s, -10.5 * s); ctx.quadraticCurveTo(-3 * s, 0, -5 * s, 10.5 * s); ctx.quadraticCurveTo(4 * s, 6 * s, 10 * s, 0); ctx.closePath();
      ctx.fillStyle = litGrad('#2a2420', 2 * s, -3 * s, 12 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1.2 * s; ctx.stroke();
      blob(1 * s, 0, 4 * s, 4.4 * s, '#2a2420', 0, 'rgba(0,0,0,.6)', 1);
      ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(1 * s, 0, 1.4 * s, 0, TAU); ctx.fill();
      if (o.eyes) glowEyes(8 * s, 0, 2.2 * s, 0.9 * s, '#7ff0c0');
    },
  },
  // ─── Kỵ Sĩ Mộ Phần: giáp gỉ vỡ, lồng ngực lộ lửa hồn xanh, mũ sọ có sừng, lá cờ rách cắm sau lưng ───
  graveknight: {
    noCloak: true,
    back(L, s, o, wave) {
      tatteredCape(s, L.cloak, 20, 10, wave, 7);
      // cán cờ và lá cờ rách
      olLine(-2 * s, -7 * s, -24 * s, -15 * s, 1.6 * s, '#4a3a2a');
      const t = G.clock;
      ctx.beginPath(); ctx.moveTo(-10 * s, -10 * s); ctx.lineTo(-24 * s, -15 * s);
      for (let k = 0; k <= 4; k++) ctx.lineTo(-24 * s - k * 2.4 * s + Math.sin(t * 4 + k) * 1.4 * s, -15 * s + (k % 2 ? 9 : 12) * s + Math.sin(t * 3 + k) * 1.5 * s);
      ctx.lineTo(-12 * s, -1 * s); ctx.closePath(); ctx.fillStyle = '#3a4a6a'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = 'rgba(200,220,255,.5)'; ctx.beginPath(); ctx.arc(-18 * s, -8 * s, 1.8 * s, 0, TAU); ctx.fill();
    },
    body(L, s) {
      blob(0, 0, 9 * s, 12 * s, litGrad(L.body, 3 * s, -3 * s, 13 * s));
      // giáp vỡ lộ lồng ngực, lửa hồn cháy bên trong
      const gl = ctx.createRadialGradient(2 * s, 0, 0.5, 2 * s, 0, 7 * s); gl.addColorStop(0, 'rgba(200,245,255,.95)'); gl.addColorStop(0.5, 'rgba(90,170,255,.7)'); gl.addColorStop(1, 'rgba(20,30,60,.9)');
      poly([[6 * s, -5 * s], [3 * s, -7 * s], [-3 * s, -4 * s], [-2 * s, 1 * s], [-4 * s, 5 * s], [3 * s, 7 * s], [7 * s, 3 * s]], gl, OL, 1.2);
      ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 1.1 * s; ctx.beginPath(); for (const k of [-4, -1.5, 1.5, 4]) { ctx.moveTo(-1 * s, k * s); ctx.quadraticCurveTo(3 * s, k * s - 1 * s, 5.5 * s, k * 0.9 * s); } ctx.stroke();
      ctx.fillStyle = 'rgba(140,90,50,.55)'; for (const [x, y] of [[-5, -7], [-6, 6], [5, 9], [-2, -10]]) { ctx.beginPath(); ctx.arc(x * s, y * s, 1.4 * s, 0, TAU); ctx.fill(); }
      for (const sy of [-1, 1]) {
        poly([[4 * s, sy * 7 * s], [-4 * s, sy * 7 * s], [-5 * s, sy * 13 * s], [1 * s, sy * 14 * s], [5 * s, sy * 11 * s]], litGrad(L.body, 0, sy * 10 * s, 7 * s), OL, 1.3);
        ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-2 * s, sy * 8 * s); ctx.lineTo(0, sy * 11 * s); ctx.lineTo(-1 * s, sy * 13 * s); ctx.stroke();
      }
      resetLine();
    },
    head(L, s, o) {
      for (const sy of [-1, 1]) { ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 3.4 * s; ctx.beginPath(); ctx.moveTo(1 * s, sy * 4.5 * s); ctx.quadraticCurveTo(-5 * s, sy * 11 * s, -12 * s, sy * 9 * s); ctx.stroke(); ctx.strokeStyle = '#d8cfb8'; ctx.lineWidth = 2 * s; ctx.stroke(); ctx.lineCap = 'butt'; }
      blob(2 * s, 0, 6.2 * s, 6.2 * s, litGrad(L.head, 4 * s, -2 * s, 8 * s));
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.arc(2 * s, 0, 5.2 * s, 2.2, 4.1); ctx.stroke();
      ctx.fillStyle = '#0a0c10'; ctx.fillRect(5.5 * s, -3.6 * s, 2 * s, 7.2 * s);
      ctx.fillStyle = 'rgba(160,220,255,.95)'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 12;
      for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(6.5 * s, sy * 2 * s); ctx.quadraticCurveTo(2 * s, sy * 3 * s + Math.sin(G.clock * 9 + sy) * s, -2 * s, sy * 2.4 * s); ctx.lineTo(6.5 * s, sy * 1.2 * s); ctx.fill(); }
      ctx.shadowBlur = 0;
    },
  },
  // ─── Khổng Lồ Pha Lê: gù lưng, cụm pha lê mọc trên lưng và vai, đầu nhỏ, cuốc chim khổng lồ ───
  minerg: {
    noCloak: true,
    back(L, s) {
      ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10;
      for (const [x, y, a, l, w] of [[-6, -5, 3.5, 13, 3], [-8, 2, 3.1, 16, 3.6], [-5, 7, 2.6, 12, 2.8], [-11, -2, 3.3, 10, 2.4], [-2, -9, 4.1, 10, 2.6], [-1, 10, 2.1, 9, 2.4]]) {
        const tx = x * s + Math.cos(a) * l * s, ty = y * s + Math.sin(a) * l * s, nx = -Math.sin(a) * w * s, ny = Math.cos(a) * w * s;
        poly([[x * s + nx, y * s + ny], [tx, ty], [x * s - nx, y * s - ny]], 'rgba(170,215,255,.9)', 'rgba(30,60,100,.85)', 1.1);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x * s + nx * 0.5, y * s + ny * 0.5); ctx.lineTo(tx, ty); ctx.lineTo(x * s, y * s); ctx.closePath(); ctx.fill();
      }
      ctx.shadowBlur = 0;
    },
    body(L, s) {
      blob(-1 * s, 0, 12 * s, 15 * s, litGrad(L.body, 3 * s, -4 * s, 17 * s), 0, OL, 1.8);
      ctx.strokeStyle = tint(L.body, 0.55); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(5 * s, -8 * s); ctx.lineTo(1 * s, -3 * s); ctx.lineTo(4 * s, 2 * s); ctx.moveTo(-6 * s, 6 * s); ctx.lineTo(-2 * s, 10 * s); ctx.stroke();
      for (const sy of [-1, 1]) {
        blob(1 * s, sy * 12 * s, 6.5 * s, 5.5 * s, litGrad(tint(L.body, 0.9), 2 * s, sy * 11 * s, 7 * s), 0, OL, 1.4);
        poly([[0, sy * 14 * s], [2 * s, sy * 20 * s], [3.5 * s, sy * 14 * s]], 'rgba(190,230,255,.9)', 'rgba(30,60,100,.85)', 1);
      }
      resetLine();
    },
    head(L, s, o) {
      blob(5 * s, 0, 5.2 * s, 5.6 * s, litGrad(L.head, 6 * s, -2 * s, 7 * s));
      poly([[3 * s, -1.6 * s], [-3 * s, 0], [3 * s, 1.6 * s]], 'rgba(200,240,255,.95)', 'rgba(30,60,100,.85)', 1);
      ctx.strokeStyle = 'rgba(10,20,30,.8)'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(9.5 * s, -2.4 * s); ctx.lineTo(9.5 * s, 2.4 * s); ctx.stroke();
      glowEyes(8.4 * s, 0, 2.2 * s, 1 * s, '#cfefff');
    },
  },
  // ─── Hộ Vệ Đá Cổ: thân ghép từ khối đá, khe dung nham phát sáng, không vũ khí, hai nắm đấm đá khổng lồ ───
  golem: {
    noCloak: true,
    offhand(L, s, o) {
      // tay trái: cánh tay khối đá và nắm đấm thả lỏng
      ctx.fillStyle = litGrad('#6a6258', 6 * s, -14 * s, 8 * s); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.roundRect(1 * s, -17 * s, 8 * s, 6 * s, 1.5 * s); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(8 * s, -19 * s, 9 * s, 9 * s, 2.5 * s); ctx.fillStyle = litGrad('#7a7066', 12 * s, -16 * s, 9 * s); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,16,12,.6)'; ctx.lineWidth = 0.9; ctx.beginPath(); for (const k of [-17, -14.5, -12]) { ctx.moveTo(14 * s, k * s); ctx.lineTo(17 * s, k * s); } ctx.stroke();
    },
    body(L, s) {
      ctx.beginPath(); ctx.roundRect(-11 * s, -13 * s, 22 * s, 26 * s, 4 * s); ctx.fillStyle = litGrad(L.body, 4 * s, -5 * s, 18 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(20,16,12,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(-11 * s, -4 * s); ctx.lineTo(11 * s, -5 * s); ctx.moveTo(-11 * s, 5 * s); ctx.lineTo(11 * s, 4 * s); ctx.moveTo(-3 * s, -13 * s); ctx.lineTo(-2 * s, -4.5 * s); ctx.moveTo(4 * s, -4.8 * s); ctx.lineTo(3 * s, 4.3 * s); ctx.moveTo(-4 * s, 4.8 * s); ctx.lineTo(-3 * s, 13 * s); ctx.stroke();
      const p = 0.6 + Math.sin(G.clock * 3) * 0.3;
      ctx.strokeStyle = `rgba(255,140,50,${p})`; ctx.shadowColor = '#ff8a3a'; ctx.shadowBlur = 10; ctx.lineWidth = 1.4 * s; ctx.beginPath();
      ctx.moveTo(8 * s, -9 * s); ctx.lineTo(5 * s, -6 * s); ctx.lineTo(6 * s, -2 * s); ctx.moveTo(-7 * s, 8 * s); ctx.lineTo(-4 * s, 10 * s); ctx.stroke();
      // vòng rune trên ngực
      ctx.strokeStyle = `rgba(255,170,80,${p})`; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(1 * s, 0, 3.6 * s, 0, TAU); ctx.moveTo(1 * s, -3.6 * s); ctx.lineTo(1 * s, 3.6 * s); ctx.moveTo(-2.2 * s, -1.5 * s); ctx.lineTo(4 * s, 1.5 * s); ctx.stroke(); ctx.shadowBlur = 0;
      for (const sy of [-1, 1]) { blob(-1 * s, sy * 13 * s, 6.5 * s, 5 * s, litGrad('#7a7066', 0, sy * 12 * s, 7 * s), 0.2 * sy, OL, 1.4); ctx.fillStyle = 'rgba(96,120,58,.6)'; ctx.beginPath(); ctx.ellipse(-3 * s, sy * 14 * s, 2.6 * s, 1.4 * s, 0, 0, TAU); ctx.fill(); }
      resetLine();
    },
    head(L, s) {
      ctx.beginPath(); ctx.roundRect(1 * s, -4.5 * s, 8 * s, 9 * s, 2 * s); ctx.fillStyle = litGrad(L.head, 6 * s, -2 * s, 7 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#ffb060'; ctx.shadowColor = '#ff8a3a'; ctx.shadowBlur = 12; ctx.fillRect(7 * s, -2.8 * s, 1.6 * s, 5.6 * s); ctx.shadowBlur = 0;
    },
  },
  // ─── Nhà Vô Địch Hoàng Gia: giáp vàng, mũ sư tử bờm gai, áo choàng đỏ viền vàng, song kiếm ───
  royalchamp: {
    noCloak: true,
    back(L, s, o, wave) {
      royalCape(s, L.cloak, L.trim, 27, 10, 14, wave);
      ctx.fillStyle = L.trim; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 2 * s : 4 * s; ctx.lineTo(-17 * s + Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    },
    offhand(L, s, o) {
      // thanh kiếm thứ hai ở tay trái, chĩa chéo về trước
      ctx.save(); ctx.translate(3 * s, -8 * s); ctx.rotate(o.trail ? -0.9 : -0.35);
      WFORM.royal(L, s * 0.85, L.wlen * s * 0.8);
      ctx.fillStyle = '#3a2f24'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(1.5 * s, 0, 2.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
    body(L, s) {
      blob(0, 0, 9.5 * s, 12 * s, litGrad(L.body, 3 * s, -3 * s, 13 * s));
      ctx.fillStyle = L.trim; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 1.8 * s : 3.6 * s; ctx.lineTo(3 * s + Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = tint(L.body, 0.6); ctx.lineWidth = 1 * s; ctx.beginPath(); for (const k of [-8, -5]) { ctx.moveTo(k * s, -9 * s); ctx.quadraticCurveTo(k * s - 1 * s, 0, k * s, 9 * s); } ctx.stroke();
      for (const sy of [-1, 1]) for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc((3 - k * 2.5) * s, sy * 10 * s, (5 - k * 0.6) * s, sy > 0 ? -0.3 : 0.3 - Math.PI, sy > 0 ? Math.PI + 0.3 : -0.3, sy < 0); ctx.closePath();
        ctx.fillStyle = litGrad(tint(L.body, 1.15 - k * 0.1), 2 * s, sy * 10 * s, 6 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      }
      resetLine();
    },
    head(L, s, o) {
      // bờm sư tử: vòng gai vàng quanh mũ
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, l = (i % 2 ? 9 : 11) * s, bx = 2 * s + Math.cos(a) * 5.5 * s, by = Math.sin(a) * 5.5 * s; if (Math.cos(a) > 0.75) continue; poly([[bx - Math.sin(a) * 1.8 * s, by + Math.cos(a) * 1.8 * s], [2 * s + Math.cos(a) * l, Math.sin(a) * l], [bx + Math.sin(a) * 1.8 * s, by - Math.cos(a) * 1.8 * s]], i % 2 ? '#c9a040' : '#e8c060', OL, 1); }
      blob(2 * s, 0, 6.2 * s, 6.2 * s, litGrad(L.head, 4 * s, -2 * s, 8 * s));
      ctx.fillStyle = '#1a140c'; ctx.beginPath(); ctx.moveTo(8 * s, -3 * s); ctx.lineTo(5.5 * s, 0); ctx.lineTo(8 * s, 3 * s); ctx.lineTo(7 * s, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = L.trim; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(-3 * s, 0); ctx.lineTo(7 * s, 0); ctx.stroke();
      if (o.eyes) glowEyes(6.8 * s, 0, 1.9 * s, 0.9 * s, '#ffd76a');
    },
  },
};

// ───────────────────────── vũ khí riêng của boss ─────────────────────────
Object.assign(WFORM, {
  // mỏ neo xích: thân neo, thanh ngang, hai càng cong có ngạnh
  anchor(L, s, len) {
    ctx.strokeStyle = '#6a6a66'; ctx.lineWidth = 1.2 * s; for (let x = -2 * s; x < len * 0.3; x += 3.4 * s) { ctx.beginPath(); ctx.ellipse(x, 0, 1.8 * s, 1.1 * s, 0, 0, TAU); ctx.stroke(); }
    olLine(len * 0.3, 0, len, 0, 3 * s, L.wcol);
    olLine(len * 0.42, -7 * s, len * 0.42, 7 * s, 2.2 * s, L.wcol);
    ctx.fillStyle = L.wcol; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(len * 0.42, sy * 7.5 * s, 1.6 * s, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 4.4 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(len - 12 * s, -13 * s); ctx.quadraticCurveTo(len + 4 * s, -8 * s, len, 0); ctx.quadraticCurveTo(len + 4 * s, 8 * s, len - 12 * s, 13 * s); ctx.stroke();
    ctx.strokeStyle = litGrad(L.wcol, len, -6 * s, 16 * s); ctx.lineWidth = 3 * s; ctx.stroke(); ctx.lineCap = 'butt';
    for (const sy of [-1, 1]) poly([[len - 12 * s, sy * 13 * s], [len - 16 * s, sy * 9 * s], [len - 8 * s, sy * 11 * s]], L.wcol, OL, 1.1);
    ctx.fillStyle = 'rgba(180,176,150,.8)'; for (const [x, y] of [[0.6, 1], [0.75, -1], [0.9, 0.5]]) { ctx.beginPath(); ctx.arc(len * x, y * s, 1.2 * s, 0, TAU); ctx.fill(); }
  },
  // cuốc chim khổng lồ: cán gỗ, đầu sắt hai mũi, đầu mũi mọc pha lê
  pickaxe(L, s, len) {
    olLine(-6 * s, 0, len, 0, 3.2 * s, '#5a4630');
    ctx.fillStyle = '#b08d4c'; ctx.fillRect(len * 0.3, -2 * s, 2.4 * s, 4 * s);
    ctx.beginPath(); ctx.moveTo(len - 2 * s, -2.5 * s); ctx.quadraticCurveTo(len - 6 * s, -12 * s, len - 16 * s, -19 * s); ctx.quadraticCurveTo(len - 3 * s, -14 * s, len + 3 * s, -3 * s);
    ctx.lineTo(len + 3 * s, 3 * s); ctx.quadraticCurveTo(len - 3 * s, 14 * s, len - 16 * s, 19 * s); ctx.quadraticCurveTo(len - 6 * s, 12 * s, len - 2 * s, 2.5 * s); ctx.closePath();
    ctx.fillStyle = litGrad('#6a7078', len - 4 * s, -8 * s, 18 * s); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 8;
    for (const sy of [-1, 1]) poly([[len - 13 * s, sy * 16 * s], [len - 20 * s, sy * 23 * s], [len - 16 * s, sy * 15 * s]], 'rgba(190,230,255,.95)', 'rgba(30,60,100,.85)', 1);
    ctx.shadowBlur = 0;
  },
  // nắm đấm đá: cẳng tay ghép khối, nắm tay vuông to có khe dung nham
  fist(L, s, len) {
    ctx.fillStyle = litGrad('#6a6258', len * 0.4, -3 * s, len * 0.5); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-2 * s, -4 * s, len * 0.62, 8 * s, 2 * s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(len * 0.55, -7 * s, len * 0.45 + 2 * s, 14 * s, 3 * s); ctx.fillStyle = litGrad('#7a7066', len * 0.8, -4 * s, 12 * s); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,16,12,.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (const k of [-3.5, 0, 3.5]) { ctx.moveTo(len - 3 * s, k * s); ctx.lineTo(len + 2 * s, k * s); } ctx.moveTo(len * 0.3, -4 * s); ctx.lineTo(len * 0.32, 4 * s); ctx.stroke();
    ctx.strokeStyle = `rgba(255,140,50,${0.6 + Math.sin(G.clock * 3) * 0.3})`; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(len * 0.62, -5 * s); ctx.lineTo(len * 0.7, 0); ctx.lineTo(len * 0.66, 5 * s); ctx.stroke();
  },
  // gậy trăng: cán bạc, đầu hình trăng khuyết ôm lấy viên pha lê
  moonstaff(L, s, len, o) {
    olLine(-8 * s, 0, len - 4 * s, 0, 2.4 * s, '#c8ccd8');
    ctx.fillStyle = '#8a9ac0'; for (const k of [0.25, 0.5]) ctx.fillRect(len * k, -1.8 * s, 1.8 * s, 3.6 * s);
    ctx.beginPath(); ctx.arc(len + 2 * s, 0, 9 * s, -1.9, 1.9); ctx.arc(len + 6 * s, 0, 7.5 * s, 1.75, -1.75, true); ctx.closePath();
    ctx.fillStyle = litGrad('#e8f0ff', len, -4 * s, 10 * s); ctx.fill(); ctx.strokeStyle = 'rgba(30,50,90,.85)'; ctx.lineWidth = 1.2; ctx.stroke();
    const c = o && o.charge || 0;
    ctx.fillStyle = '#cfeaff'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10 + c * 18; ctx.beginPath(); ctx.arc(len + 3 * s, 0, (2.6 + c * 3) * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  },
  // búa mặt trời của Aurel: cán dài, đầu búa là đĩa vàng tỏa tia
  sunhammer(L, s, len) {
    olLine(-12 * s, 0, len - 6 * s, 0, 3 * s, '#5a4a38');
    ctx.fillStyle = '#e8c060'; for (const k of [0.2, 0.45, 0.7]) ctx.fillRect(len * k, -2 * s, 2 * s, 4 * s);
    ctx.save(); ctx.translate(len, 0); ctx.rotate(G.clock * 0.8);
    ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 7 * s : 11 * s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.shadowBlur = 0; blob(0, 0, 5.5 * s, 5.5 * s, litGrad('#f0c85a', -1 * s, -1 * s, 6 * s), 0, OL, 1.2);
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(0, 0, 2 * s, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // đại kiếm mộ: lưỡi gỉ sứt mẻ, lửa hồn xanh liếm dọc sống kiếm
  gravesword(L, s, len) {
    const b0 = 7 * s, hw = 3.8 * s;
    ctx.fillStyle = litGrad('#7a6a58', len * 0.5, -hw, len * 0.6); ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(b0, -hw); ctx.lineTo(len * 0.4, -hw); ctx.lineTo(len * 0.44, -hw * 0.55); ctx.lineTo(len * 0.5, -hw); ctx.lineTo(len - 6 * s, -hw * 0.8); ctx.lineTo(len, 0); ctx.lineTo(len - 5 * s, hw * 0.9); ctx.lineTo(len * 0.7, hw); ctx.lineTo(len * 0.66, hw * 0.5); ctx.lineTo(len * 0.6, hw); ctx.lineTo(b0, hw); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(140,80,40,.5)'; for (const k of [0.3, 0.55, 0.8]) { ctx.beginPath(); ctx.arc(len * k, hw * 0.3, 1.4 * s, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(150,215,255,.85)'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10; ctx.lineWidth = 1.2 * s; ctx.beginPath();
    for (let x = b0; x < len - 4 * s; x += 3 * s) ctx.lineTo(x, -hw - 1 * s - Math.abs(Math.sin(G.clock * 8 + x)) * 2.4 * s);
    ctx.stroke(); ctx.shadowBlur = 0;
    swordHilt(s, hw + 1 * s, '#4a4a52', 3.6);
  },
});

// ───────────────────────── Thú Aurum: sư tử rồng có cánh bằng ánh sáng ─────────────────────────
// thân dài có vảy vàng, bốn chân bước theo nhịp, bờm tia sáng quanh đầu, sừng vuốt ngược, đôi cánh lông vũ và đuôi dài phát sáng
function drawAurumBeast(f, alpha) {
  const z = f.z || 0, t = f.anim, walk = f.state === 'chase' || f.state === 'atk' ? t * 5 : t * 1.2, s = 1.15;
  const flap = Math.sin(t * (z > 10 ? 6 : 1.6)) * (z > 10 ? 0.3 : 0.08);
  shadow(f.x, f.y + 14, 92, 40, 0.35 * alpha);
  ctx.save(); ctx.globalAlpha = alpha * (f.state === 'transform' ? Math.min(1, (f.t - 1.8) / 1.2) : 1); ctx.translate(f.x, f.y - z);
  // vầng sáng dưới thân
  const hg = ctx.createRadialGradient(0, 0, 10, 0, 0, 110); hg.addColorStop(0, 'rgba(255,220,130,.35)'); hg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill();
  ctx.rotate(f.face); ctx.scale(s, s);
  // đuôi: các đốt thu nhỏ dần, uốn theo nhịp, chóp đuôi là ngọn lửa trắng
  let px = -34, py = 0;
  for (let i = 0; i < 12; i++) {
    const nx = px - 7.5, ny = Math.sin(t * 2.2 - i * 0.45) * (2 + i * 1.3), r = 11 - i * 0.75;
    blob(nx, ny, r * 1.1, r, litGrad('#f0cf72', nx - r * 0.3, ny - r * 0.4, r * 1.2), 0, 'rgba(110,70,15,.75)', 1.2);
    if (i % 2 === 0) poly([[nx + 2, ny - r * 0.2], [nx - 3, ny - r - 3], [nx - 4, ny - r * 0.2]], '#fff1b8', 'rgba(110,70,15,.7)', 0.9);
    px = nx; py = ny;
  }
  const tg = ctx.createRadialGradient(px - 6, py, 1, px - 6, py, 18); tg.addColorStop(0, 'rgba(255,255,240,1)'); tg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(px - 6, py, 18, 0, TAU); ctx.fill();
  // đôi cánh ánh sáng: xương cánh, lông vũ xếp tầng
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(4, sd * 16); ctx.rotate(sd * (0.35 + flap));
    const W = 96, g = ctx.createLinearGradient(0, 0, -30, sd * W); g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,210,120,.25)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, sd * W * 0.5, -8, sd * W);
    for (let k = 0; k <= 6; k++) { const u = k / 6; ctx.lineTo(-8 - u * 52 + (k % 2 ? 6 : 0), sd * (W - u * 30 - (k % 2 ? 10 : 0))); }
    ctx.quadraticCurveTo(-50, sd * 30, -26, sd * 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(140,95,30,.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,225,.75)'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let k = 1; k <= 5; k++) { const u = k / 6; ctx.moveTo(-4 - u * 18, sd * (8 + u * 22)); ctx.lineTo(-8 - u * 52, sd * (W - u * 30)); } ctx.stroke();
    olLine(0, 0, -8, sd * W, 2.4, '#f6dc8a');
    ctx.restore();
  }
  // bốn chân có vuốt, bước so le
  for (const [lx, sd, ph] of [[18, -1, 0], [18, 1, Math.PI], [-24, -1, Math.PI], [-24, 1, 0]]) {
    const st = Math.sin(walk + ph) * 9, fx = lx + st + 6, fy = sd * 27;
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(110,70,15,.85)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(lx, sd * 12); ctx.quadraticCurveTo(lx + st * 0.3 - 4, sd * 22, fx, fy); ctx.stroke();
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 7.4; ctx.stroke(); ctx.lineCap = 'butt';
    blob(fx + 2, fy, 5.4, 4.6, litGrad('#f0cf72', fx + 1, fy - 1, 6), 0, 'rgba(110,70,15,.8)', 1.1);
    ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = 1.4; ctx.beginPath(); for (const k of [-2.6, 0, 2.6]) { ctx.moveTo(fx + 6, fy + k); ctx.lineTo(fx + 10, fy + k * 1.3); } ctx.stroke();
  }
  // thân: vảy vàng, sống lưng có dãy mào sáng
  const bg = ctx.createRadialGradient(4, -8, 4, 0, 0, 44); bg.addColorStop(0, '#fffbe8'); bg.addColorStop(0.5, '#f0cf72'); bg.addColorStop(1, '#b88a36');
  blob(-4, 0, 40, 19, bg, 0, 'rgba(110,70,15,.85)', 1.8);
  ctx.strokeStyle = 'rgba(150,100,30,.45)'; ctx.lineWidth = 1;
  for (let x = -36; x < 30; x += 7) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(x, sy * 9, 4.2, sy > 0 ? 0.2 : -Math.PI + 0.2, sy > 0 ? Math.PI - 0.2 : -0.2); ctx.stroke(); }
  for (let x = -36; x <= 24; x += 8) { const h = 7 + Math.sin(t * 3 + x) * 1.5; poly([[x + 4, 0], [x - 2, -h * 0.4], [x - 5, 0], [x - 2, h * 0.4]], '#fffbe8', 'rgba(140,95,30,.8)', 1); }
  // cổ và đầu
  blob(34, 0, 14, 11, litGrad('#f0cf72', 32, -4, 14), 0, 'rgba(110,70,15,.85)', 1.6);
  // bờm tia sáng
  ctx.save(); ctx.translate(46, 0);
  const mg = ctx.createRadialGradient(0, 0, 6, 0, 0, 34); mg.addColorStop(0, 'rgba(255,240,190,.7)'); mg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, l = (i % 2 ? 24 : 33) + Math.sin(t * 4 + i) * 3; if (Math.cos(a) > 0.8) continue; poly([[Math.cos(a - 0.13) * 10, Math.sin(a - 0.13) * 10], [Math.cos(a) * l, Math.sin(a) * l], [Math.cos(a + 0.13) * 10, Math.sin(a + 0.13) * 10]], i % 2 ? 'rgba(255,236,170,.85)' : 'rgba(255,215,110,.9)', 'rgba(140,95,30,.6)', 1); }
  // sừng vuốt ngược
  for (const sd of [-1, 1]) { ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(110,70,15,.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(4, sd * 6); ctx.quadraticCurveTo(-6, sd * 16, -18, sd * 13); ctx.stroke(); ctx.strokeStyle = '#fff1b8'; ctx.lineWidth = 3; ctx.stroke(); ctx.lineCap = 'butt'; }
  const hdg = ctx.createRadialGradient(8, -3, 1, 6, 0, 15); hdg.addColorStop(0, '#fffdf0'); hdg.addColorStop(0.6, '#fbe3a0'); hdg.addColorStop(1, '#d8a850');
  ctx.scale(1.25, 1.25); ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(8, -12, 20, -4); ctx.lineTo(22, 0); ctx.lineTo(20, 4); ctx.quadraticCurveTo(8, 12, -8, 9); ctx.closePath(); ctx.fillStyle = hdg; ctx.fill(); ctx.strokeStyle = 'rgba(110,70,15,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,95,30,.7)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(18, -3); ctx.moveTo(10, 6); ctx.lineTo(18, 3); ctx.stroke();
  const glow = f.beaming ? 1 : f.charge;
  if (glow > 0) { const gr = ctx.createRadialGradient(22, 0, 1, 22, 0, 28); gr.addColorStop(0, `rgba(255,250,220,${glow})`); gr.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(22, 0, 28, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6ad0ff'; ctx.shadowColor = '#6ad0ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(10, -5, 2.6, 1.6, 0.3, 0, TAU); ctx.ellipse(10, 5, 2.6, 1.6, -0.3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
  if (f.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  // vầng hào quang xoay trên cao
  ctx.save(); ctx.globalAlpha = alpha * 0.9; ctx.translate(f.x, f.y - z - 6);
  ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 20; ctx.strokeStyle = 'rgba(255,220,120,.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 118 + Math.sin(t * 1.5) * 3, t * 0.3, t * 0.3 + TAU * 0.8); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 128, -t * 0.2, -t * 0.2 + TAU * 0.55); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}
