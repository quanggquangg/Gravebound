'use strict';
// Gravebound — Dữ liệu thế giới và hình ảnh dựng sẵn
// ───────────────────────── thế giới ─────────────────────────
// Thế giới chính: x từ WX0 tới MAPW, y từ WY0 tới H.
// Bố cục được vẽ ở "tọa độ thiết kế" rồi phóng to K lần khi nạp game (xem scaleWorld): đường đi, khoảng cách
// giữa các vùng và công trình đều rộng ra, còn nhân vật, cây cối và tầm đánh giữ nguyên kích thước.
const K = 2;
const D = { WX0: -2800, WY0: -1800, MAPW: 4400, H: 3600 }; // biên thế giới ở tọa độ thiết kế
const WX0 = D.WX0 * K, WY0 = D.WY0 * K, MAPW = D.MAPW * K, H = D.H * K;
// phía đông x > INST_X là các khu biệt lập (Cõi Aurum, Sảnh Hearthhold, hầm ngục), chỉ tới được bằng dịch chuyển
const INST_X = 9600, W = 22600;
const sk = v => v * K;
// Độ khó chọn một lần khi bắt đầu hành trình. Khó và Chuyên gia chỉ mở sau khi đã phá đảo một lần.
// hp/dmg: máu và sát thương quái thường · boss: máu boss lớn · elite: tỉ lệ quái tinh anh có thuộc tính
// aff: số thuộc tính tối đa · inv: số Kẻ Xâm Nhập · cd: nhịp nghỉ giữa các đòn của quái (nhỏ hơn là dồn dập hơn)
const DIFFS = {
  easy: { name: 'Dễ', desc: 'Kẻ địch yếu hơn, ra đòn thưa hơn. Dành cho ai muốn tận hưởng câu chuyện.', hp: 0.85, dmg: 0.8, boss: 0.8, runes: 1, elite: 0, aff: 0, inv: 0, cd: 1.12, tok: [1, 1] },
  normal: { name: 'Thường', desc: 'Trải nghiệm souls-like như dự định: khó nhưng công bằng.', hp: 1.25, dmg: 1.3, boss: 1, runes: 1, elite: 0, aff: 0, inv: 0, cd: 1, tok: [2, 2] },
  hard: { name: 'Khó', desc: 'Chu kỳ thứ hai. Quái tinh anh mang thuộc tính lạ, Gravebound Đỏ xâm nhập thế giới của ngươi, boss gọi thêm tay sai. Rune nhận được ×1.5.', hp: 1.8, dmg: 1.75, boss: 1.45, runes: 1.5, elite: 0.22, aff: 1, inv: 2, cd: 0.9, tok: [3, 2], locked: true },
  expert: { name: 'Chuyên gia', desc: 'Chu kỳ cuối. Gần một nửa số quái là tinh anh, có kẻ mang hai thuộc tính. Thêm một Kẻ Xâm Nhập nữa. Rune nhận được ×2.', hp: 2.3, dmg: 2.2, boss: 1.85, runes: 2, elite: 0.4, aff: 2, inv: 3, cd: 0.8, tok: [3, 3], locked: true },
};
const DIFF_ORDER = ['easy', 'normal', 'hard', 'expert'];
const DIFF = Object.assign({ id: 'normal' }, DIFFS.normal);
function setDiff(id) { if (!DIFFS[id]) id = 'normal'; Object.assign(DIFF, DIFFS[id], { id }); }
// dấu mở khóa lưu riêng khỏi file save, để xoá hành trình cũ vẫn giữ được
const UNLOCK_KEY = 'gravebound-unlock';
function readUnlock() { try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || 'null') || {}; } catch (e) { return {}; } }
function writeUnlock(u) { try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); } catch (e) { /* bỏ qua */ } }
const diffUnlocked = () => !!readUnlock().cleared;
const ARENA = { x: 1150, y: 420, w: 500, h: 380 }; // sân gác cổng của Varek, ở cuối pháo đài Thornwall
// Pháo Đài Thornwall chắn lối duy nhất lên Cao Nguyên Aurelia (như Stormveil): cổng chính bị chặn từ bên trong,
// phải vòng theo lối tuần tra phía tây (cửa sau) hoặc tường đông đã sập; bên trong có sân ngoài, sân tây, nhà nguyện có ân điển,
// đại sảnh, doanh trại và gian bí mật; cần gạt ở sân ngoài mở cổng chính làm lối tắt về ân điển trước cổng.
const THORN_R = { x: 700, y: 380, w: 1400, h: 1190 };
const THORN_ROOMS = [
  [1150, 420, 500, 380], [1360, 370, 80, 60], [1360, 800, 80, 100],                // sân gác cổng, lối lên cao nguyên, lối sương mù
  [1150, 900, 500, 300],                                                           // đại sảnh
  [1000, 1010, 150, 70], [760, 880, 240, 420], [780, 690, 180, 130], [845, 820, 60, 60], [690, 1060, 70, 80], // sân tây, nhà nguyện, cửa sau
  [1650, 1010, 120, 70], [1770, 900, 280, 360], [1850, 730, 200, 110], [1925, 840, 60, 60], [2050, 1090, 60, 80], // doanh trại, gian bí mật, tường sập
  [1360, 1200, 80, 80], [1100, 1280, 600, 220], [1340, 1500, 120, 80],            // sân ngoài và cổng chính
  [1000, 1370, 100, 70], [1690, 1400, 40, 70], [1720, 1360, 330, 140], [1880, 1260, 70, 100], // sân đông, các hành lang nối
];
const ARENA2 = { x: 1050, y: -1560, w: 700, h: 420 }; // Sân Ngai Sunthrone trong Kinh Thành
const TREE_POS = { x: 1400, y: -1720 };
const SWAMP = { x: 2060, y: 1230, w: 720, h: 790 };
const LAIR = { x: 2420, y: 1620 };
const POOLS = [[2150, 1300, 70, 40], [2300, 1420, 90, 45], [2600, 1300, 80, 50], [2680, 1500, 60, 90], [2150, 1500, 60, 80], [2250, 1850, 100, 50], [2550, 1900, 90, 55], [2700, 1800, 50, 70], [2440, 1400, 70, 35], [2600, 1690, 60, 40]];
function inPool(x, y) {
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / rx, dy = (y - py) / ry; if (dx * dx + dy * dy < 1) return true; }
  return false;
}
// Hồ Crystalmere: nước nông làm chậm bước, các đảo nhỏ nằm giữa hồ
const LAKE = [[-1400, 1450, 850, 600], [-2250, 2250, 380, 260], [-500, 900, 280, 170], [-800, 2250, 260, 160]];
const ISLES = [[-1750, 1250, 190, 130], [-950, 1700, 170, 120], [-1450, 1800, 130, 90]];
const inEll = (x, y, [px, py, rx, ry], m = 0) => { const dx = (x - px) / (rx + m), dy = (y - py) / (ry + m); return dx * dx + dy * dy < 1; };
function inWater(x, y, m = 0) {
  if (x > 0 || y < sk(380) || y > sk(2600)) return false;
  if (!LAKE.some(l => inEll(x, y, l, m))) return false;
  return !ISLES.some(l => inEll(x, y, l, -m));
}
function clampLair(x, y, m = sk(285)) { const dx = x - LAIR.x, dy = y - LAIR.y, l = Math.hypot(dx, dy); return l > m ? [LAIR.x + dx / l * m, LAIR.y + dy / l * m] : [x, y]; }
const ROAD = [[1400, 3200], [1380, 2850], [1500, 2450], [1340, 2050], [1430, 1700], [1400, 1590]];
const ROADS = [ROAD,
  [[1500, 2450], [1900, 2420], [2400, 2560], [2900, 2850], [3600, 2880]],
  [[2900, 2850], [2920, 2300], [2900, 1800], [3300, 1720], [3600, 1560], [3600, 1320]],
  // miền Tây
  [[420, 1905], [0, 1910], [-500, 1980], [-1100, 2150], [-1600, 2200], [-2100, 1900], [-2450, 1300], [-2300, 900], [-1900, 600], [-1550, 440]],
  [[0, 1910], [-250, 1500], [-150, 1150], [-300, 600], [-900, 500], [-1550, 440]],
  [[0, 3050], [-700, 3080], [-1500, 3150], [-1900, 2950], [-1700, 2600], [-1600, 2200]],
  // phía Bắc
  [[1400, 380], [1400, -100], [1350, -500], [1400, -900], [1400, -1140]],
  [[1350, -100], [2000, -250], [2700, -250], [3300, -700], [3600, -1100], [4150, -1160], [4170, -1340], [2680, -1340], [2660, -1560], [3300, -1620]],
  [[1390, -380], [600, -300], [250, -100]],
];
const FORT = { x: 3200, y: 500, w: 800, h: 800 };
const ACAD = { x: -2300, y: -900, w: 1500, h: 1300 };
const CAPITAL = { x: 300, y: -1800, w: 2200, h: 900 };
// Hạ Thành: khu phố nghèo bên ngoài tường thành, phía nam cổng lớn; vào được trước khi có đủ ba Đại Ấn
const LOWTOWN = { x: 380, y: -928, w: 2040, h: 496 };
// đồ trang trí phố thị (tọa độ thiết kế): đài phun nước, đèn đường thắp về đêm, sạp chợ, tượng, thùng hàng, giếng
const DECOS = [
  // Hạ Thành
  ['fountain', 1180, -655, 32], ['statue', 1085, -540], ['well', 2320, -545],
  ['stall', 1110, -858], ['stall', 1210, -862], ['stall', 1545, -585], ['stall', 780, -748], ['stall', 1950, -752],
  ['lamp', 1300, -560], ['lamp', 1480, -560], ['lamp', 1295, -740], ['lamp', 1485, -740], ['lamp', 620, -652], ['lamp', 1010, -652],
  ['lamp', 1790, -652], ['lamp', 2170, -652], ['lamp', 560, -765], ['lamp', 2230, -765],
  ['crate', 455, -765], ['crate', 478, -752], ['crate', 2350, -770], ['crate', 1580, -875], ['crate', 1060, -480], ['crate', 2280, -480],
  // Pháo Đài Thornwall
  ['statue', 935, 712], ['lamp', 1300, 1300], ['lamp', 1500, 1300], ['lamp', 1330, 930], ['lamp', 1470, 930], ['crate', 1680, 1300], ['crate', 1115, 1470],
  ['crate', 1790, 920], ['crate', 1792, 948], ['crate', 2030, 1238], ['crate', 985, 900], ['crate', 775, 902], ['well', 2000, 1470], ['crate', 1740, 1480],
  // Kinh Thành
  ['fountain', 680, -1075, 30], ['fountain', 2130, -1150, 28], ['statue', 1310, -1090], ['statue', 1490, -1090],
  ['stall', 1080, -1082], ['stall', 1720, -1082], ['lamp', 1250, -1000], ['lamp', 1550, -1000], ['lamp', 1120, -960], ['lamp', 1680, -960],
  ['lamp', 700, -1560], ['lamp', 350, -1050], ['lamp', 2140, -1470], ['lamp', 2440, -1300], ['crate', 980, -1760], ['crate', 1800, -960],
];
const COLO = { x: 3600, y: 3230, rect: { x: 3200, y: 2950, w: 800, h: 560 } };
const FOREST = { x: 2850, y: 1900, w: 1500, h: 900 };
const BARRIER = { x: 3650, y: 2350, r: 150 };
const BRAZIERS = [{ id: 'e', x: 3780, y: 1440 }, { id: 'n', x: 3600, y: 1370 }, { id: 'w', x: 3420, y: 1440 }];
const BRAZIER_ORDER = ['e', 'n', 'w'];
const STATUES = [{ id: 's1', x: 2980, y: 1980 }, { id: 's2', x: 4250, y: 1990 }, { id: 's3', x: 2990, y: 2720 }, { id: 's4', x: 4240, y: 2720 }];
const FLAG = { x: 3600, y: 3230 };

// ───────────────────────── khu biệt lập ─────────────────────────
const RC = { x: 10500, y: 500, r: 420 }; // đấu trường trận cuối trong Cõi Aurum
const HUB = { x: 11100, y: 0, w: 1000, h: 900 };
// Hầm ngục phụ: mỗi hầm có cửa vào ngoài thế giới, ân điển ở lối vào và một boss ở phòng cuối
const DUNGEONS = [
  { id: 'd1', name: 'Hầm Mộ Tidewrack', ex: -1600, ey: 3380, boss: 'graveknight', mul: 1.2, theme: 'crypt', reward: { tal: 'vital', pouch: 1, items: { somber1: 1 } } },
  { id: 'd2', name: 'Mỏ Shardvein', ex: -2450, ey: 1650, boss: 'minerg', mul: 1.45, theme: 'crystal', reward: { weapon: 'staff3', items: { stone2: 2, somber1: 1 } } },
  { id: 'd3', name: 'Hang Emberdeep', ex: 4250, ey: 760, boss: 'golem', mul: 1.4, theme: 'fire', reward: { tal: 'shieldtal', items: { somber2: 1, stone2: 2 } } },
  { id: 'd4', name: 'Hầm Mộ Kingsrest', ex: 3900, ey: -1500, boss: 'royalchamp', mul: 1.8, theme: 'royal', reward: { weapon: 'royalsword', mem: 1, tal: 'gold' } },
];
DUNGEONS.forEach((d, i) => { const L = DG_LAYOUT[d.id], [bx, by, bw, bh] = L.bossRoom; d.L = L; d.area = { x: 12200 + i * 2600, y: 0, w: DG_W, h: DG_H }; d.grace = 30 + i; d.bossRoom = { x: d.area.x + bx, y: by, w: bw, h: bh }; });
const AREAS = [
  { id: 'realm', x: 10000, y: 0, w: 1000, h: 1000, name: 'Cõi Aurum' },
  Object.assign({ id: 'hub', name: 'Sảnh Hearthhold' }, HUB),
  ...DUNGEONS.map(d => Object.assign({ id: d.id, name: d.name, dg: d }, d.area)),
];
function areaAt(x, y) {
  if (x < INST_X) return null;
  for (const a of AREAS) if (x >= a.x - 60 && x <= a.x + a.w + 60 && y >= a.y - 60 && y <= a.y + a.h + 60) return a;
  return null;
}
const dungeonAt = (x, y) => { const a = areaAt(x, y); return a && a.dg ? a.dg : null; };

