'use strict';
// Gravebound — Bố cục hầm ngục: mỗi hầm là chuỗi phòng và hành lang (tọa độ cục bộ 2400×2400, lối vào ở dưới, boss ở trên).
// Tường được dựng tự động quanh các phòng; cổng (cần gạt, sương mù boss, tường ảo) đặt ngang hành lang.
// Mỗi hầm có nhánh phụ giấu rương, một cơ quan riêng và một lối tắt một chiều quay về lối vào.
const DG_W = 2400, DG_H = 2400, DG_CELL = 20;
const DG_LAYOUT = {
  // Hầm Mộ Tidewrack: hầm mộ ngập nước bên bờ biển; cửa đá phía bắc mở bằng cần gạt trong gian mộ phía tây
  d1: {
    rooms: [
      [1000, 2080, 400, 260], [1160, 1800, 80, 280], [960, 1500, 480, 300],
      [600, 1600, 360, 80], [240, 1400, 360, 520], [1440, 1600, 360, 80], [1800, 1360, 420, 440],
      [1160, 1260, 80, 240], [800, 900, 800, 360], [520, 1000, 280, 80], [240, 900, 280, 300],
      [1160, 640, 80, 260], [1000, 480, 400, 160], [1160, 440, 80, 40], [700, 60, 1000, 380],
      [1600, 1000, 760, 80], [2280, 1080, 80, 1160], [1400, 2160, 960, 80],
    ],
    gates: [
      { x: 1160, y: 1260, w: 80, h: 24, gate: 'lever', lever: 'd1_door' },
      { x: 700, y: 1000, w: 24, h: 80, illusory: 'w_d1' },
      { x: 1160, y: 444, w: 80, h: 32, gate: 'dg' },
      { x: 2280, y: 1160, w: 80, h: 24, gate: 'lever', lever: 'd1_short' },
    ],
    grace: [1200, 2150], entry: [1200, 2250], exit: [1200, 2318], boss: [1200, 220], bossRoom: [700, 60, 1000, 380],
    spawns: [['skeleton', 1080, 1600], ['skeleton', 1320, 1620], ['ghoul', 1200, 1720], ['skeleton', 360, 1500], ['skeleton', 480, 1760], ['soldier', 330, 1830],
      ['ghost', 500, 1480], ['ghoul', 1900, 1450], ['ghoul', 2100, 1620], ['ghoul', 1960, 1720], ['bat', 2050, 1440], ['bat', 2090, 1470],
      ['skeleton', 950, 1000], ['skeleton', 1450, 1000], ['drowned', 1200, 1100], ['drowned', 1000, 1180], ['ghost', 1450, 1200],
      ['ghost', 1100, 560], ['ghost', 1300, 560], ['bat', 2320, 1700]],
    chests: [['c_d1_0', 2150, 1760, { items: { stone1: 2, cure: 2 }, spirit: 'skeletons' }], ['c_d1_1', 330, 1010, { ash: 'unsheathe' }],
      ['c_d1_x1', 300, 1860, { items: { stone1: 2 } }], ['c_d1_x2', 1540, 950, { items: { somber1: 1 } }]],
    levers: [['d1_door', 280, 1440, 'Cửa đá'], ['d1_short', 2320, 1110, 'Lối tắt về lối vào']],
    pillars: [[1040, 1560, 16], [1360, 1560, 16], [1040, 1740, 16], [1360, 1740, 16], [900, 960, 18], [1500, 960, 18], [900, 1200, 18], [1500, 1200, 18],
      [1100, 1080, 14], [1300, 1080, 14], [850, 150, 18], [1550, 150, 18], [850, 360, 18], [1550, 360, 18]],
    notes: [[1200, 1560, 'Cánh cửa đá phía bắc im lìm. Hẳn phải có cơ quan ẩn trong gian mộ phía tây.'], [770, 1100, 'Gió lạnh luồn qua bức vách phía tây... như thể phía sau còn một gian mộ nữa.']],
    puddles: [[1100, 2200, 60], [1300, 1640, 50], [420, 1700, 70], [1980, 1560, 60], [1000, 1140, 60], [1400, 1100, 50], [1200, 300, 90]],
  },
  // Mỏ Shardvein: đường hầm uốn lượn qua các hang pha lê; vách pha lê phía tây che một hang bí mật và lối tắt
  d2: {
    rooms: [
      [1000, 2100, 400, 240], [1080, 1860, 80, 240], [700, 1780, 460, 80], [700, 1500, 80, 280], [400, 1200, 520, 300],
      [920, 1300, 520, 80], [1440, 1100, 480, 420], [1600, 800, 80, 300], [1300, 520, 700, 280], [900, 600, 400, 80],
      [600, 480, 300, 300], [560, 580, 40, 80], [300, 520, 260, 240], [700, 420, 80, 60], [300, 40, 1100, 380],
      [1920, 1400, 200, 80], [2120, 1260, 240, 340], [200, 600, 100, 80], [120, 600, 80, 1640], [120, 2160, 880, 80],
    ],
    gates: [
      { x: 560, y: 580, w: 40, h: 80, illusory: 'w_d2' },
      { x: 700, y: 424, w: 80, h: 40, gate: 'dg' },
      { x: 120, y: 700, w: 80, h: 24, gate: 'lever', lever: 'd2_short' },
    ],
    grace: [1200, 2150], entry: [1200, 2250], exit: [1200, 2318], boss: [850, 200], bossRoom: [300, 40, 1100, 380],
    spawns: [['crystal', 520, 1300], ['crystal', 800, 1420], ['sorcerer', 650, 1250], ['crab', 480, 1450], ['crystal', 1560, 1200], ['sorcerer', 1800, 1460],
      ['bat', 1700, 1150], ['bat', 1740, 1180], ['lakehound', 1600, 1440], ['crystal', 1450, 600], ['crystal', 1850, 700], ['sorcerer', 1650, 580],
      ['crystal', 760, 640], ['crab', 2240, 1350], ['crab', 2230, 1500], ['lakehound', 900, 1820], ['lakehound', 960, 1830], ['grimoire', 1100, 1340]],
    chests: [['c_d2_2', 2240, 1560, { items: { stone1: 3 } }], ['c_d2_3', 400, 580, { items: { stone2: 2, somber1: 1 } }], ['c_d2_x1', 1900, 560, { items: { stone2: 1 } }]],
    levers: [['d2_short', 160, 650, 'Lối tắt về lối vào']],
    pillars: [[480, 1260, 14, 1], [860, 1250, 16, 1], [560, 1460, 12, 1], [1500, 1160, 16, 1], [1860, 1160, 14, 1], [1500, 1480, 14, 1], [1860, 1480, 16, 1],
      [1350, 580, 14, 1], [1950, 760, 14, 1], [2160, 1300, 12, 1], [2320, 1560, 12, 1], [400, 120, 20, 1], [1300, 120, 20, 1], [400, 360, 20, 1], [1300, 360, 20, 1]],
    notes: [[820, 640, 'Vách pha lê phía tây mỏng như lớp băng đầu đông...']],
  },
  // Hang Emberdeep: sảnh dung nham đầy lỗ phun lửa theo nhịp; lò rèn cổ phía tây, hang nhện phía đông
  d3: {
    rooms: [
      [1000, 2100, 400, 240], [1160, 1500, 80, 600], [700, 1000, 1000, 500], [500, 1180, 200, 80], [160, 1000, 340, 440],
      [1700, 1180, 300, 80], [2000, 900, 300, 600], [1160, 700, 80, 300], [900, 520, 600, 180], [1160, 480, 80, 40], [600, 60, 1200, 420],
      [2080, 1500, 80, 700], [1400, 2160, 760, 80],
    ],
    gates: [
      { x: 1160, y: 484, w: 80, h: 32, gate: 'dg' },
      { x: 2080, y: 1540, w: 80, h: 24, gate: 'lever', lever: 'd3_short' },
    ],
    grace: [1200, 2150], entry: [1200, 2250], exit: [1200, 2318], boss: [1200, 250], bossRoom: [600, 60, 1200, 420],
    spawns: [['salamander', 900, 1200], ['salamander', 1500, 1350], ['bomber', 1600, 1080], ['soldier', 800, 1450], ['bomber', 780, 1080],
      ['bomber', 300, 1100], ['spider', 400, 1350], ['spider', 260, 1300], ['spider', 2150, 1000], ['spider', 2200, 1080], ['troll', 2150, 1350],
      ['troll', 1200, 600], ['salamander', 1200, 1560], ['warhound', 1000, 1300], ['warhound', 1400, 1300]],
    chests: [['c_d3_4', 240, 1380, { items: { firepot: 4, stone2: 1 } }], ['c_d3_5', 2220, 960, { items: { stone2: 2 }, tal: 'green' }], ['c_d3_x1', 1450, 580, { items: { stone2: 1, firepot: 2 } }]],
    levers: [['d3_short', 2120, 1470, 'Lối tắt về lối vào']],
    traps: [[1200, 1640], [1200, 1840], [850, 1100], [1050, 1250], [1250, 1100], [1450, 1250], [850, 1400], [1250, 1400], [1550, 1100], [1050, 1420], [1600, 1420]],
    pillars: [[800, 1050, 16], [1600, 1050, 16], [800, 1450, 16], [1600, 1450, 16], [750, 150, 20], [1650, 150, 20], [750, 400, 20], [1650, 400, 20]],
    notes: [[1200, 1960, 'Nền đá nóng rực. Lửa ngầm phun theo nhịp; hãy đếm hơi thở của hang mà đi.']],
  },
  // Hầm Mộ Kingsrest: lăng mộ hoàng gia đối xứng; cần gạt ở nhà nguyện phía tây mở lối lên phòng trưng bày
  d4: {
    rooms: [
      [1000, 2100, 400, 240], [1100, 1700, 200, 400], [600, 1200, 1200, 500], [400, 1380, 200, 100], [120, 1100, 280, 560],
      [1800, 1380, 200, 100], [2000, 1100, 240, 560], [1150, 900, 100, 300], [700, 560, 1000, 340], [560, 660, 140, 80], [280, 600, 280, 240],
      [1150, 480, 100, 80], [500, 40, 1400, 440], [1700, 680, 660, 80], [2300, 760, 60, 1480], [1400, 2160, 960, 80],
    ],
    gates: [
      { x: 1150, y: 1170, w: 100, h: 24, gate: 'lever', lever: 'd4_gate' },
      { x: 620, y: 660, w: 24, h: 80, illusory: 'w_d4' },
      { x: 1150, y: 484, w: 100, h: 40, gate: 'dg' },
      { x: 2300, y: 800, w: 60, h: 24, gate: 'lever', lever: 'd4_short' },
    ],
    grace: [1200, 2150], entry: [1200, 2250], exit: [1200, 2318], boss: [1200, 250], bossRoom: [500, 40, 1400, 440],
    spawns: [['royal', 800, 1350], ['royal', 1600, 1350], ['garcher', 700, 1600], ['garcher', 1700, 1600], ['priest', 1200, 1300], ['gargoyle', 1200, 1520],
      ['ghost', 250, 1300], ['royal', 260, 1550], ['gargoyle', 2120, 1250], ['garcher', 2120, 1560], ['ghost', 900, 700], ['royal', 1500, 700], ['priest', 1200, 640],
      ['lion', 1200, 820]],
    chests: [['c_d4_6', 2150, 1610, { items: { grune2: 1, stone3: 1 } }], ['c_d4_7', 360, 700, { items: { stone3: 2, somber2: 1 } }], ['c_d4_x1', 180, 1610, { items: { stone3: 1 } }]],
    levers: [['d4_gate', 200, 1150, 'Cửa lăng'], ['d4_short', 2330, 720, 'Lối tắt về lối vào']],
    pillars: [[750, 1250, 20], [1650, 1250, 20], [750, 1650, 20], [1650, 1650, 20], [1000, 1250, 16], [1400, 1250, 16], [700, 150, 22], [1700, 150, 22], [700, 400, 22], [1700, 400, 22],
      [800, 620, 16], [1600, 620, 16], [800, 840, 16], [1600, 840, 16]],
    notes: [[740, 700, 'Bức vách phía tây... sao bụi không hề bám lên nó?'], [1200, 1780, 'Lối lên phòng trưng bày bị khóa. Nhà nguyện phía tây giữ chiếc chìa của nó.']],
    carpet: [[1150, 480, 100, 1860]],
  },
};
// dựng tường quanh các phòng: ô trống cách sàn không quá 2 ô thành tường, gộp thành các khối chữ nhật lớn
function carveDungeon(d, push) {
  carveRooms(DG_LAYOUT[d.id].rooms, d.area.x, 0, DG_W, DG_H, DG_CELL, r => push(Object.assign(r, { dgw: d.theme })));
}
// dựng tường quanh các phòng trên lưới ô vuông: ô không phải sàn mà cách sàn ≤ 2 ô là tường, rồi gộp thành hình chữ nhật.
// Phòng thò ra ngoài khung (x0, y0, w, h) thì chỗ đó để hở, thành lối ra vào; tọa độ phòng tính từ góc khung.
function carveRooms(rooms, x0, y0, W0, H0, C, push) {
  const cols = Math.ceil(W0 / C), rows = Math.ceil(H0 / C), floor = new Uint8Array(cols * rows);
  for (const [x, y, w, h] of rooms) for (let cy = Math.floor(y / C); cy < Math.ceil((y + h) / C); cy++) for (let cx = Math.floor(x / C); cx < Math.ceil((x + w) / C); cx++) if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) floor[cy * cols + cx] = 1;
  const wall = new Uint8Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    if (floor[cy * cols + cx]) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < cols && y < rows && floor[y * cols + x]) { near = true; break; } }
    if (near) wall[cy * cols + cx] = 1;
  }
  // gộp: dải ngang theo từng hàng, rồi nối các dải giống hệt nhau ở các hàng liên tiếp
  const open = new Map();
  const flush = keep => { for (const [k, r] of open) if (!keep.has(k)) { push({ x: x0 + r.x * C, y: y0 + r.y * C, w: r.w * C, h: r.h * C }); open.delete(k); } };
  for (let cy = 0; cy <= rows; cy++) {
    const runs = new Set();
    if (cy < rows) for (let cx = 0; cx < cols;) {
      if (!wall[cy * cols + cx]) { cx++; continue; }
      let e = cx; while (e < cols && wall[cy * cols + e]) e++;
      const k = cx + ',' + e; runs.add(k);
      if (open.has(k)) open.get(k).h++; else open.set(k, { x: cx, y: cy, w: e - cx, h: 1 });
      cx = e;
    }
    flush(runs);
  }
}