// Bia Bản Đồ đặt gần lối vào mỗi vùng, trên đường chính (như Elden Ring, tháp trong Zelda BotW).
// Bia chỉ mở bản đồ dạng phác thảo: thấy địa hình và tên vùng; nơi đã tự đi qua mới hiện đầy đủ.
// Bí mật (rương, tượng, lò lửa, tường ảo, bên trong pháo đài) không bao giờ hiện lên bản đồ.
const MAP_FRAGS = [
  // Đồng Cỏ Mistveil: nam, giữa và pháo đài phía bắc
  { id: 'm1', x: 1180, y: 2650, name: 'Đồng Cỏ Phía Nam', rects: [{ x: 0, y: 2500, w: 2050, h: 1100 }] },
  { id: 'm12', x: 1150, y: 2120, name: 'Đồng Cỏ Trung Tâm', rects: [{ x: 0, y: 1600, w: 2050, h: 900 }] },
  { id: 'm2', x: 1640, y: 1690, name: 'Pháo Đài Thornwall', rects: [{ x: 0, y: 420, w: 2100, h: 1180 }] },
  { id: 'm3', x: 2150, y: 2080, name: 'Đầm Lầy Ashmire', rects: [{ x: 2000, y: 1000, w: 800, h: 1100 }] },
  // Cinderreach: bắc (pháo đài Greystone) và nam
  { id: 'm4', x: 3020, y: 1700, name: 'Cinderreach Phía Nam', rects: [{ x: 2800, y: 1160, w: 1600, h: 740 }] },
  { id: 'm13', x: 3080, y: 980, name: 'Cinderreach Phía Bắc', rects: [{ x: 2100, y: 420, w: 2300, h: 740 }] },
  { id: 'm5', x: 3060, y: 2250, name: 'Rừng Wraithwood', rects: [{ x: 2850, y: 1900, w: 1500, h: 900 }] },
  { id: 'm6', x: 3320, y: 2815, name: 'Vùng Nam Phía Đông', rects: [{ x: 2050, y: 2800, w: 2350, h: 800 }] },
  // Hồ Crystalmere: đông và tây
  { id: 'm7', x: -200, y: 1990, name: 'Hồ Crystalmere Phía Đông', rects: [{ x: -1400, y: 400, w: 1400, h: 2200 }] },
  { id: 'm14', x: -2150, y: 1700, name: 'Hồ Crystalmere Phía Tây', rects: [{ x: -2800, y: 400, w: 1400, h: 2200 }] },
  // Bờ Biển Saltreach: đông và tây
  { id: 'm8', x: -220, y: 3120, name: 'Bờ Biển Phía Đông', rects: [{ x: -1400, y: 2600, w: 1400, h: 1000 }] },
  { id: 'm15', x: -1850, y: 2900, name: 'Bờ Biển Phía Tây', rects: [{ x: -2800, y: 2600, w: 1400, h: 1000 }] },
  { id: 'm9', x: -1700, y: 340, name: 'Học Viện Starhollow', rects: [ACAD] },
  // Cao Nguyên Aurelia: tây, đông và Sườn Núi Goldspire
  { id: 'm10', x: 1480, y: 250, name: 'Cao Nguyên Phía Tây', rects: [{ x: 0, y: -900, w: 2200, h: 1300 }, LOWTOWN] },
  { id: 'm16', x: 2750, y: -120, name: 'Cao Nguyên Phía Đông', rects: [{ x: 2200, y: -900, w: 2200, h: 1300 }] },
  { id: 'm17', x: 3350, y: -1000, name: 'Sườn Núi Goldspire', rects: [{ x: 2500, y: -1800, w: 1900, h: 900 }] },
  { id: 'm11', x: 1250, y: -990, name: 'Kinh Thành Aurumhold', rects: [CAPITAL] },
];
// sương mù bản đồ: mỗi ô 100×100 đơn vị, mở ra khi người chơi đi qua
const EXP_CELL = 100, EXP_COLS = Math.ceil((MAPW - WX0) / EXP_CELL), EXP_ROWS = Math.ceil((H - WY0) / EXP_CELL);
const EXP = new Uint8Array(EXP_COLS * EXP_ROWS);
function explore(x, y, r) {
  if (x > MAPW + 100) return;
  const c0 = Math.max(0, Math.floor((x - r - WX0) / EXP_CELL)), c1 = Math.min(EXP_COLS - 1, Math.floor((x + r - WX0) / EXP_CELL));
  const r0 = Math.max(0, Math.floor((y - r - WY0) / EXP_CELL)), r1 = Math.min(EXP_ROWS - 1, Math.floor((y + r - WY0) / EXP_CELL));
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    if (dist(x, y, WX0 + (cx + 0.5) * EXP_CELL, WY0 + (cy + 0.5) * EXP_CELL) < r) EXP[cy * EXP_COLS + cx] = 1;
  }
}
function expEncode() { let out = ''; for (let i = 0; i < EXP.length; i += 4) out += ((EXP[i] | 0) | (EXP[i + 1] | 0) << 1 | (EXP[i + 2] | 0) << 2 | (EXP[i + 3] | 0) << 3).toString(16); return out; }
function expDecode(str) {
  EXP.fill(0);
  if (!str) return;
  for (let k = 0; k < str.length; k++) { const v = parseInt(str[k], 16) || 0; for (let b = 0; b < 4; b++) if (k * 4 + b < EXP.length) EXP[k * 4 + b] = (v >> b) & 1; }
}
// bản lưu từ trước khi thế giới được phóng to: dời rune rơi, dấu trên bản đồ và vùng đã khám phá sang tọa độ mới
function migrateSave(s) {
  // v1 được đổi thẳng sang thế giới hiện tại; v2–v4 (thế giới ×1,5) cần phóng tiếp lên ×2 và dời các khu biệt lập
  const fromV1 = (s.worldV || 1) < 2;
  if (fromV1) migrateV2(s);
  if (s.worldV < 3) {
    // hầm ngục được dựng lại rộng hơn: rune rơi hay dấu trong hầm cũ dời về lối vào của hầm đó (tọa độ bản cũ)
    const mv = p => { if (!p || typeof p.x !== 'number' || p.x < 10200) return; const i = Math.min(DUNGEONS.length - 1, Math.floor((p.x - 10200) / 1100)), d = DUNGEONS[i]; p.x = 10200 + i * 2600 + d.L.entry[0]; p.y = d.L.entry[1] - 60; };
    if (!fromV1) { mv(s.lost); mv(s.marker); }
    s.worldV = 3;
  }
  if (s.worldV < 5 && !fromV1) migrateV5(s);
  if (s.worldV < 4) {
    // Hạ Thành mọc lên phía nam cổng lớn và thế giới được rải thêm điểm đến: rune rơi trong khu phố dời về ân điển cổng thành,
    // rương tàn tích và vật phẩm rải rác được sinh lại ở chỗ khác nên coi như chưa nhặt
    if (s.lost && typeof s.lost.x === 'number' && inRect(s.lost.x, s.lost.y, LOWTOWN, 40)) { const g = GRACES.find(q => q.id === 18); s.lost.x = g.x; s.lost.y = g.y + 60; }
    const fresh = id => !/^(c_ruin|x)\d+$/.test(id);
    if (Array.isArray(s.chests)) s.chests = s.chests.filter(fresh);
    if (Array.isArray(s.taken)) s.taken = s.taken.filter(fresh);
    s.worldV = 4;
  }
  if (s.worldV < 5) {
    // Thornwall thành pháo đài nhiều khu, thêm bia bản đồ: rương, vật phẩm rải rác sinh lại nên coi như chưa nhặt
    const fresh = id => !/^(c_ruin|x|xg|xs|c_camp|c_tower)\d+$/.test(id);
    if (Array.isArray(s.chests)) s.chests = s.chests.filter(fresh);
    if (Array.isArray(s.taken)) s.taken = s.taken.filter(fresh);
    if (s.lost && typeof s.lost.x === 'number' && s.lost.x < INST_X && inRect(s.lost.x, s.lost.y, THORN_R, 40)) { const g = GRACES.find(q => q.id === 3); s.lost.x = g.x; s.lost.y = g.y + 60; }
    s.worldV = 5;
  }
  return s;
}
// thế giới ×1,5 → ×2: điểm ngoài thế giới nhân thêm, khu biệt lập dời sang đông 2000; vùng đã khám phá vẽ lại theo lưới mới
function migrateV5(s) {
  const k = K / 1.5, mv = p => { if (!p || typeof p.x !== 'number') return; if (p.x < 7400) { p.x *= k; p.y *= k; } else p.x += 2000; };
  mv(s.lost); mv(s.marker);
  if (s.explored) {
    const OX = -2800 * 1.5, OY = -1800 * 1.5, oc = Math.ceil(7200 * 1.5 / 100), orw = Math.ceil(5400 * 1.5 / 100), old = new Uint8Array(oc * orw);
    for (let i = 0; i < s.explored.length; i++) { const v = parseInt(s.explored[i], 16) || 0; for (let b = 0; b < 4; b++) if (i * 4 + b < old.length) old[i * 4 + b] = (v >> b) & 1; }
    EXP.fill(0);
    for (let cy = 0; cy < EXP_ROWS; cy++) for (let cx = 0; cx < EXP_COLS; cx++) {
      const ox = Math.floor(((WX0 + (cx + 0.5) * EXP_CELL) / k - OX) / 100), oy = Math.floor(((WY0 + (cy + 0.5) * EXP_CELL) / k - OY) / 100);
      if (ox >= 0 && oy >= 0 && ox < oc && oy < orw && old[oy * oc + ox]) EXP[cy * EXP_COLS + cx] = 1;
    }
    s.explored = expEncode();
  }
}
function migrateV2(s) {
  const mv = p => { if (!p || typeof p.x !== 'number') return; if (p.x < 4800) { p.x *= K; p.y *= K; } else p.x += 5000; };
  mv(s.lost); mv(s.marker);
  if (s.explored) {
    const oc = 72, orw = 54, old = new Uint8Array(oc * orw);
    for (let i = 0; i < s.explored.length; i++) { const v = parseInt(s.explored[i], 16) || 0; for (let b = 0; b < 4; b++) if (i * 4 + b < old.length) old[i * 4 + b] = (v >> b) & 1; }
    EXP.fill(0);
    for (let cy = 0; cy < EXP_ROWS; cy++) for (let cx = 0; cx < EXP_COLS; cx++) {
      const ox = Math.floor(((WX0 + (cx + 0.5) * EXP_CELL) / K - D.WX0) / 100), oy = Math.floor(((WY0 + (cy + 0.5) * EXP_CELL) / K - D.WY0) / 100);
      if (ox >= 0 && oy >= 0 && ox < oc && oy < orw && old[oy * oc + ox]) EXP[cy * EXP_COLS + cx] = 1;
    }
    s.explored = expEncode();
  }
  s.worldV = 2;
  return s;
}
function fragAt(x, y) { return !inRect(x, y, FORT) && MAP_FRAGS.some(f => S.frags.includes(f.id) && f.rects.some(r => inRect(x, y, r))); }
function revealedAt(x, y) {
  const cx = Math.floor((x - WX0) / EXP_CELL), cy = Math.floor((y - WY0) / EXP_CELL);
  if (cx >= 0 && cy >= 0 && cx < EXP_COLS && cy < EXP_ROWS && EXP[cy * EXP_COLS + cx]) return true;
  return fragAt(x, y);
}
const inRect = (x, y, r, m = 0) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;

// ───────────────────────── tường ─────────────────────────
const WALLS = [
  // Pháo Đài Thornwall: cổng lên cao nguyên (mở khi Varek ngã), cửa sương mù, cổng chính mở bằng cần gạt, tường ảo ở doanh trại
  { x: 1345, y: 380, w: 110, h: 30, gate: 'north' }, { x: 1345, y: 834, w: 110, h: 28, gate: 'fog' },
  { x: 1320, y: 1522, w: 160, h: 32, gate: 'lever', lever: 'keep_gate' }, { x: 1915, y: 852, w: 80, h: 34, illusory: 'w_keep' },
  // vách đá ngăn Cao Nguyên Aurelia với miền dưới, rìa phía đông
  { x: 0, y: 380, w: 1136, h: 40, cliff: true }, { x: 1666, y: 380, w: D.MAPW - 1666, h: 40, cliff: true }, { x: D.MAPW, y: D.WY0, w: 90, h: D.H - D.WY0, void: true },
  // vách đá ngăn miền Tây, có hai lối qua: cạnh tàn tích và phía nam ra bờ biển
  { x: -40, y: 400, w: 40, h: 1460, cliff: true }, { x: -40, y: 1960, w: 40, h: 990, cliff: true }, { x: -40, y: 3150, w: 40, h: 450, cliff: true },
  // Sườn Núi Goldspire: hai bậc vách đá buộc đường lên đỉnh uốn khúc (vòng qua mép đông rồi mép tây)
  { x: 2500, y: -1232, w: 1480, h: 36, cliff: true }, { x: 2820, y: -1482, w: 1580, h: 36, cliff: true },
  // Đồng Cỏ Mistveil: dải đồi đá khép thung lũng khởi đầu phía nam, chỉ chừa ba lối (đường cái, đèo tây, bờ đầm phía đông)
  { x: 60, y: 2480, w: 240, h: 36, cliff: true, ridge: true }, { x: 450, y: 2480, w: 800, h: 36, cliff: true, ridge: true }, { x: 1650, y: 2470, w: 300, h: 36, cliff: true, ridge: true },
  // vực tối ở phía tây bắc
  { x: D.WX0, y: D.WY0, w: 300 - D.WX0, h: 900, void: true }, { x: D.WX0, y: -900, w: 500, h: 1300, void: true }, { x: -800, y: -900, w: 800, h: 1300, void: true },
  // biển phía tây nam
  { x: D.WX0, y: 2600, w: 320, h: 1000, sea: true },
  // nhà nguyện khởi đầu
  { x: 1250, y: 3200, w: 100, h: 22 }, { x: 1450, y: 3200, w: 100, h: 22 },
  { x: 1250, y: 3200, w: 22, h: 260 }, { x: 1528, y: 3200, w: 22, h: 260 }, { x: 1250, y: 3438, w: 300, h: 22 },
  // tàn tích phía tây
  { x: 420, y: 1650, w: 220, h: 24 }, { x: 760, y: 1650, w: 220, h: 24 },
  { x: 420, y: 1650, w: 24, h: 200 }, { x: 956, y: 1650, w: 24, h: 150 },
  { x: 420, y: 1960, w: 24, h: 204 }, { x: 420, y: 2140, w: 300, h: 24 },
  { x: 840, y: 2140, w: 140, h: 24 }, { x: 956, y: 1900, w: 24, h: 264 },
  { x: 600, y: 1860, w: 90, h: 20 },
  // Pháo Đài Greystone
  { x: 3200, y: 500, w: 800, h: 28 }, { x: 3200, y: 500, w: 28, h: 800 }, { x: 3972, y: 500, w: 28, h: 800 },
  { x: 3200, y: 1272, w: 340, h: 28 }, { x: 3660, y: 1272, w: 340, h: 28 }, { x: 3540, y: 1272, w: 120, h: 28, gate: 'fort' },
  { x: 3400, y: 528, w: 28, h: 260 }, { x: 3772, y: 528, w: 28, h: 260 }, { x: 3400, y: 760, w: 140, h: 28 }, { x: 3660, y: 760, w: 140, h: 28 },
  { x: 3228, y: 1100, w: 112, h: 24 }, { x: 3340, y: 1100, w: 24, h: 172, illusory: 'w_fort' },
  // căn nhà không cửa
  { x: 2950, y: 3150, w: 150, h: 22 }, { x: 2950, y: 3150, w: 22, h: 150 }, { x: 3078, y: 3150, w: 22, h: 150 }, { x: 2950, y: 3278, w: 150, h: 22, illusory: 'w_hut' },
  // Đấu Trường Bloodsand
  { x: 3200, y: 2950, w: 340, h: 28 }, { x: 3660, y: 2950, w: 340, h: 28 }, { x: 3540, y: 2950, w: 120, h: 28, gate: 'colo' },
  { x: 3200, y: 2950, w: 28, h: 560 }, { x: 3972, y: 2950, w: 28, h: 560 }, { x: 3200, y: 3482, w: 800, h: 28 },
  // Học Viện Starhollow: sân trước, cánh tây, thư viện và phòng của nữ hoàng
  { x: -2328, y: -928, w: 28, h: 1348, acad: true }, { x: -800, y: -928, w: 28, h: 1348, acad: true }, { x: -2328, y: -928, w: 1556, h: 28, acad: true },
  { x: -2328, y: 380, w: 728, h: 40, acad: true }, { x: -1600, y: 380, w: 100, h: 40, gate: 'acad' }, { x: -1500, y: 380, w: 728, h: 40, acad: true },
  { x: -2300, y: 72, w: 100, h: 28, acad: true }, { x: -2080, y: 72, w: 880, h: 28, acad: true }, { x: -1200, y: 72, w: 100, h: 28, gate: 'lever', lever: 'acad_sc' }, { x: -1100, y: 72, w: 300, h: 28, acad: true },
  { x: -1900, y: -380, w: 28, h: 452, acad: true },
  { x: -2300, y: -528, w: 800, h: 28, acad: true }, { x: -1500, y: -528, w: 100, h: 28, gate: 'dg', dg: 'acad' }, { x: -1400, y: -528, w: 600, h: 28, acad: true },
  { x: -1028, y: 100, w: 28, h: 188, illusory: 'w_acad', acad: true }, { x: -1028, y: 260, w: 228, h: 28, acad: true },
  { x: -1840, y: -430, w: 240, h: 26, shelf: true }, { x: -1520, y: -430, w: 240, h: 26, shelf: true }, { x: -1200, y: -430, w: 240, h: 26, shelf: true },
  { x: -1840, y: -270, w: 240, h: 26, shelf: true }, { x: -1520, y: -270, w: 240, h: 26, shelf: true }, { x: -1200, y: -270, w: 240, h: 26, shelf: true },
  { x: -1840, y: -110, w: 240, h: 26, shelf: true }, { x: -1520, y: -110, w: 240, h: 26, shelf: true },
  // Kinh Thành Aurumhold: tường thành, cổng lớn cần ba Đại Ấn, cửa hông mở bằng cần gạt bên trong
  { x: 300, y: -928, w: 1040, h: 28 }, { x: 1340, y: -928, w: 120, h: 28, gate: 'great' }, { x: 1460, y: -928, w: 1040, h: 28 },
  { x: 300, y: -1800, w: 28, h: 872 }, { x: 2472, y: -1800, w: 28, h: 680 }, { x: 2472, y: -1120, w: 28, h: 120, gate: 'lever', lever: 'cap_side' }, { x: 2472, y: -1000, w: 28, h: 72 },
  // Hạ Thành: tường thấp có cổng vòm không cửa ở phía nam, hai bên tường sập thành lỗ hổng
  { x: 380, y: -460, w: 880, h: 28 }, { x: 1540, y: -460, w: 880, h: 28 }, { x: 1260, y: -484, w: 40, h: 60 }, { x: 1500, y: -484, w: 40, h: 60 },
  { x: 380, y: -928, w: 28, h: 208 }, { x: 380, y: -620, w: 28, h: 188 }, { x: 2392, y: -928, w: 28, h: 168 }, { x: 2392, y: -660, w: 28, h: 228 },
  // Sân Ngai Sunthrone (Varek trở lại) và lối lên Cây Aurum
  { x: 1022, y: -1800, w: 28, h: 688 }, { x: 1750, y: -1800, w: 28, h: 688 },
  { x: 1022, y: -1140, w: 328, h: 28 }, { x: 1350, y: -1140, w: 100, h: 28, gate: 'fog2' }, { x: 1450, y: -1140, w: 328, h: 28 },
  { x: 1050, y: -1588, w: 300, h: 28 }, { x: 1350, y: -1588, w: 100, h: 28, gate: 'north2' }, { x: 1450, y: -1588, w: 300, h: 28 },
  // nhà cửa trong Kinh Thành
  ...[[400, -1700, 250, 200], [750, -1700, 200, 300], [400, -1400, 200, 220], [700, -1300, 260, 150], [420, -1100, 180, 120], [760, -1080, 200, 90],
    [1850, -1700, 250, 250], [2180, -1720, 220, 200], [1850, -1380, 200, 200], [2150, -1420, 250, 160], [1860, -1100, 220, 120], [2200, -1180, 180, 130],
    // Hạ Thành: hai dãy nhà hai bên con phố ngang, chừa quảng trường quanh đường cái
    [440, -890, 170, 118], [660, -890, 150, 108], [860, -890, 180, 120], [1640, -890, 170, 120], [1860, -890, 150, 110], [2060, -890, 200, 116],
    [440, -625, 160, 115], [650, -635, 190, 125], [890, -620, 160, 110], [1600, -625, 170, 115], [1820, -640, 160, 130], [2040, -620, 210, 110]]
    .map(([x, y, w, h]) => ({ x, y, w, h, bld: true })),
  // Sảnh Hearthhold
  { x: HUB.x, y: 0, w: HUB.w, h: 28 }, { x: HUB.x, y: HUB.h - 28, w: HUB.w, h: 28 }, { x: HUB.x, y: 0, w: 28, h: HUB.h }, { x: HUB.x + HUB.w - 28, y: 0, w: 28, h: HUB.h },
];
// Đầm Lầy Ashmire: bụi gai mọc thành vòng quanh hang rồng, chỉ chừa một lối ở phía đông bắc
for (let a = 0; a < TAU; a += 0.075) {
  if (Math.abs(angDiff(a, -Math.PI / 4)) < 0.24) continue;
  const rr = 330 + Math.sin(a * 5) * 14;
  WALLS.push({ x: LAIR.x + 20 + Math.cos(a) * rr - 22, y: LAIR.y + Math.sin(a) * rr * 0.95 - 22, w: 44, h: 44, bramble: true, seed: Math.round(a * 100) });
}
carveRooms(THORN_ROOMS.map(([x, y, w, h]) => [x - THORN_R.x, y - THORN_R.y, w, h]), THORN_R.x, THORN_R.y, THORN_R.w, THORN_R.h, 14, w => WALLS.push(Object.assign(w, { keep: true })));
const LEVERS = [{ id: 'keep_gate', x: 1505, y: 1470, name: 'Cổng chính Thornwall' }, { id: 'acad_sc', x: -1150, y: 40, name: 'Cửa tắt Học Viện' }, { id: 'cap_side', x: 2430, y: -1060, name: 'Cửa hông Kinh Thành' }];
const TRAPS = [];
const DOORS = [];
// hầm ngục: tường tự dựng quanh các phòng trong DG_LAYOUT (xem dungeons.js), cổng, cần gạt, cửa ra vào và bẫy
function buildDungeon(d) {
  const L = d.L, ox = d.area.x;
  carveDungeon(d, w => WALLS.push(w));
  for (const g of L.gates || []) WALLS.push(Object.assign({}, g, { x: ox + g.x, dgw: d.theme }, g.gate === 'dg' ? { dg: d.id } : {}));
  DOORS.push({ kind: 'enter', dg: d, x: d.ex, y: d.ey }, { kind: 'exit', dg: d, x: ox + L.exit[0], y: L.exit[1] });
  for (const [id, x, y, name] of L.levers || []) LEVERS.push({ id, x: ox + x, y, name });
  (L.traps || []).forEach(([x, y], i) => TRAPS.push({ x: ox + x, y, r: 58, period: 2.6, off: i * 0.37, dg: d.id }));
}
DUNGEONS.forEach(buildDungeon);
// Học Viện cũng có phòng boss khép cửa sương như một hầm ngục
const ACAD_BOSS = { id: 'acad', bossRoom: { x: -2300, y: -900, w: 1500, h: 372 } };
function wallOn(w, enemy) {
  switch (w.gate) {
    case 'north': return enemy || !S.bossDead;
    case 'fog': return enemy || (G.bossFight && !!boss && boss.v === 1);
    case 'north2': return enemy || !S.boss2Dead;
    case 'fog2': return enemy || (G.bossFight && !!boss && boss.v === 2);
    case 'fort': return !S.fortOpen;
    case 'colo': return enemy || G.colo.active;
    case 'great': return !S.greatOpen;
    case 'acad': return !S.acadOpen;
    case 'lever': return !S.levers.includes(w.lever);
    case 'dg': return enemy || G.dfight === w.dg;
  }
  if (w.illusory) return !S.illusory.includes(w.illusory);
  return true;
}
// lưới không gian cho tường để va chạm nhanh
const WCELL = 400, WALL_GRID = new Map();
function indexWalls() {
  WALL_GRID.clear();
  for (const w of WALLS) {
    for (let gx = Math.floor(w.x / WCELL); gx <= Math.floor((w.x + w.w) / WCELL); gx++)
      for (let gy = Math.floor(w.y / WCELL); gy <= Math.floor((w.y + w.h) / WCELL); gy++) {
        const k = gx * 1000 + gy;
        if (!WALL_GRID.has(k)) WALL_GRID.set(k, []);
        WALL_GRID.get(k).push(w);
      }
  }
}
function wallsNear(x, y, r) {
  const out = [], gx0 = Math.floor((x - r) / WCELL), gx1 = Math.floor((x + r) / WCELL), gy0 = Math.floor((y - r) / WCELL), gy1 = Math.floor((y + r) / WCELL);
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    const c = WALL_GRID.get(gx * 1000 + gy);
    if (c) for (const w of c) if (!out.includes(w)) out.push(w);
  }
  return out;
}

// ───────────────────────── ân điển, vật phẩm, rương ─────────────────────────
const GRACES = [
  { id: 0, x: 1400, y: 3330, name: 'Ân Điển Nhà Nguyện Dawnrest' },
  { id: 1, x: 1850, y: 2950, name: 'Ân Điển Đồng Cỏ' },
  { id: 2, x: 700, y: 2320, name: 'Ân Điển Tàn Tích' },
  { id: 3, x: 1400, y: 1660, name: 'Ân Điển Trước Cổng Thornwall' },
  { id: 23, x: 870, y: 745, name: 'Ân Điển Nhà Nguyện Thornwall' },
  { id: 4, x: 2000, y: 2350, name: 'Ân Điển Bờ Đầm' },
  { id: 5, x: 3600, y: 1700, name: 'Ân Điển Chân Pháo Đài' },
  { id: 6, x: 3100, y: 2400, name: 'Ân Điển Rừng Wraithwood' },
  { id: 7, x: 3600, y: 2860, name: 'Ân Điển Đấu Trường' },
  { id: 8, x: 1300, y: 300, name: 'Ân Điển Cổng Bắc' },
  { id: 9, x: -450, y: 1800, name: 'Ân Điển Bờ Hồ Đông' },
  { id: 10, x: -2300, y: 1450, name: 'Ân Điển Mỏ Shardvein' },
  { id: 11, x: -1250, y: 560, name: 'Ân Điển Chân Học Viện' },
  { id: 12, x: -1400, y: 300, name: 'Ân Điển Cổng Học Viện' },
  { id: 13, x: -1550, y: -460, name: 'Ân Điển Thư Viện' },
  { id: 14, x: -1100, y: 3050, name: 'Ân Điển Bờ Biển' },
  { id: 15, x: 600, y: -300, name: 'Ân Điển Đồi Vàng' },
  { id: 16, x: 2700, y: -250, name: 'Ân Điển Cao Nguyên' },
  { id: 17, x: 3600, y: -1100, name: 'Ân Điển Sườn Núi' },
  { id: 18, x: 1400, y: -780, name: 'Ân Điển Cổng Kinh Thành' },
  { id: 19, x: 660, y: -960, name: 'Ân Điển Phố Vàng' },
  { id: 20, x: 1400, y: -1060, name: 'Ân Điển Trước Ngai' },
  { id: 21, x: 1250, y: -1660, name: 'Ân Điển Cây Aurum' },
  { id: 22, x: HUB.x + 500, y: 450, name: 'Sảnh Hearthhold', hub: true },
  ...DUNGEONS.map(d => ({ id: d.grace, x: d.area.x + d.L.grace[0], y: d.L.grace[1], name: 'Ân Điển ' + d.name, dg: d.id })),
];
// NPC ở Sảnh Hearthhold
const NPCS = [
  { id: 'smith', x: HUB.x + 220, y: 250, name: 'Thợ Rèn Hewen', col: '#8a5a3a' },
  { id: 'merchant', x: HUB.x + 780, y: 250, name: 'Lái Buôn Kale', col: '#6a5a3a' },
  { id: 'scholar', x: HUB.x + 220, y: 660, name: 'Học Giả Lyra', col: '#3a4a8a' },
  { id: 'priestess', x: HUB.x + 780, y: 660, name: 'Nữ Tu Seraphine', col: '#b8952f' },
];
const ITEMS = [
  { id: 'seed1', x: 470, y: 1710, loot: { seed: 1 } },
  { id: 'seed2', x: 2480, y: 2300, loot: { seed: 1 } },
  { id: 'seed3', x: 260, y: 2950, loot: { runes: 300, items: { knife: 5 } } },
  { id: 'seed4', x: 500, y: 800, loot: { runes: 400, items: { cure: 2 } } },
  { id: 'stone1', x: 910, y: 1710, loot: { items: { stone1: 2 } } },
  { id: 'stone2', x: 2715, y: 1235, loot: { items: { stone1: 2 } } },
  { id: 'stone3', x: 1000, y: 2960, loot: { items: { stone1: 1, firepot: 2 } } },
  { id: 'stone4', x: 2200, y: 900, loot: { items: { stone1: 2 } } },
  { id: 'seed5', x: 2130, y: 1985, loot: { seed: 1 } },
  { id: 'seed6', x: -2650, y: 2050, loot: { seed: 1 } },
  { id: 'tear1', x: -1450, y: 1800, loot: { tear: 1 } },
  { id: 'lake1', x: -600, y: 2500, loot: { items: { stone2: 1, grune1: 1 } } },
  { id: 'coast1', x: -2350, y: 3480, loot: { items: { grease: 2, stone1: 2 } } },
  { id: 'plat1', x: 3500, y: -600, loot: { items: { stone3: 1, grune2: 1 } } },
  { id: 'plat2', x: 150, y: 250, loot: { items: { somber2: 1 } } },
  { id: 'cap1', x: 1100, y: -1300, loot: { items: { stone3: 2 } } },
  { id: 'keepc', x: 800, y: 705, loot: { items: { cure: 3 } } },
  { id: 'keepnw', x: 880, y: 520, loot: { items: { stone1: 1, knife: 4 } } },
  { id: 'keepne', x: 1920, y: 540, loot: { runes: 600 } },
];
const CHESTS = [
  { id: 'c_sword', x: 820, y: 2980, loot: { weapon: 'sword' } },
  { id: 'c_katana', x: 700, y: 1760, loot: { weapon: 'katana' } },
  { id: 'c_spear', x: 2300, y: 3390, loot: { weapon: 'spear' } },
  { id: 'c_keep1', x: 785, y: 1280, loot: { items: { stone1: 2, cure: 2 } } },
  { id: 'c_keep2', x: 1625, y: 922, loot: { runes: 800, ash: 'deflect', items: { stone2: 1 } } },
  { id: 'c_keep3', x: 2025, y: 925, loot: { items: { firepot: 3, stone1: 2 } } },
  { id: 'c_keep4', x: 1950, y: 770, loot: { seed: 1, items: { somber1: 1 } } },
  { id: 'c_north', x: 2600, y: 900, loot: { runes: 300, items: { stone1: 2 } } },
  { id: 'c_west', x: 300, y: 1500, loot: { tal: 'crimson' } },
  { id: 'c_swamp', x: 2720, y: 2000, loot: { items: { stone1: 2, cure: 2 }, ash: 'whirl' } },
  { id: 'c_troll', x: 2900, y: 1150, loot: { seed: 1, items: { stone2: 1 } } },
  { id: 'c_fort_secret', x: 3284, y: 1190, loot: { tal: 'claw', items: { somber1: 1 } } },
  { id: 'c_keep', x: 3700, y: 610, loot: { items: { stone2: 2 }, armor: 'knightset', spirit: 'knight' } },
  { id: 'c_hut', x: 3025, y: 3225, loot: { ash: 'flame', items: { stone1: 2 } } },
  { id: 'c_glade', x: 3650, y: 2300, loot: { seed: 1, tear: 1 }, req: () => S.glade },
  { id: 'c_colo', x: 3600, y: 3330, loot: { runes: 2500, items: { stone2: 2 }, tal: 'blade' }, req: () => S.coloDone, noObst: true },
  // Hồ Crystalmere và bờ biển
  { id: 'c_isle1', x: -1750, y: 1250, loot: { items: { crystalkey: 1, stone2: 1 } } },
  { id: 'c_isle2', x: -950, y: 1700, loot: { tal: 'cerulean', runes: 600, spirit: 'jelly' } },
  { id: 'c_lake_w', x: -2600, y: 1100, loot: { weapon: 'rapier' } },
  { id: 'c_lake_n', x: -400, y: 650, loot: { items: { stone1: 3 }, ash: 'lunge' } },
  { id: 'c_wreck', x: -2300, y: 3300, loot: { weapon: 'axe' } },
  { id: 'c_beach', x: -900, y: 3450, loot: { weapon: 'longbow', items: { stone1: 2 } } },
  { id: 'c_cove', x: -2050, y: 2750, loot: { tal: 'arrow', seed: 1 } },
  // Học Viện
  { id: 'c_acad_secret', x: -900, y: 180, loot: { mem: 1, items: { somber1: 1 } } },
  { id: 'c_lib', x: -900, y: -470, loot: { weapon: 'crystalsword' } },
  { id: 'c_lib2', x: -1780, y: -180, loot: { spell: 'shard', tear: 1 } },
  { id: 'c_wing', x: -2250, y: -300, loot: { armor: 'crystalset', items: { stone2: 2 } } },
  // Cao Nguyên Aurelia và Kinh Thành
  { id: 'c_low1', x: 430, y: -482, loot: { items: { stone3: 1, somber2: 1 } } },
  { id: 'c_low2', x: 2035, y: -845, loot: { runes: 1500, items: { firepot: 3, cure: 2 } } },
  { id: 'c_gold1', x: 300, y: -600, loot: { tal: 'feather', items: { stone3: 1 } } },
  { id: 'c_gold2', x: 2300, y: 150, loot: { seed: 1, items: { stone2: 2 } } },
  { id: 'c_high1', x: 4200, y: -1700, loot: { weapon: 'greataxe', items: { stone3: 1 } } },
  { id: 'c_high2', x: 2900, y: -1300, loot: { tear: 1, pouch: 1 } },
  { id: 'c_cap1', x: 500, y: -1140, loot: { weapon: 'goldbow' } },
  { id: 'c_cap2', x: 2140, y: -1600, loot: { weapon: 'seal2', ash: 'holy' } },
  { id: 'c_cap3', x: 2436, y: -1340, loot: { armor: 'royalset' } },
  { id: 'c_cap4', x: 850, y: -1350, loot: { items: { somber2: 1, stone3: 2 }, tear: 1 } },
];
// rương trong hầm ngục (tọa độ cục bộ trong DG_LAYOUT)
for (const d of DUNGEONS) for (const [id, x, y, loot] of d.L.chests) CHESTS.push({ id, x: d.area.x + x, y, loot });
const NOTES = [
  { x: 1290, y: 1650, text: 'Cổng chính Thornwall bị chặn từ bên trong. Lính gác vẫn ra vào bằng cửa tuần tra phía tây.' },
  { x: 2160, y: 1150, text: 'Tường phía đông sập từ lâu. Lũ chó săn của pháo đài canh giữ chỗ này.' },
  { x: 1400, y: 3130, text: 'Lưỡi gươm đang chờ phía trước. Hãy lăn mình (Space) đúng khoảnh khắc thép vung xuống.' },
  { x: 1470, y: 2300, text: 'Kẻ thù nào rồi cũng lảo đảo. Đòn nặng tay bẻ gãy thế đứng nhanh hơn cả.' },
  { x: 2120, y: 2560, text: 'Nghe tiếng tru? Bầy sói săn theo đàn. Lùi lại, và hạ từng con một.' },
  { x: 700, y: 2230, text: 'Kho báu ở phía trước... cùng một kỵ sĩ không chịu chết. Khi hắn quỳ gối, hãy kết liễu hắn.' },
  { x: 1330, y: 1165, text: 'Kẻ gác cổng thích giữ lưỡi kiếm lâu hơn một nhịp. Kẻ nào lăn vội sẽ chết.' },
  { x: 1440, y: 330, text: 'Kinh Thành Aurumhold ngự trên đỉnh cao nguyên. Cổng lớn chỉ mở cho kẻ mang đủ ba Đại Ấn.' },
  { x: 2040, y: 2240, text: 'Một con rồng cổ ngủ giữa đầm lầy phương bắc. Hãy phi ngựa qua những ao độc tím.' },
  { x: 1470, y: 1165, text: 'Nâng khiên đúng lúc lưỡi kiếm chạm tới... rồi đâm xuyên kẻ đã mất thế.' },
  { x: 3600, y: 1530, text: '“Mặt trời mọc ở phía đông, đứng bóng trên đỉnh, rồi lặn về phía tây.” Hãy thắp lửa theo đúng hành trình của nó.' },
  { x: 3400, y: 1235, text: 'Bức tường phía tây nghe rỗng tuếch... Có lẽ nó chỉ là ảo ảnh. Thử vung kiếm xem.' },
  { x: 3160, y: 2330, text: 'Bốn tượng canh ngủ ở bốn góc rừng. Đánh thức cả bốn, kết giới linh hồn sẽ tan.' },
  { x: 3600, y: 3140, text: 'Chạm vào lá cờ máu để nhận lời thách đấu. Ba đợt kẻ thù, không có đường lui.' },
  { x: 3025, y: 3110, text: 'Một căn nhà không có cửa ra vào... Ai đã xây nó, và để giấu điều gì?' },
  { x: 2830, y: 1360, text: 'Gã khổng lồ đá chậm chạp mà chết chóc. Khi hắn giơ chùy, hãy lăn vào dưới chân hắn.' },
  { x: 160, y: 1905, text: 'Qua khe đá là Hồ Crystalmere. Nước hồ níu chân kẻ lữ hành; đừng để bị vây giữa làn nước.' },
  { x: -1500, y: 2260, text: 'Chìa khóa của Học Viện nằm trên hòn đảo phía tây bắc, giữa đám người pha lê không bao giờ ngủ.' },
  { x: -1450, y: 470, text: 'Cổng Học Viện Starhollow. Chỉ kẻ mang Chìa Khóa Pha Lê mới được bước qua.' },
  { x: -1180, y: 140, text: 'Cánh cửa này bị cài then từ phía bên kia.' },
  { x: 1400, y: 3060, text: 'Kẻ địch chỉ nhìn về phía trước. Đi chậm sau lưng chúng, đừng chạy, rồi đâm lén.' },
  { x: 700, y: 1770, text: 'Xương cốt nơi đây không chịu nằm yên. Chỉ lửa hay ánh sáng thánh mới cho chúng được ngủ hẳn.' },
  { x: -700, y: 1060, text: 'Mai cua pha lê cứng như khiên. Hãy vòng ra sau lưng, hoặc dùng đòn mạnh mà phá.' },
  { x: 2330, y: 1330, text: 'Lũ cóc thè lưỡi xa hơn ngươi nghĩ. Khi cổ chúng phồng tím, hãy né sang ngang.' },
  { x: -1080, y: 330, text: 'Góc sân này... có tiếng gió luồn qua một bức tường lẽ ra phải kín.' },
  { x: 560, y: -700, text: 'Khi cổng lớn khép lại, Hạ Thành bị bỏ ngoài tường. Kẻ ở lại giờ chỉ còn canh giữ những con phố trống.' },
  { x: 1400, y: -860, text: 'Cổng Kinh Thành Aurumhold. Ba Đại Ấn nằm trong tay vệ binh Greystone phương đông, con rồng Ashmire, và nữ hoàng Starhollow phương tây.' },
  { x: 1480, y: -1000, text: 'Kẻ gác cổng năm xưa chưa hề chết... Hắn đang chờ ở Sân Ngai Sunthrone.' },
  { x: 150, y: 3050, text: 'Lối xuống bờ biển Saltreach. Sóng đã gặm mòn một hầm mộ cổ bên mép nước.' },
];
for (const d of DUNGEONS) for (const [x, y, text] of d.L.notes || []) NOTES.push({ x: d.area.x + x, y, text });
const SPAWNS = [
  ['soldier', 1320, 2880], ['soldier', 1480, 2840],
  ['soldier', 1580, 2480], ['soldier', 1260, 2420], ['mage', 1080, 2620],
  ['wolf', 2250, 2750], ['wolf', 2300, 2700], ['wolf', 2200, 2680],
  ['soldier', 1700, 2150], ['soldier', 1560, 2000], ['mage', 1950, 1800],
  ['wolf', 2500, 2450], ['wolf', 2560, 2400],
  ['ghoul', 2160, 1380], ['ghoul', 2260, 1960], ['ghoul', 2660, 1380], ['ghoul', 2600, 2000],
  ['soldier', 600, 1760], ['soldier', 880, 1980], ['mage', 520, 1900], ['knight', 720, 1920],
  ['soldier', 1200, 1600], ['soldier', 1600, 1620], ['knight', 1920, 1450],
  ['wolf', 600, 900], ['wolf', 660, 950], ['soldier', 2200, 800], ['mage', 2400, 1100],
  ['soldier', 900, 3000], ['wolf', 2400, 3200], ['wolf', 2450, 3150], ['knight', 2330, 3270],
  // cao nguyên tro phía đông
  ['archer', 3100, 900], ['archer', 4200, 1100], ['troll', 2950, 1250], ['bat', 3050, 1500], ['bat', 3090, 1530], ['bat', 3020, 1560],
  ['spider', 4200, 1650], ['shield', 3300, 1560],
  // pháo đài
  ['shield', 3450, 1000], ['shield', 3750, 1000], ['archer', 3300, 850], ['archer', 3900, 850], ['bomber', 3600, 1150], ['soldier', 3390, 1180], ['warden', 3600, 650],
  // rừng linh hồn
  ['ghost', 3300, 2080], ['ghost', 3950, 2120], ['ghost', 3380, 2600], ['ghost', 3880, 2620], ['spider', 4120, 2380], ['spider', 3200, 2760],
  // phía nam
  ['bomber', 4200, 3300], ['shield', 4250, 3120], ['bat', 2900, 3050], ['bat', 2940, 3080], ['spider', 3050, 3420], ['knight', 4300, 2900],
  // Hồ Crystalmere
  ['lakehound', -600, 2330], ['lakehound', -660, 2440], ['lakehound', -520, 2440],
  ['sorcerer', -300, 1250], ['sorcerer', -1900, 620], ['sorcerer', -2350, 1150],
  ['crystal', -1690, 1230], ['crystal', -1810, 1290], ['knight', -1030, 1650],
  ['lakehound', -2050, 2020], ['lakehound', -2150, 2060], ['soldier', -1200, 2240], ['soldier', -1350, 2300], ['archer', -1000, 2380],
  ['lakehound', -1300, 1050], ['lakehound', -1150, 1150], ['bat', -700, 600], ['bat', -740, 640], ['troll', -2500, 800], ['mage', -1700, 2400],
  ['crystal', -600, 1500], ['sorcerer', -2550, 1900],
  // Bờ Biển Saltreach
  ['ghoul', -600, 3300], ['ghoul', -800, 3200], ['ghoul', -1300, 3420], ['soldier', -400, 3200], ['archer', -1900, 3320],
  ['lakehound', -2200, 3000], ['lakehound', -2260, 3060], ['knight', -1800, 2800], ['bomber', -1000, 3520], ['bat', -1500, 2950], ['bat', -1540, 2990],
  // Học Viện Starhollow
  ['sorcerer', -1900, 250], ['sorcerer', -1150, 200], ['crystal', -1700, 180], ['shield', -2000, 320],
  ['crystal', -2100, -100], ['sorcerer', -2150, -430], ['knight', -2150, 0],
  ['sorcerer', -1700, -340], ['sorcerer', -1300, -180], ['crystal', -1000, -340], ['sorcerer', -1000, -20], ['bat', -1500, -40],
  ['selvara', -1550, -740],
  // Pháo Đài Thornwall: lính tuần ngoài cửa sau, sân tây, đại sảnh, doanh trại, sân đông và sân ngoài
  ['soldier', 640, 1220], ['soldier', 655, 980], ['warhound', 2200, 1100], ['warhound', 2235, 1145],
  ['soldier', 850, 960], ['soldier', 920, 1010], ['archer', 790, 1250], ['bomber', 960, 1180], ['knight', 880, 1120],
  ['shield', 1250, 960], ['shield', 1550, 960], ['soldier', 1300, 1100], ['soldier', 1500, 1100], ['knight', 1400, 1010],
  ['soldier', 1850, 980], ['soldier', 1980, 1050], ['bomber', 1900, 1180], ['warhound', 1820, 1200], ['archer', 2000, 940],
  ['warhound', 1800, 1430], ['warhound', 1850, 1455], ['soldier', 1980, 1420],
  ['soldier', 1200, 1340], ['soldier', 1250, 1420], ['shield', 1600, 1350], ['archer', 1150, 1300], ['soldier', 1580, 1450],
  // Cao Nguyên Aurelia
  ['royal', 1500, -100], ['garcher', 1000, 100], ['lion', 900, -250], ['priest', 700, -150], ['royal', 2200, -300], ['garcher', 1800, -300],
  ['priest', 2600, 0], ['lion', 3200, -300], ['royal', 3800, 100], ['garcher', 4000, -200],
  ['garcher', 400, 100], ['troll', 3000, 200],
  // Sườn Núi Goldspire
  ['lion', 3300, -1500], ['royal', 3800, -1250], ['garcher', 4100, -1000], ['priest', 3100, -1100], ['troll', 2900, -1650], ['garcher', 4200, -1450],
  // Hạ Thành: lính gác đường phố, cung thủ ở đầu phố, hiệp sĩ canh rương ở ngõ sau
  ['soldier', 1230, -560], ['soldier', 1560, -700], ['soldier', 560, -700], ['soldier', 600, -725], ['lion', 900, -700], ['royal', 2250, -700],
  ['royal', 1900, -700], ['garcher', 2330, -620], ['garcher', 1450, -870], ['knight', 600, -485], ['gargoyle', 1720, -470], ['priest', 1000, -760],
  // Kinh Thành Aurumhold
  ['royal', 680, -1600], ['priest', 500, -1450], ['garcher', 850, -1370], ['lion', 650, -1340], ['garcher', 360, -1250],
  ['royal', 2000, -1420], ['priest', 2280, -1480], ['garcher', 2100, -1250], ['royal', 2300, -1220], ['garcher', 1810, -1500], ['knight', 2140, -1050],
  ['lion', 1700, -1010], ['royal', 1100, -990],
  // quái đặc trưng từng vùng
  ['boar', 1850, 3000], ['boar', 1900, 3060], ['boar', 800, 2500], ['boar', 2100, 2300], ['boar', 1020, 3200], ['boar', 2000, 2600],
  ['skeleton', 520, 1700], ['skeleton', 900, 1700], ['skeleton', 640, 2100],
  ['toad', 2400, 1500], ['toad', 2500, 1850], ['toad', 2250, 1750],
  ['salamander', 3040, 1400], ['salamander', 4360, 1300], ['salamander', 3600, 1700], ['salamander', 4350, 3000], ['salamander', 2930, 3300],
  ['warhound', 3300, 700], ['warhound', 3850, 700],
  ['wisp', 3520, 2240], ['wisp', 3500, 2450], ['wisp', 3730, 2500], ['wisp', 4000, 2300], ['wisp', 3100, 2400],
  ['crab', -560, 1500], ['crab', -1400, 2000], ['crab', -2200, 1500], ['crab', -800, 1000], ['crab', -1120, 3300], ['crab', -2300, 3350],
  ['jelly', -1400, 1450], ['jelly', -1200, 1300], ['jelly', -1600, 1600], ['jelly', -2250, 2250], ['jelly', -500, 900],
  ['drowned', -700, 3400], ['drowned', -1600, 3300], ['drowned', -2000, 3100], ['drowned', -400, 3000],
  ['grimoire', -1400, -60], ['grimoire', -1820, -200], ['grimoire', -1200, 140], ['grimoire', -1960, -600], ['grimoire', -1060, -600],
  ['eagle', 1200, 200], ['eagle', 2600, -200], ['eagle', 3500, 0], ['eagle', 300, -300],
  ['ram', 3000, -1300], ['ram', 3600, -1600], ['ram', 3880, -1100], ['ram', 3270, -1760],
  ['crabking', -1620, 2150], ['admiral', -1540, 3550], ['ramking', 3500, -1690],
  ['gargoyle', 1000, -1500], ['gargoyle', 1800, -1200], ['gargoyle', 1300, -1030], ['gargoyle', 650, -1210],
];
// quái trong hầm ngục (tọa độ cục bộ trong DG_LAYOUT) và boss ở phòng cuối
for (const d of DUNGEONS) {
  for (const [t, x, y] of d.L.spawns) SPAWNS.push([t, d.area.x + x, y]);
  SPAWNS.push([d.boss, d.area.x + d.L.boss[0], d.L.boss[1]]);
}
const REGIONS = [
  { name: 'Cõi Aurum', test: x => x > INST_X && x < 11050 },
  { name: 'Sảnh Hearthhold', test: x => x >= 11050 && x < 12150 },
  ...DUNGEONS.map(d => ({ name: d.name, test: x => x >= d.area.x - 50 && x < d.area.x + d.area.w + 50 })),
  { name: 'Cây Aurum', test: (x, y) => y < ARENA2.y && x > sk(1000) && x < sk(1800) },
  { name: 'Sân Ngai Sunthrone', test: (x, y) => inRect(x, y, ARENA2) },
  { name: 'Kinh Thành Aurumhold', test: (x, y) => inRect(x, y, CAPITAL) },
  { name: 'Hạ Thành Aurumhold', test: (x, y) => inRect(x, y, LOWTOWN) },
  { name: 'Sườn Núi Goldspire', test: (x, y) => y < sk(-900) && x > sk(2500) },
  { name: 'Học Viện Starhollow', test: (x, y) => inRect(x, y, ACAD) },
  { name: 'Cao Nguyên Aurelia', test: (x, y) => x >= 0 && y < sk(390) },
  { name: 'Bờ Biển Saltreach', test: (x, y) => x < 0 && y >= sk(2600) },
  { name: 'Hồ Crystalmere', test: x => x < 0 },
  { name: 'Cổng Gác Thornwall', test: (x, y) => inRect(x, y, THORN_R) && y > sk(420) },
  { name: 'Đầm Lầy Ashmire', test: (x, y) => x > SWAMP.x && x < SWAMP.x + SWAMP.w && y > SWAMP.y && y < SWAMP.y + SWAMP.h },
  { name: 'Tàn Tích Hollowmere', test: (x, y) => x > sk(380) && x < sk(1020) && y > sk(1600) && y < sk(2200) },
  { name: 'Nhà Nguyện Dawnrest', test: (x, y) => x > sk(1220) && x < sk(1580) && y > sk(3170) },
  { name: 'Pháo Đài Greystone', test: (x, y) => inRect(x, y, FORT) },
  { name: 'Đấu Trường Bloodsand', test: (x, y) => inRect(x, y, COLO.rect) },
  { name: 'Rừng Wraithwood', test: (x, y) => inRect(x, y, FOREST) },
  { name: 'Cao Nguyên Cinderreach', test: (x) => x > sk(2800) && x < INST_X },
  { name: 'Đồng Cỏ Mistveil', test: () => true },
];
const regionAt = (x, y) => REGIONS.find(r => r.test(x, y)).name;
// hệ số sức mạnh của quái theo vùng đất (như Elden Ring: mạnh theo vùng, không theo cấp người chơi)
const REGION_MUL = {
  'Cõi Aurum': 2.0, 'Sảnh Hearthhold': 1, 'Cây Aurum': 1.9, 'Sân Ngai Sunthrone': 1.9, 'Kinh Thành Aurumhold': 1.85, 'Hạ Thành Aurumhold': 1.75, 'Sườn Núi Goldspire': 1.8,
  'Học Viện Starhollow': 1.55, 'Cao Nguyên Aurelia': 1.7, 'Bờ Biển Saltreach': 1.2, 'Hồ Crystalmere': 1.4, 'Cổng Gác Thornwall': 1.2,
  'Đầm Lầy Ashmire': 1.25, 'Tàn Tích Hollowmere': 1.1, 'Nhà Nguyện Dawnrest': 1, 'Pháo Đài Greystone': 1.45, 'Đấu Trường Bloodsand': 1.5,
  'Rừng Wraithwood': 1.4, 'Cao Nguyên Cinderreach': 1.35, 'Đồng Cỏ Mistveil': 1,
};
for (const d of DUNGEONS) REGION_MUL[d.name] = d.mul;

// ───────────────────────── chướng ngại (cây, đá) sinh bằng seed cố định ─────────────────────────
const OBST = [];
const CELL = 160, GRID = new Map();
function addObst(o) {
  OBST.push(o);
  const k = Math.floor(o.x / CELL) + ',' + Math.floor(o.y / CELL);
  if (!GRID.has(k)) GRID.set(k, []);
  GRID.get(k).push(o);
}
function nearRoad(x, y) { let m = 1e9; for (const R of ROADS) for (let i = 1; i < R.length; i++) m = Math.min(m, segDist(x, y, R[i - 1][0], R[i - 1][1], R[i][0], R[i][1])); return m; }
function spotBlocked(x, y, pad) {
  if (x < WX0 + 60 || x > MAPW - 60 || y < WY0 + 60 || y > H - 60) return true;
  for (const w of wallsNear(x, y, 60 + pad)) if (inRect(x, y, w, 34 + pad)) return true;
  if (inRect(x, y, THORN_R, 30)) return true;
  if (x > sk(370) && x < sk(1030) && y > sk(1600) && y < sk(2210)) return true;
  if (x > sk(1210) && x < sk(1590) && y > sk(3150)) return true;
  if (inRect(x, y, CAPITAL, 20) || inRect(x, y, LOWTOWN, 30) || inRect(x, y, ACAD, 20)) return true;
  if (dist(x, y, TREE_POS.x, TREE_POS.y) < sk(340)) return true;
  if (nearRoad(x, y) < sk(58) + pad) return true;
  if (dist(x, y, LAIR.x, LAIR.y) < sk(360)) return true;
  if (inRect(x, y, FORT, 34) || inRect(x, y, COLO.rect, 34) || (x > sk(2920) && x < sk(3130) && y > sk(3120) && y < sk(3330))) return true;
  if (dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r + 40) return true;
  if (x > sk(3380) && x < sk(3820) && y > sk(1330) && y < sk(1560)) return true;
  if (LAKE.some(l => inEll(x, y, l, 30 + pad))) return true;
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / (rx + pad + 16), dy = (y - py) / (ry + pad + 16); if (dx * dx + dy * dy < 1) return true; }
  // chừa chỗ quanh ân điển, vật phẩm, lời nhắn, quái, cửa hầm và cần gạt (tra theo lưới cho nhanh)
  const kx = Math.floor(x / KEEP_CELL), ky = Math.floor(y / KEEP_CELL);
  for (let gx = kx - 1; gx <= kx + 1; gx++) for (let gy = ky - 1; gy <= ky + 1; gy++) {
    const c = KEEP.get(gx * 100000 + gy);
    if (c) for (const [px, py, pr] of c) if (dist(x, y, px, py) < pr) return true;
  }
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
    const c = GRID.get(gx + ',' + gy);
    if (c) for (const o of c) if (dist(x, y, o.x, o.y) < o.r + pad + 36) return true;
  }
  return false;
}
const KEEP = new Map(), KEEP_CELL = 140;
function keepOut(x, y, rr) {
  // vùng lớn hơn một ô được ghi vào mọi ô nó phủ, vì lúc tra chỉ xét các ô kề nhau
  const e = [x, y, rr], n = Math.max(0, Math.ceil(rr / KEEP_CELL) - 1), cx = Math.floor(x / KEEP_CELL), cy = Math.floor(y / KEEP_CELL);
  for (let gx = cx - n; gx <= cx + n; gx++) for (let gy = cy - n; gy <= cy + n; gy++) { const key = gx * 100000 + gy; if (!KEEP.has(key)) KEEP.set(key, []); KEEP.get(key).push(e); }
}
function genObstacles() {
  const r = mulberry32(20250311);
  for (const g of GRACES) keepOut(g.x, g.y, 130);
  for (const it of ITEMS) keepOut(it.x, it.y, 60);
  for (const n of NOTES) keepOut(n.x, n.y, 50);
  for (const sp of SPAWNS) keepOut(sp[1], sp[2], 55);
  for (const d of DOORS) keepOut(d.x, d.y, 110);
  for (const l of LEVERS) keepOut(l.x, l.y, 60);
  for (const q of POIS) keepOut(q.x, q.y, q.type === 'stones' ? 160 : 210);
  for (const c of CHESTS) if (!c.noObst) addObst({ kind: 'chest', x: c.x, y: c.y, r: 14, chest: c });
  for (const b of BRAZIERS) addObst({ kind: 'brazier', x: b.x, y: b.y, r: 14 });
  for (const st of STATUES) addObst({ kind: 'statue', x: st.x, y: st.y, r: 16 });
  for (const f of MAP_FRAGS) addObst({ kind: 'stele', x: f.x, y: f.y, r: 12 });
  for (const l of LEVERS) addObst({ kind: 'lever', x: l.x, y: l.y, r: 10, lever: l });
  for (const n of NPCS) addObst({ kind: 'npc', x: n.x, y: n.y, r: 16, npc: n });
  addObst({ kind: 'flag', x: FLAG.x, y: FLAG.y, r: 8 });
  addObst({ kind: 'bigtree', x: TREE_POS.x, y: TREE_POS.y, r: 58 });
  const DR = { fountain: 32, lamp: 6, stall: 20, statue: 15, crate: 10, well: 16 };
  const deco = o => { o.kind = 'deco'; addObst(o); DECO_OBJ.push(o); };
  for (const [d, x, y, rr] of DECOS) deco({ d, x: sk(x), y: sk(y), r: sk(rr || DR[d]), seed: (x * 13 + y * 7) & 1023 });
  for (const q of POIS) q.deco.forEach(deco);
  // cột đổ trong tàn tích, Học Viện, Sân Ngai Sunthrone và các hầm ngục
  const pillar = (x, y, rr) => addObst({ kind: 'rock', x, y, r: rr, seed: (x * 7 + y) | 0, pillar: true });
  const wpillar = (x, y, rr) => pillar(sk(x), sk(y), rr);
  [[560, 1760, 16], [820, 1800, 18], [520, 2040, 15], [880, 2080, 14], [760, 1720, 12]].forEach(p => wpillar(...p));
  [[-2000, -760, 20], [-1100, -760, 20], [-2000, -620, 18], [-1100, -620, 18], [-1800, 250, 16], [-1300, 180, 16]].forEach(p => wpillar(...p));
  [[1150, -1480, 18], [1650, -1480, 18], [1150, -1220, 18], [1650, -1220, 18]].forEach(p => wpillar(...p));
  [[1220, 960, 16], [1580, 960, 16], [1220, 1050, 16], [1580, 1050, 16], [1220, 1140, 16], [1580, 1140, 16]].forEach(p => wpillar(...p));
  for (const d of DUNGEONS) for (const [x, y, rr, cr] of d.L.pillars || []) { if (cr) addObst({ kind: 'rock', x: d.area.x + x, y, r: rr, seed: (x * 7 + y) | 0, crystal: true }); else pillar(d.area.x + x, y, rr); }
  ruinPillars(pillar);
  // cây và đá theo từng vùng
  const zones = [
    { x: 0, y: 420, w: 4400, h: 3180, trees: 370, rocks: 85 },
    { x: -2800, y: 400, w: 2800, h: 2200, trees: 120, rocks: 40, pal: 'lake', crystals: 26 },
    { x: -2480, y: 2600, w: 2480, h: 1000, trees: 45, rocks: 50, pal: 'coast' },
    { x: 0, y: -900, w: 4400, h: 1280, trees: 190, rocks: 40, golden: 1 },
    { x: 2500, y: -1800, w: 1900, h: 900, trees: 70, rocks: 40, golden: 1 },
  ];
  for (const z0 of zones) {
    // vùng rộng ra K² lần diện tích nên số cây đá cũng tăng theo, giữ nguyên mật độ
    const z = Object.assign({}, z0, { x: sk(z0.x), y: sk(z0.y), w: sk(z0.w), h: sk(z0.h), trees: Math.round(z0.trees * K * K), rocks: Math.round(z0.rocks * K * K), crystals: Math.round((z0.crystals || 0) * K * K) });
    let n = 0, tries = 0;
    while (n < z.trees && tries++ < z.trees * 40) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h, tr = 13 + r() * 6;
      if (spotBlocked(x, y, 22)) continue;
      n++;
      const golden = z.golden ? r() < 0.85 : !z.pal && r() < 0.22;
      addObst({ kind: 'tree', x, y, r: tr, cr: tr * 2.6 + r() * 12, golden, spr: (r() * 4) | 0, pal: z.pal, dead: !z.pal && x > SWAMP.x - 40 && x < 2820 && y > SWAMP.y && y < SWAMP.y + SWAMP.h, spirit: inRect(x, y, FOREST) });
    }
    n = 0; tries = 0;
    while (n < z.rocks && tries++ < z.rocks * 40) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h, rr = 12 + r() * 16;
      if (spotBlocked(x, y, 10)) continue;
      n++; addObst({ kind: 'rock', x, y, r: rr, seed: (r() * 1e6) | 0 });
    }
    n = 0; tries = 0;
    while (n < (z.crystals || 0) && tries++ < 2000) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h;
      if (spotBlocked(x, y, 6)) continue;
      n++; addObst({ kind: 'rock', x, y, r: 10 + r() * 8, seed: (r() * 1e6) | 0, crystal: true });
    }
  }
  // đá lởm chởm dọc hai bậc vách Goldspire
  for (const w of WALLS) if (w.cliff && (w.ridge || w.y < sk(-1000))) for (let x = w.x + 20; x < w.x + w.w; x += 40) addObst({ kind: 'rock', x: x + r() * 12, y: w.y + w.h * (0.2 + r() * 0.6), r: 20 + r() * 12, seed: (r() * 1e6) | 0, cliff: true });
  // mép vách đá
  for (let x = 20; x < MAPW; x += 44) {
    if ((x > sk(940) && x < sk(1860)) || x > MAPW - 30) continue;
    addObst({ kind: 'rock', x: x + r() * 12, y: sk(398) + r() * 14, r: 20 + r() * 10, seed: (r() * 1e6) | 0, cliff: true });
  }
  for (let y = sk(420); y < H; y += 44) {
    if ((y > sk(1840) && y < sk(1990)) || (y > sk(2930) && y < sk(3170))) continue;
    addObst({ kind: 'rock', x: sk(-20) + r() * 12, y: y + r() * 12, r: 20 + r() * 10, seed: (r() * 1e6) | 0, cliff: true });
  }
}

// ───────────────────────── dựng sẵn hình ảnh ─────────────────────────
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const isVoid = (x, y) => WALLS.some(w => (w.void || w.sea) && inRect(x, y, w));
// nền đá lát, tint là màu pha
function paintFloor(g, r, x, y, w, h, ts, holes, base, tint = [12, 9, 0]) {
  // đá lát: mỗi phiến có mặt hơi lệch màu, cạnh trên trái sáng, cạnh dưới phải tối (vát), vết sứt, vết nứt và rêu ở nền hoang
  const rgb = v => `rgb(${Math.max(0, v + tint[0])},${Math.max(0, v + tint[1])},${Math.max(0, v + tint[2])})`;
  for (let ty = y; ty < y + h; ty += ts) for (let tx = x; tx < x + w; tx += ts) {
    if (holes && r() < holes) continue;
    const s = base + ((r() * 16) | 0), tw = Math.min(ts, x + w - tx) - 3, th = Math.min(ts, y + h - ty) - 3, x0 = tx + 1.5, y0 = ty + 1.5;
    if (tw <= 2 || th <= 2) continue;
    g.fillStyle = rgb(s); g.fillRect(x0, y0, tw, th);
    g.fillStyle = rgb(s + 16); g.fillRect(x0, y0, tw, 2); g.fillRect(x0, y0, 2, th);
    g.fillStyle = rgb(s - 18); g.fillRect(x0, y0 + th - 2, tw, 2); g.fillRect(x0 + tw - 2, y0, 2, th);
    for (let k = 0; k < 3; k++) { g.fillStyle = rgb(s - 12 - ((r() * 10) | 0)); g.fillRect(x0 + 3 + r() * (tw - 8), y0 + 3 + r() * (th - 8), 2 + r() * 3, 2 + r() * 2); }
    if (r() < 0.28) {
      g.strokeStyle = 'rgba(20,18,14,.5)'; g.lineWidth = 1.2; g.beginPath();
      let cx = x0 + r() * tw, cy = y0 + r() * th; g.moveTo(cx, cy);
      for (let k = 0; k < 3; k++) { cx = Math.min(x0 + tw, Math.max(x0, cx + (r() - 0.5) * ts * 0.5)); cy = Math.min(y0 + th, Math.max(y0, cy + (r() - 0.5) * ts * 0.5)); g.lineTo(cx, cy); }
      g.stroke();
    }
    if (holes > 0.1 && r() < 0.3) { g.fillStyle = 'rgba(80,104,48,.45)'; g.beginPath(); g.arc(tx + (r() < 0.5 ? 2 : ts - 2), ty + r() * ts, 3 + r() * 5, 0, TAU); g.fill(); }
  }
}
function blobs(g, r, n, x, y, w, h, cols, a0, a1, s0 = 30, s1 = 90) {
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    if (isVoid(px, py)) continue;
    g.globalAlpha = a0 + r() * a1; g.fillStyle = cols[(r() * cols.length) | 0];
    g.beginPath(); g.ellipse(px, py, s0 + r() * (s1 - s0), (s0 + r() * (s1 - s0)) * 0.6, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
// nền đất vẽ ở tọa độ thiết kế trước khi thế giới được phóng to, rồi dùng phép biến đổi để phủ đúng kích thước thật;
// GS là số điểm ảnh của nền trên mỗi đơn vị thế giới (thấp hơn 0.5 để canvas không vượt giới hạn của điện thoại)
const GS = 0.3;
function buildGround() {
  const WX0 = D.WX0, WY0 = D.WY0, MAPW = D.MAPW, H = D.H;
  const inWater = (x, y) => y >= 380 && y <= 2600 && x <= 0 && LAKE.some(l => inEll(x, y, l)) && !ISLES.some(l => inEll(x, y, l));
  const GW = MAPW - WX0, GH = H - WY0;
  const c = makeCanvas(Math.ceil(GW * K * GS), Math.ceil(GH * K * GS)), g = c.getContext('2d'), r = mulberry32(77);
  g.scale(GS * K, GS * K); g.translate(-WX0, -WY0);
  g.fillStyle = '#454f2e'; g.fillRect(WX0, WY0, GW, GH);
  blobs(g, r, 5200, WX0, WY0, GW, GH, ['#3d4729', '#4f5a33', '#5a6138', '#48532d', '#626a3c', '#3a4226', '#57603a'], 0.22, 0.25, 20, 110);
  g.globalAlpha = 0.5; g.lineWidth = 2;
  for (let i = 0; i < 18000; i++) {
    const x = WX0 + r() * GW, y = WY0 + r() * GH;
    g.strokeStyle = r() < 0.5 ? '#66713d' : '#343d1e';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 7, y - 4 - r() * 7); g.stroke();
  }
  g.globalAlpha = 0.85;
  for (let i = 0; i < 3000; i++) {
    const p = r();
    g.fillStyle = p < 0.55 ? '#d9c46a' : p < 0.85 ? '#e9e2cf' : '#b7a0d4';
    g.beginPath(); g.arc(WX0 + r() * GW, WY0 + r() * GH, 1.4 + r() * 1.6, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // Cao Nguyên Aurelia: đồng cỏ vàng óng
  g.fillStyle = 'rgba(176,146,70,.72)'; g.fillRect(0, WY0, MAPW, 380 - WY0);
  const ng = g.createLinearGradient(0, 300, 0, 470);
  ng.addColorStop(0, 'rgba(176,146,70,.72)'); ng.addColorStop(1, 'rgba(176,146,70,0)');
  g.fillStyle = ng; g.fillRect(0, 300, MAPW, 170);
  blobs(g, r, 1400, 0, WY0, MAPW, 380 - WY0, ['#a88a44', '#c4a256', '#96783a', '#d2b066'], 0.2, 0.25);
  for (let i = 0; i < 3000; i++) { g.globalAlpha = 0.75; g.fillStyle = r() < 0.5 ? '#f0d27a' : '#fff1b8'; g.beginPath(); g.arc(r() * MAPW, WY0 + r() * (380 - WY0), 1.5 + r() * 2, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // Hồ Crystalmere: cỏ xanh lam, bờ cát và nước nông
  blobs(g, r, 1300, WX0, 400, -WX0, 2200, ['#3e5a4c', '#4a6a5a', '#35503f', '#56725e'], 0.25, 0.25);
  for (const [px, py, rx, ry] of LAKE) { g.fillStyle = '#8a8466'; g.beginPath(); g.ellipse(px, py, rx + 26, ry + 22, 0, 0, TAU); g.fill(); }
  for (const [px, py, rx, ry] of LAKE) { g.fillStyle = '#3a6078'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill(); }
  for (const [px, py, rx, ry] of LAKE) {
    const lg = g.createRadialGradient(px, py, 10, px, py, Math.max(rx, ry));
    lg.addColorStop(0, 'rgba(40,78,110,.9)'); lg.addColorStop(1, 'rgba(70,120,140,0)');
    g.fillStyle = lg; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.35;
  for (let i = 0; i < 900; i++) {
    const x = WX0 + r() * -WX0, y = 400 + r() * 2200;
    if (!inWater(x, y)) continue;
    g.strokeStyle = r() < 0.6 ? '#9fd0e8' : '#cfeaf6'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 20, y); g.stroke();
  }
  g.globalAlpha = 1;
  for (const [px, py, rx, ry] of ISLES) {
    g.fillStyle = '#9a9070'; g.beginPath(); g.ellipse(px, py, rx + 14, ry + 12, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a6a52'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,150,110,.35)'; g.beginPath(); g.ellipse(px - rx * 0.2, py - ry * 0.2, rx * 0.6, ry * 0.5, 0, 0, TAU); g.fill();
  }
  // Bờ Biển Saltreach
  blobs(g, r, 700, WX0, 2600, -WX0, 1000, ['#6a6a48', '#77734e', '#5e5e40'], 0.3, 0.25);
  const sg = g.createLinearGradient(-2480, 0, -2050, 0);
  sg.addColorStop(0, '#c8b684'); sg.addColorStop(1, 'rgba(200,182,132,0)');
  g.fillStyle = sg; g.fillRect(-2480, 2600, 430, 1000);
  const seag = g.createLinearGradient(WX0, 0, -2480, 0);
  seag.addColorStop(0, '#16304a'); seag.addColorStop(1, '#2d5a74');
  g.fillStyle = seag; g.fillRect(WX0, 2600, 320, 1000);
  g.strokeStyle = 'rgba(230,240,245,.55)'; g.lineWidth = 3;
  for (let y = 2610; y < H; y += 26) { g.beginPath(); g.moveTo(-2480 + Math.sin(y * 0.05) * 8, y); g.lineTo(-2480 + Math.sin(y * 0.05 + 1) * 8, y + 22); g.stroke(); }
  // đầm lầy phía đông
  for (let i = 0; i < 520; i++) {
    g.globalAlpha = 0.25 + r() * 0.22; g.fillStyle = r() < 0.5 ? '#3b3a2c' : '#463b40';
    g.beginPath(); g.ellipse(SWAMP.x + r() * SWAMP.w, SWAMP.y + r() * SWAMP.h, 30 + r() * 80, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const lg = g.createRadialGradient(LAIR.x, LAIR.y, 20, LAIR.x, LAIR.y, 320);
  lg.addColorStop(0, 'rgba(38,30,24,.75)'); lg.addColorStop(1, 'rgba(38,30,24,0)');
  g.fillStyle = lg; g.beginPath(); g.arc(LAIR.x, LAIR.y, 320, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(214,204,184,.55)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = 90 + r() * 200, x = LAIR.x + Math.cos(a) * d, y = LAIR.y + Math.sin(a) * d, b = r() * TAU, l = 6 + r() * 12;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke();
  }
  for (const [px, py, rx, ry] of POOLS) {
    g.fillStyle = '#3a2f3d'; g.beginPath(); g.ellipse(px, py, rx + 8, ry + 8, 0, 0, TAU); g.fill();
    g.fillStyle = '#6a4f73'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(170,130,185,.35)'; g.beginPath(); g.ellipse(px - rx * 0.25, py - ry * 0.3, rx * 0.5, ry * 0.35, 0, 0, TAU); g.fill();
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  // cao nguyên tro phía đông
  for (let i = 0; i < 1400; i++) {
    const x = 2800 + r() * (MAPW - 2800), y = 420 + r() * (H - 420);
    g.globalAlpha = 0.18 + r() * 0.2; g.fillStyle = r() < 0.5 ? '#55503f' : '#4a4a3a';
    g.beginPath(); g.ellipse(x, y, 30 + r() * 90, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  for (let i = 0; i < 700; i++) {
    const x = FOREST.x + r() * FOREST.w, y = FOREST.y + r() * FOREST.h;
    g.globalAlpha = 0.25 + r() * 0.2; g.fillStyle = r() < 0.5 ? '#2f4a48' : '#355652';
    g.beginPath(); g.ellipse(x, y, 30 + r() * 80, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.85;
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.6 ? '#9fe8e0' : '#d9fff8'; g.beginPath(); g.arc(FOREST.x + r() * FOREST.w, FOREST.y + r() * FOREST.h, 1.3 + r() * 1.5, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // con đường
  const road = (w, col, a) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; for (const R of ROADS) { g.beginPath(); R.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
  road(88, '#4d432c', 0.5); road(66, '#6c5d40', 0.85); road(38, '#7e6d4b', 0.5);
  g.globalAlpha = 0.6;
  for (const R of ROADS) for (let i = 1; i < R.length; i++) {
    const [ax, ay] = R[i - 1], [bx, by] = R[i];
    for (let k = 0; k < 40; k++) { const t = r(); g.fillStyle = r() < 0.5 ? '#8d7c58' : '#554a33'; g.beginPath(); g.arc(lerp(ax, bx, t) + (r() - 0.5) * 50, lerp(ay, by, t) + (r() - 0.5) * 20, 1.5 + r() * 2.5, 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
  const floor = (...a) => paintFloor(g, r, ...a);
  // Pháo Đài Thornwall: nền đá lát theo từng phòng, sân gác cổng có vòng khắc, đại sảnh trải thảm đỏ
  for (const [x, y, w, h] of THORN_ROOMS) { g.fillStyle = '#3a372f'; g.fillRect(x, y, w, h); floor(x, y, w, h, w > 200 && h > 200 ? 46 : 30, 0.04, 70); }
  g.strokeStyle = 'rgba(214,178,94,.22)'; g.lineWidth = 4;
  g.beginPath(); g.arc(1400, 610, 150, 0, TAU); g.stroke();
  g.beginPath(); g.arc(1400, 610, 95, 0.3, TAU - 0.3); g.stroke();
  g.fillStyle = 'rgba(110,30,26,.6)'; g.fillRect(1350, 910, 100, 290); g.fillRect(1360, 1200, 80, 80);
  g.strokeStyle = 'rgba(214,178,94,.45)'; g.lineWidth = 2; g.strokeRect(1356, 914, 88, 282);
  g.fillStyle = 'rgba(60,50,30,.35)'; for (const [x, y, w, h] of [[760, 880, 240, 420], [1720, 1360, 330, 140]]) g.fillRect(x, y, w, h);
  floor(430, 1660, 540, 490, 44, 0.3, 64);
  floor(1260, 3210, 280, 240, 40, 0.05, 72);
  floor(1340, 200, 120, 200, 40, 0.15, 86);
  floor(3210, 510, 780, 780, 48, 0.06, 62);
  floor(3420, 530, 360, 240, 40, 0.02, 52);
  floor(2960, 3160, 130, 130, 32, 0, 60);
  g.fillStyle = '#7d6d4f'; g.fillRect(3210, 2960, 780, 540);
  g.strokeStyle = 'rgba(60,48,30,.35)'; g.lineWidth = 3;
  for (const rr of [60, 140, 220]) { g.beginPath(); g.ellipse(COLO.x, COLO.y, rr * 1.3, rr, 0, 0, TAU); g.stroke(); }
  // Học Viện Starhollow: đá lát xanh lam, thảm thư viện
  g.fillStyle = '#2a2f3a'; g.fillRect(ACAD.x, ACAD.y, ACAD.w, ACAD.h);
  floor(ACAD.x, ACAD.y, ACAD.w, ACAD.h, 44, 0.02, 50, [0, 6, 18]);
  g.fillStyle = 'rgba(60,70,120,.45)'; g.fillRect(-1560, -500, 120, 572);
  g.strokeStyle = 'rgba(170,210,255,.25)'; g.lineWidth = 4;
  for (const rr of [80, 160]) { g.beginPath(); g.arc(-1550, -720, rr, 0, TAU); g.stroke(); }
  // Kinh Thành Aurumhold: đá lát màu cát vàng, Sân Ngai Sunthrone và gốc Cây Aurum
  floor(CAPITAL.x, CAPITAL.y, CAPITAL.w, CAPITAL.h, 50, 0.01, 96, [22, 14, -4]);
  floor(ARENA2.x, ARENA2.y, ARENA2.w, ARENA2.h, 50, 0.02, 80, [18, 10, -6]);
  // đại lộ từ cổng lớn tới Sân Ngai: đá sáng hơn, viền vàng
  floor(1330, -1112, 140, 184, 30, 0, 112, [26, 16, -2]);
  g.strokeStyle = 'rgba(230,190,90,.55)'; g.lineWidth = 5; g.strokeRect(1330, -1112, 140, 184);
  // Hạ Thành: đá lát cũ sẫm màu, sứt mẻ, đất bùn lộ ra; con phố ngang và đường cái lát đá mới hơn
  floor(LOWTOWN.x, LOWTOWN.y, LOWTOWN.w, LOWTOWN.h, 40, 0.12, 64, [10, 6, -6]);
  blobs(g, r, 60, LOWTOWN.x, LOWTOWN.y, LOWTOWN.w, LOWTOWN.h, ['#4a3f2c', '#3e3526', '#54472f'], 0.35, 0.2, 14, 50);
  floor(408, -772, 1984, 138, 34, 0.03, 82, [16, 10, -4]);
  floor(1320, -900, 160, 440, 34, 0.02, 88, [18, 12, -2]);
  g.strokeStyle = 'rgba(214,178,94,.25)'; g.lineWidth = 3;
  for (const rr of [70, 110]) { g.beginPath(); g.arc(1180, -655, rr, 0, TAU); g.stroke(); }
  g.strokeStyle = 'rgba(255,214,120,.3)'; g.lineWidth = 4;
  for (const rr of [100, 180]) { g.beginPath(); g.arc(1400, -1350, rr, 0, TAU); g.stroke(); }
  const tg = g.createRadialGradient(TREE_POS.x, TREE_POS.y, 30, TREE_POS.x, TREE_POS.y, 420);
  tg.addColorStop(0, 'rgba(240,210,120,.9)'); tg.addColorStop(1, 'rgba(240,210,120,0)');
  g.fillStyle = tg; g.fillRect(1050, WY0, 700, 212);
  g.fillStyle = 'rgba(200,170,90,.9)'; g.fillRect(1340, -940, 120, 50);
  // vực tối và núi đá; dải đồi đá có bóng đổ loang ra hai bên
  for (const w of WALLS) if (w.ridge || (w.cliff && w.y < -1000)) { g.fillStyle = 'rgba(28,26,18,.3)'; g.fillRect(w.x - 14, w.y - 16, w.w + 28, w.h + 32); g.fillStyle = 'rgba(28,26,18,.25)'; g.fillRect(w.x - 6, w.y + w.h, w.w + 12, 22); }
  for (const w of WALLS) {
    if (!w.void || w.x >= MAPW) continue;
    g.fillStyle = '#16140f'; g.fillRect(w.x, w.y, w.w, w.h);
    for (let i = 0; i < w.w * w.h / 9000; i++) {
      const x = w.x + r() * w.w, y = w.y + r() * w.h, s = 20 + r() * 60;
      g.fillStyle = r() < 0.5 ? '#221e17' : '#0e0c09'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.8, y + s * 0.5); g.lineTo(x - s * 0.8, y + s * 0.5); g.closePath(); g.fill();
    }
  }
  // mép bản đồ tối lại
  const edge = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(10,9,6,.9)'); gr.addColorStop(1, 'rgba(10,9,6,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
  edge(MAPW - 140, WY0, MAPW, H, MAPW, 0, MAPW - 140, 0); edge(WX0, H - 140, MAPW, H, 0, H, 0, H - 140); edge(300, WY0, MAPW, WY0 + 60, 0, WY0, 0, WY0 + 60);
  edge(-800, -900, -660, 400, -800, 0, -660, 0); edge(-2440, -900, -2300, 400, -2300, 0, -2440, 0); edge(0, -900, 140, 400, 0, 0, 140, 0);
  return c;
}
// nền cho các khu biệt lập (Cõi Aurum, Sảnh Hearthhold, hầm ngục)
const IX0 = 10000, IH = DG_H, GS2 = 0.4;
const GROUND2 = (function buildInstanceGround() {
  const GW = W - IX0, c = makeCanvas(Math.ceil(GW * GS2), Math.ceil(IH * GS2)), g = c.getContext('2d'), r = mulberry32(99);
  g.scale(GS2, GS2); g.translate(-IX0, 0);
  g.fillStyle = '#07060b'; g.fillRect(IX0, 0, GW, IH);
  for (let i = 0; i < 700; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillStyle = r() < 0.8 ? '#fff6dc' : '#ffd98a'; g.beginPath(); g.arc(IX0 + r() * 1000, r() * 1000, 0.6 + r() * 1.6, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const rg = g.createRadialGradient(RC.x, RC.y, 20, RC.x, RC.y, RC.r + 40);
  rg.addColorStop(0, '#6b5320'); rg.addColorStop(0.85, '#3a2d12'); rg.addColorStop(1, 'rgba(20,16,8,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(RC.x, RC.y, RC.r + 40, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,220,130,.35)'; g.lineWidth = 4;
  for (const rr of [RC.r - 10, RC.r * 0.62, RC.r * 0.3]) { g.beginPath(); g.arc(RC.x, RC.y, rr, 0, TAU); g.stroke(); }
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(RC.x + Math.cos(a) * RC.r * 0.3, RC.y + Math.sin(a) * RC.r * 0.3); g.lineTo(RC.x + Math.cos(a) * (RC.r - 10), RC.y + Math.sin(a) * (RC.r - 10)); g.stroke(); }
  // Sảnh Hearthhold: sàn đá ấm, thảm đỏ, bàn tròn
  paintFloor(g, r, HUB.x, 0, HUB.w, HUB.h, 50, 0, 62, [14, 8, 0]);
  g.fillStyle = 'rgba(110,30,26,.75)'; g.fillRect(HUB.x + 440, 28, 120, HUB.h - 56); g.fillRect(HUB.x + 28, 400, HUB.w - 56, 100);
  // viền thảm vàng và hoa văn hình thoi
  g.strokeStyle = 'rgba(214,178,94,.6)'; g.lineWidth = 3;
  g.strokeRect(HUB.x + 448, 36, 104, HUB.h - 72); g.strokeRect(HUB.x + 36, 408, HUB.w - 72, 84);
  g.fillStyle = 'rgba(214,178,94,.35)';
  const diamond = (x, y, k) => { g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k, y); g.lineTo(x, y + k); g.lineTo(x - k, y); g.closePath(); g.fill(); };
  for (let y = 70; y < HUB.h - 50; y += 60) if (y < 390 || y > 510) diamond(HUB.x + 500, y, 10);
  for (let x = HUB.x + 70; x < HUB.x + HUB.w - 50; x += 60) if (x < HUB.x + 430 || x > HUB.x + 570) diamond(x, 450, 10);
  g.strokeStyle = 'rgba(214,178,94,.4)'; g.lineWidth = 3; g.beginPath(); g.arc(HUB.x + 500, 450, 110, 0, TAU); g.stroke();
  // hầm ngục: sàn đá theo chủ đề ở từng phòng, vũng nước, thảm đỏ, mạch dung nham, pha lê mọc trên sàn
  const THEME = { crypt: [52, [6, 4, 0]], crystal: [46, [0, 10, 24]], fire: [50, [18, 4, -4]], royal: [70, [18, 12, -2]] };
  for (const d of DUNGEONS) {
    const [base, tint] = THEME[d.theme], ox = d.area.x, L = d.L;
    for (const [x, y, w, h] of L.rooms) paintFloor(g, r, ox + x, y, w, h, 40, d.theme === 'crystal' ? 0.08 : 0.04, base, tint);
    for (const [x, y, rr] of L.puddles || []) { const pg = g.createRadialGradient(ox + x, y, 4, ox + x, y, rr); pg.addColorStop(0, 'rgba(40,70,90,.75)'); pg.addColorStop(1, 'rgba(40,70,90,0)'); g.fillStyle = pg; g.beginPath(); g.ellipse(ox + x, y, rr, rr * 0.7, 0, 0, TAU); g.fill(); }
    for (const [x, y, w, h] of L.carpet || []) { g.fillStyle = 'rgba(110,30,26,.75)'; g.fillRect(ox + x + 10, y, w - 20, h); g.strokeStyle = 'rgba(214,178,94,.55)'; g.lineWidth = 3; g.strokeRect(ox + x + 16, y + 4, w - 32, h - 8); }
    if (d.theme === 'crystal') for (const [x, y, w, h] of L.rooms) for (let i = 0; i < w * h / 16000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,220,255,.5)' : 'rgba(210,240,255,.6)'; const px = ox + x + r() * w, py = y + r() * h, s = 4 + r() * 8; g.beginPath(); g.moveTo(px, py - s); g.lineTo(px + s * 0.4, py); g.lineTo(px, py + s * 0.3); g.lineTo(px - s * 0.4, py); g.closePath(); g.fill(); }
    if (d.theme === 'fire') {
      for (const t of TRAPS) if (t.dg === d.id) { const tg2 = g.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.r); tg2.addColorStop(0, 'rgba(60,20,10,.9)'); tg2.addColorStop(1, 'rgba(60,20,10,0)'); g.fillStyle = tg2; g.beginPath(); g.arc(t.x, t.y, t.r, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(255,120,40,.35)'; g.lineWidth = 3;
      for (const [x, y, w, h] of L.rooms) for (let i = 0; i < w * h / 60000; i++) { let px = ox + x + r() * w, py = y + r() * h; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; g.lineTo(Math.min(ox + x + w, Math.max(ox + x, px)), Math.min(y + h, Math.max(y, py))); } g.stroke(); }
    }
    const [bx, by, bw, bh] = L.bossRoom;
    g.strokeStyle = d.theme === 'royal' ? 'rgba(255,214,120,.3)' : d.theme === 'crystal' ? 'rgba(170,220,255,.28)' : 'rgba(200,180,150,.2)'; g.lineWidth = 4;
    g.beginPath(); g.arc(ox + bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.4, 0, TAU); g.stroke();
  }
  return c;
})();

function makeCanopy(cr, golden, seed) {
  const r = mulberry32(seed), s = Math.ceil(cr * 2.7), c = makeCanvas(s, s), g = c.getContext('2d'), cx = s / 2;
  const pal = golden === 'spirit' ? ['#1c3534', '#27494a', '#34605d', '#4a7f78'] : golden === 'dead' ? ['#2f2a2b', '#3d3536', '#4b4144', '#5a4e50']
    : golden === 'lake' ? ['#1f3a3a', '#2a4d4c', '#386460', '#4d7d74'] : golden === 'coast' ? ['#2e3a22', '#3c4a2a', '#4d5c32', '#65703d']
    : golden ? ['#9a7526', '#b8912f', '#d4ab45', '#e8c761'] : ['#26331a', '#33431f', '#415227', '#50622d'];
  // tán lá nhiều thùy: bóng đổ, viền tối, rồi từng chùm lá có mặt sáng và mép tối, cuối cùng là lá lấm tấm
  const lobes = [[0, 0, cr * 0.74]];
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r() * 0.4, d = cr * (0.58 + r() * 0.12); lobes.push([Math.cos(a) * d, Math.sin(a) * d, cr * (0.34 + r() * 0.1)]); }
  const blob = (dx, dy, grow, col) => { g.fillStyle = col; g.beginPath(); for (const [x, y, rr] of lobes) { g.moveTo(cx + dx + x + rr + grow, cx + dy + y); g.arc(cx + dx + x, cx + dy + y, rr + grow, 0, TAU); } g.fill(); };
  blob(cr * 0.12, cr * 0.16, 0, 'rgba(0,0,0,.3)');
  blob(0, 0, 2.2, 'rgba(10,12,6,.85)');
  blob(0, 0, 0, pal[0]);
  for (let i = 0; i < 20; i++) {
    const a = r() * TAU, d = r() * cr * 0.62, rr = cr * (0.2 + r() * 0.2), x = cx + Math.cos(a) * d - cr * 0.05, y = cx + Math.sin(a) * d - cr * 0.07;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(x + rr * 0.18, y + rr * 0.22, rr, 0, TAU); g.fill();
    const lg = g.createRadialGradient(x - rr * 0.4, y - rr * 0.45, rr * 0.1, x, y, rr);
    lg.addColorStop(0, pal[3]); lg.addColorStop(0.55, pal[1 + ((r() * 2) | 0)]); lg.addColorStop(1, pal[0]);
    g.fillStyle = lg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  }
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * cr * 0.85, x = cx + Math.cos(a) * d, y = cx + Math.sin(a) * d;
    g.globalAlpha = 0.35 + r() * 0.35; g.fillStyle = r() < 0.7 ? pal[3] : pal[0];
    g.beginPath(); g.ellipse(x, y, 1.6 + r() * 1.6, 1 + r(), r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const hg = g.createRadialGradient(cx - cr * 0.35, cx - cr * 0.4, 0, cx - cr * 0.35, cx - cr * 0.4, cr * 1.1);
  hg.addColorStop(0, golden === 'spirit' || golden === 'lake' ? 'rgba(170,250,240,.3)' : golden === 'dead' ? 'rgba(190,170,180,.18)' : golden === true ? 'rgba(255,238,170,.5)' : 'rgba(180,200,120,.25)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.beginPath(); g.arc(cx, cx, cr, 0, TAU); g.fill();
  return c;
}
const CANOPY = { green: [], gold: [], dead: [], spirit: [], lake: [], coast: [] };
for (let i = 0; i < 4; i++) {
  CANOPY.green.push(makeCanopy(52, false, 100 + i)); CANOPY.gold.push(makeCanopy(52, true, 200 + i)); CANOPY.dead.push(makeCanopy(52, 'dead', 300 + i));
  CANOPY.spirit.push(makeCanopy(52, 'spirit', 400 + i)); CANOPY.lake.push(makeCanopy(52, 'lake', 500 + i)); CANOPY.coast.push(makeCanopy(52, 'coast', 600 + i));
}
const BIGTREE = (function () {
  const s = 820, c = makeCanvas(s, s), g = c.getContext('2d'), r = mulberry32(9), cx = s / 2;
  const glow = g.createRadialGradient(cx, cx, 30, cx, cx, cx);
  glow.addColorStop(0, 'rgba(255,220,120,.55)'); glow.addColorStop(0.55, 'rgba(240,190,80,.2)'); glow.addColorStop(1, 'rgba(240,190,80,0)');
  g.fillStyle = glow; g.fillRect(0, 0, s, s);
  const pal = ['#a77b22', '#c99a35', '#e2b64d', '#f3d57a', '#fff0b3'];
  // cành vàng tỏa ra từ thân, mỗi cành rẽ nhánh; lá mọc thành chùm ở đầu cành
  const tips = [];
  g.lineCap = 'round';
  const branch = (x, y, a, len, w, depth) => {
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len, mx = x + Math.cos(a + 0.25) * len * 0.5, my = y + Math.sin(a + 0.25) * len * 0.5;
    g.strokeStyle = 'rgba(60,40,10,.9)'; g.lineWidth = w + 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.strokeStyle = '#9a7228'; g.lineWidth = w; g.stroke();
    g.strokeStyle = 'rgba(255,230,150,.45)'; g.lineWidth = Math.max(1, w * 0.3); g.stroke();
    if (depth > 0) { branch(ex, ey, a - 0.45 - r() * 0.3, len * 0.62, w * 0.62, depth - 1); branch(ex, ey, a + 0.4 + r() * 0.3, len * 0.6, w * 0.6, depth - 1); }
    else tips.push([ex, ey]);
  };
  for (let i = 0; i < 9; i++) branch(cx, cx, i / 9 * TAU + r() * 0.3, 120 + r() * 30, 14, 2);
  const cluster = (x, y, rr) => {
    g.globalAlpha = 0.5; g.fillStyle = 'rgba(80,50,10,.5)'; g.beginPath(); g.arc(x + rr * 0.2, y + rr * 0.25, rr, 0, TAU); g.fill();
    g.globalAlpha = 0.9; const lg = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr);
    lg.addColorStop(0, pal[4]); lg.addColorStop(0.45, pal[2 + ((r() * 2) | 0)]); lg.addColorStop(1, pal[0]);
    g.fillStyle = lg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
  };
  for (let i = 0; i < 120; i++) { const a = r() * TAU, d = Math.pow(r(), 0.6) * 270; cluster(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 22 + r() * 30); }
  for (const [x, y] of tips) for (let k = 0; k < 3; k++) cluster(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40, 20 + r() * 22);
  g.globalAlpha = 1;
  for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 300; g.globalAlpha = 0.5 + r() * 0.5; g.fillStyle = r() < 0.6 ? '#fff6cc' : '#ffe08a'; g.beginPath(); g.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 1 + r() * 2, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  return c;
})();

// ───────────────────────── phóng bố cục ra kích thước thật ─────────────────────────
// mọi thứ ở thế giới chính (x < 4800 ở tọa độ thiết kế) nhân K; khu biệt lập ở phía đông giữ nguyên
function scaleWorld() {
  const done = new Set();
  const pt = o => { if (!o || done.has(o)) return; done.add(o); o.x *= K; o.y *= K; };
  const rect = o => { if (!o || done.has(o)) return; done.add(o); o.x *= K; o.y *= K; o.w *= K; o.h *= K; };
  const ell = a => { a[0] *= K; a[1] *= K; a[2] *= K; a[3] *= K; };
  [ARENA, ARENA2, THORN_R, SWAMP, FORT, ACAD, CAPITAL, LOWTOWN, FOREST, ACAD_BOSS.bossRoom, COLO.rect].forEach(rect);
  [TREE_POS, LAIR, COLO, FLAG, ...BRAZIERS, ...STATUES].forEach(pt);
  BARRIER.x *= K; BARRIER.y *= K; BARRIER.r *= K;
  POOLS.forEach(ell); LAKE.forEach(ell); ISLES.forEach(ell);
  for (const R of ROADS) for (const p of R) if (!done.has(p)) { done.add(p); p[0] *= K; p[1] *= K; }
  for (const d of DUNGEONS) { d.ex *= K; d.ey *= K; }
  for (const f of MAP_FRAGS) { pt(f); f.rects.forEach(rect); }
  for (const w of WALLS) if (w.x < 4800) rect(w);
  for (const o of [...LEVERS, ...GRACES, ...ITEMS, ...CHESTS, ...NOTES]) if (o.x < 4800) pt(o);
  for (const s of SPAWNS) if (s[1] < 4800) { s[1] *= K; s[2] *= K; }
  for (const d of DOORS) if (d.kind === 'enter') pt(d);
}

// ───────────────────────── lấp khoảng trống của thế giới rộng hơn ─────────────────────────
// thêm vài nhóm quái, vật phẩm rơi và tàn tích nhỏ có rương vào những vùng đồng trống giữa các địa danh,
// sinh bằng seed cố định nên mỗi lần chơi đều giống nhau (id ổn định cho file lưu)
const RUINS = [];
// điểm đến nhỏ: trại lính quanh đống lửa, nghĩa địa, tháp canh đổ nát, vòng đá cổ (mỗi nơi có quái canh và phần thưởng)
const POIS = [], DECO_OBJ = [];
const FILL_REGIONS = ['Đồng Cỏ Mistveil', 'Hồ Crystalmere', 'Bờ Biển Saltreach', 'Cao Nguyên Cinderreach', 'Cao Nguyên Aurelia', 'Sườn Núi Goldspire', 'Rừng Wraithwood', 'Đầm Lầy Ashmire'];
const BOSSY = new Set(['warden', 'wraith', 'selvara', 'crabking', 'admiral', 'ramking', 'graveknight', 'minerg', 'golem', 'royalchamp']);
const PACK = { wolf: 3, bat: 2, lakehound: 2, boar: 2, ghoul: 2, crab: 2, soldier: 2, toad: 2, wisp: 2, drowned: 2, garcher: 2, ram: 2 };
function openSpot(x, y, clear) {
  if (x < WX0 + 120 || x > MAPW - 120 || y < WY0 + 120 || y > H - 120) return false;
  if (isVoid(x, y) || inWater(x, y, 20) || inPool(x, y)) return false;
  for (const w of wallsNear(x, y, clear)) if (inRect(x, y, w, clear)) return false;
  for (const r of [THORN_R, ARENA2, FORT, ACAD, CAPITAL, LOWTOWN, COLO.rect]) if (inRect(x, y, r, 120)) return false;
  if (dist(x, y, LAIR.x, LAIR.y) < sk(560) || dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r + 120 || dist(x, y, TREE_POS.x, TREE_POS.y) < sk(420)) return false;
  for (const g of GRACES) if (dist(x, y, g.x, g.y) < 340) return false;
  for (const d of DOORS) if (dist(x, y, d.x, d.y) < 220) return false;
  for (const f of MAP_FRAGS) if (dist(x, y, f.x, f.y) < 200) return false;
  return true;
}
function fillWorld() {
  const r = mulberry32(31337), pool = {};
  for (const [t, x, y] of SPAWNS) {
    if (x >= INST_X || BOSSY.has(t)) continue;
    const n = regionAt(x, y);
    if (FILL_REGIONS.includes(n)) (pool[n] = pool[n] || []).push(t);
  }
  const near = (list, x, y, d) => list.some(s => dist(x, y, s[1], s[2]) < d);
  const extra = [], step = 540;
  for (let gy = WY0 + 320; gy < H - 200; gy += step) for (let gx = WX0 + 320; gx < MAPW - 200; gx += step) {
    const x = gx + (r() - 0.5) * step * 0.7, y = gy + (r() - 0.5) * step * 0.7, n = regionAt(x, y), roll = r();
    if (!pool[n] || roll < 0.18 || !openSpot(x, y, 60) || near(SPAWNS, x, y, 340) || near(extra, x, y, 380)) continue;
    const t = pool[n][(r() * pool[n].length) | 0], cnt = PACK[t] || 1;
    for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU + r(), d = cnt > 1 ? 40 + r() * 20 : 0; extra.push([t, x + Math.cos(a) * d, y + Math.sin(a) * d]); }
  }
  SPAWNS.push(...extra);
  // tàn tích nhỏ: vòng cột đổ quanh một chiếc rương, ở chỗ trống cách xa nhau
  const tier = n => (REGION_MUL[n] || 1) < 1.3 ? { items: { stone1: 2 } } : (REGION_MUL[n] || 1) < 1.6 ? { items: { stone2: 1, stone1: 1 } } : { items: { stone2: 2, stone3: 1 } };
  for (let i = 0, tries = 0; RUINS.length < 12 && tries < 4000; tries++) {
    const x = WX0 + r() * (MAPW - WX0), y = WY0 + r() * (H - WY0), n = regionAt(x, y);
    if (!FILL_REGIONS.includes(n) || !openSpot(x, y, 160) || nearRoad(x, y) < 180 || RUINS.some(q => dist(x, y, q.x, q.y) < 1300)) continue;
    if (near(SPAWNS, x, y, 150) || CHESTS.some(c => dist(x, y, c.x, c.y) < 500)) continue;
    const id = 'c_ruin' + (i++), mul = REGION_MUL[n] || 1;
    RUINS.push({ x, y, n });
    CHESTS.push({ id, x, y, loot: Object.assign({ runes: Math.round(200 * mul * mul / 50) * 50 }, tier(n)) });
  }
  // vật phẩm lấp lánh rải trên đường đi
  for (let i = 0, tries = 0; i < 18 && tries < 4000; tries++) {
    const x = WX0 + r() * (MAPW - WX0), y = WY0 + r() * (H - WY0), n = regionAt(x, y);
    if (!FILL_REGIONS.includes(n) || !openSpot(x, y, 50) || ITEMS.some(it => dist(x, y, it.x, it.y) < 700) || CHESTS.some(c => dist(x, y, c.x, c.y) < 200)) continue;
    const mul = REGION_MUL[n] || 1, pick = r();
    ITEMS.push({ id: 'x' + (i++), x, y, loot: pick < 0.35 ? { runes: Math.round(150 * mul * mul / 50) * 50 } : pick < 0.7 ? tier(n) : { items: pick < 0.85 ? { cure: 2 } : { firepot: 2 } } });
  }
  fillPois(r, tier);
}
function fillPois(r, tier) {
  const want = [['camp', 7], ['grave', 5], ['tower', 5], ['stones', 4]], cnt = {};
  const dry = (x, y) => !isVoid(x, y) && !inWater(x, y, 16) && !inPool(x, y) && !wallsNear(x, y, 40).some(w => inRect(x, y, w, 30));
  const far = (x, y) => !RUINS.some(q => dist(x, y, q.x, q.y) < 700) && !POIS.some(q => dist(x, y, q.x, q.y) < 900);
  for (const [type, n0] of want) for (let tries = 0; (cnt[type] || 0) < n0 && tries < 9000; tries++) {
    const x = WX0 + r() * (MAPW - WX0), y = WY0 + r() * (H - WY0), n = regionAt(x, y);
    if (!FILL_REGIONS.includes(n) || POIS.filter(q => q.n === n).length >= 3 || !openSpot(x, y, 200) || nearRoad(x, y) < 220 || !far(x, y)) continue;
    if (SPAWNS.some(s => dist(x, y, s[1], s[2]) < 240) || CHESTS.some(c => dist(x, y, c.x, c.y) < 400) || ITEMS.some(it => dist(x, y, it.x, it.y) < 300)) continue;
    let ok = true; for (let a = 0; a < TAU && ok; a += TAU / 8) ok = dry(x + Math.cos(a) * 150, y + Math.sin(a) * 150);
    if (!ok) continue;
    const k = cnt[type] = (cnt[type] || 0) + 1, mul = REGION_MUL[n] || 1, lv = mul < 1.3 ? 0 : mul < 1.6 ? 1 : 2, a0 = r() * TAU;
    const q = { type, x, y, n, a0, deco: [] }, add = (d, dx, dy, rr, extra) => { if (dry(x + dx, y + dy)) q.deco.push(Object.assign({ d, x: x + dx, y: y + dy, r: rr, seed: (r() * 1024) | 0 }, extra)); };
    const guard = (t, d, a) => SPAWNS.push([t, x + Math.cos(a) * d, y + Math.sin(a) * d]);
    const runes = Math.round(250 * mul * mul / 50) * 50;
    if (type === 'camp') {
      add('campfire', 0, 0, 14);
      for (let i = 0; i < 3; i++) { const a = a0 + i * TAU / 3; add('tent', Math.cos(a) * 120, Math.sin(a) * 120, 30, { rot: a + Math.PI }); }
      for (let i = 0; i < 3; i++) { const a = a0 + (i + 0.5) * TAU / 3; add('crate', Math.cos(a) * 150, Math.sin(a) * 150, 14); }
      [['soldier', 'soldier', 'archer'], ['soldier', 'shield', 'archer'], ['royal', 'garcher', 'knight']][lv].forEach((t, i) => guard(t, 62, a0 + (i + 0.5) * TAU / 3));
      const a = a0 + TAU / 6; CHESTS.push({ id: 'c_camp' + k, x: x + Math.cos(a) * 190, y: y + Math.sin(a) * 190, loot: Object.assign({ runes }, tier(n)) });
    } else if (type === 'grave') {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) if (r() < 0.85) add('tomb', (col - 1.5) * 62 + (r() - 0.5) * 12, (row - 1) * 70 + (r() - 0.5) * 10, 14, { broken: r() < 0.3 });
      ['skeleton', 'skeleton', lv ? 'ghoul' : 'skeleton'].forEach((t, i) => guard(t, 90 + i * 20, a0 + i * 2.1));
      ITEMS.push({ id: 'xg' + k, x: x + 124, y: y + 4, loot: lv ? { items: { somber1: 1 }, runes } : { items: { cure: 2, stone1: 2 } } });
    } else if (type === 'tower') {
      add('tower', 0, 0, 66);
      for (let i = 0; i < 5; i++) { const a = a0 + 1.2 + i * 0.35, d = 84 + r() * 30; add('rubble', Math.cos(a) * d, Math.sin(a) * d, 10 + r() * 8); }
      [['archer', 'archer', 'soldier'], ['archer', 'bomber', 'shield'], ['garcher', 'garcher', 'knight']][lv].forEach((t, i) => guard(t, 96, a0 - 0.8 + i * 1.3));
      const a = a0 + Math.PI; CHESTS.push({ id: 'c_tower' + k, x: x + Math.cos(a) * 100, y: y + Math.sin(a) * 100, loot: Object.assign({ runes: runes * 2 }, tier(n)) });
    } else {
      for (let i = 0; i < 7; i++) { const a = a0 + i * TAU / 7; add('menhir', Math.cos(a) * 118, Math.sin(a) * 96, 13, { rot: a }); }
      (lv ? ['wisp', 'wisp'] : ['ghost']).forEach((t, i) => guard(t, 160, a0 + 0.4 + i * 2.6));
      ITEMS.push({ id: 'xs' + k, x, y, loot: { runes: runes * 2, items: lv > 1 ? { stone3: 1 } : lv ? { stone2: 2 } : { stone1: 3 } } });
    }
    POIS.push(q);
  }
}
// Ân Điển là chốn an toàn: đẩy quái thường ra xa (ngoài thế giới 480, trong hầm ngục 380); không chỗ đứng thì bỏ hẳn
const GRACE_CLEAR = 480, GRACE_CLEAR_DG = 380;
const SWIMMERS = new Set(['crab', 'jelly', 'lakehound', 'drowned', 'crabking', 'bat', 'eagle', 'wisp']);
function clearGraces() {
  const keep = [];
  const standable = (t, x, y, A) => {
    if (A) { if (x < A.x + 60 || x > A.x + A.w - 60 || y < A.y + 60 || y > A.y + A.h - 60) return false; }
    else if (x < WX0 + 80 || x > MAPW - 80 || y < WY0 + 80 || y > H - 80 || isVoid(x, y) || (!SWIMMERS.has(t) && (inWater(x, y, 10) || inPool(x, y)))) return false;
    for (const w of wallsNear(x, y, 40)) if (inRect(x, y, w, 30)) return false;
    return true;
  };
  for (const s of SPAWNS) {
    const [t] = s;
    if (BOSSY.has(t)) { keep.push(s); continue; }
    const A = s[1] >= INST_X ? AREAS.find(a => s[1] >= a.x && s[1] <= a.x + a.w) : null, R = A ? GRACE_CLEAR_DG : GRACE_CLEAR;
    const g = GRACES.find(q => (q.x >= INST_X) === !!A && dist(q.x, q.y, s[1], s[2]) < R);
    if (!g) { keep.push(s); continue; }
    const a0 = Math.atan2(s[2] - g.y, s[1] - g.x) || 0.7;
    let ok = false;
    for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, Math.PI]) {
      const x = g.x + Math.cos(a0 + da) * (R + 20), y = g.y + Math.sin(a0 + da) * (R + 20);
      if (standable(t, x, y, A) && !GRACES.some(q => dist(q.x, q.y, x, y) < R)) { s[1] = x; s[2] = y; ok = true; break; }
    }
    if (ok) keep.push(s);
  }
  SPAWNS.length = 0; SPAWNS.push(...keep);
}
// nền đá lát và cột đổ của tàn tích nhỏ, vẽ thẳng lên nền đất đã dựng
function paintRuins() {
  const g = GROUND.getContext('2d'), r = mulberry32(555);
  g.setTransform(GS, 0, 0, GS, -WX0 * GS, -WY0 * GS);
  for (const q of RUINS) {
    const rg = g.createRadialGradient(q.x, q.y, 20, q.x, q.y, 170);
    rg.addColorStop(0, 'rgba(40,36,28,.5)'); rg.addColorStop(1, 'rgba(40,36,28,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(q.x, q.y, 170, 0, TAU); g.fill();
    paintFloor(g, r, q.x - 110, q.y - 90, 220, 180, 44, 0.35, 66);
  }
  for (const q of POIS) {
    const patch = (rad, col, a) => { const rg = g.createRadialGradient(q.x, q.y, rad * 0.3, q.x, q.y, rad); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.beginPath(); g.arc(q.x, q.y, rad, 0, TAU); g.fill(); };
    if (q.type === 'camp') {
      // đất bị giẫm trơ, vệt tro quanh đống lửa
      patch(220, '74,58,38', 0.75);
      blobs(g, r, 18, q.x - 160, q.y - 160, 320, 320, ['#5a4630', '#4a3a28', '#63503a'], 0.25, 0.25, 12, 40);
      patch(46, '30,26,22', 0.8);
    } else if (q.type === 'grave') {
      // đất nghĩa địa sẫm, hàng rào gỗ thấp quanh các mộ
      g.fillStyle = 'rgba(38,34,28,.6)'; g.fillRect(q.x - 150, q.y - 125, 300, 250);
      blobs(g, r, 14, q.x - 140, q.y - 115, 280, 230, ['#2c2a22', '#34302a', '#3a3a2a'], 0.3, 0.3, 10, 30);
      g.strokeStyle = 'rgba(92,70,44,.9)'; g.lineWidth = 3; g.setLineDash([16, 10]); g.strokeRect(q.x - 150, q.y - 125, 300, 250); g.setLineDash([]);
      g.fillStyle = '#5c462c'; for (let t = 0; t < 4; t++) for (let k = 0; k <= 10; k++) { const u = k / 10, px = t < 2 ? q.x - 150 + u * 300 : q.x + (t === 2 ? -150 : 150), py = t < 2 ? q.y + (t ? 125 : -125) : q.y - 125 + u * 250; g.fillRect(px - 3, py - 3, 6, 6); }
    } else if (q.type === 'tower') {
      patch(190, '58,54,46', 0.6);
      paintFloor(g, r, q.x - 70, q.y - 70, 140, 140, 28, 0.4, 60);
    } else {
      // vòng đá cổ: cỏ nhạt thành vòng, rãnh khắc phát sáng mờ
      patch(170, '120,130,90', 0.35);
      g.strokeStyle = 'rgba(170,210,255,.28)'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(q.x, q.y, 70, 56, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 7; i++) { const a = q.a0 + i * TAU / 7; g.beginPath(); g.moveTo(q.x + Math.cos(a) * 30, q.y + Math.sin(a) * 24); g.lineTo(q.x + Math.cos(a) * 70, q.y + Math.sin(a) * 56); g.stroke(); }
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function ruinPillars(addPillar) {
  for (const q of RUINS) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, d = 118 + (i % 2) * 14; addPillar(q.x + Math.cos(a) * d, q.y + Math.sin(a) * d * 0.8, 14 + (i % 3) * 2); }
}

// ───────────────────────── trình tự dựng thế giới ─────────────────────────
const GROUND = buildGround();   // vẽ ở tọa độ thiết kế
scaleWorld();                   // rồi mới phóng dữ liệu ra tọa độ thật
indexWalls();
fillWorld();
clearGraces();
genObstacles();
paintRuins();
