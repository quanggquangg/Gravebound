'use strict';
// Gravebound — Phát triển nhân vật: túi đồ, nhận vật phẩm, lên cấp, cường hóa, cửa hàng, trang bị
// ───────────────────────── túi đồ và nhận vật phẩm ─────────────────────────
function invAdd(id, n = 1) {
  const max = (ITEMDEF[id] && ITEMDEF[id].max) || 999;
  S.inv[id] = Math.min(max, (S.inv[id] || 0) + n);
}
const invN = id => S.inv[id] || 0;
const weaponHint = Wp => (Wp.hand === 'off' ? ' · trang bị tay trái tại Ân Điển' : G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí');
// nhận một gói phần thưởng: rune, vật phẩm, vũ khí, giáp, bùa, phép, tro chiến tranh, hạt vàng, Đại Ấn...
// đồ mới nhận được mang dấu MỚI trong hành trang cho tới khi ngươi xem qua tab chứa nó
const NEW_TAB = { w: 'gear', a: 'gear', t: 'gear', x: 'gear', s: 'spell', p: 'inv' };
function markNew(list, id) {
  const k = list === S.weapons ? 'w' : list === S.armors ? 'a' : list === S.tals ? 't' : list === S.ashes ? 'x' : list === S.spells ? 's' : list === S.spirits ? 'p' : null;
  if (!k) return;
  S.newGear = S.newGear || [];
  if (!S.newGear.includes(k + ':' + id)) S.newGear.push(k + ':' + id);
}
const isNew = (k, id) => !!(S.newGear && S.newGear.includes(k + ':' + id));
const tabHasNew = tab => (S.newGear || []).some(key => NEW_TAB[key[0]] === tab);
function seenTab(tab) { if (S.newGear && S.newGear.length) S.newGear = S.newGear.filter(key => NEW_TAB[key[0]] !== tab); }
function grant(L, x = P.x, y = P.y, quiet = false) {
  const got = [], fd = [];
  let big = null;
  if (L.runes) { gainRunes(L.runes, x, y); got.push('+' + L.runes.toLocaleString(numLoc()) + ' rune'); }
  for (const [id, n] of Object.entries(L.items || {})) {
    if (id === 'arrows') { S.arrows = Math.min(S.arrowMax, S.arrows + n); got.push(n + ' mũi tên'); continue; }
    invAdd(id, n); got.push(ITEMDEF[id].name + (n > 1 ? ' ×' + n : '')); fd.push([ITEMDEF[id].name + (n > 1 ? ' ×' + n : ''), 'i', id]);
    if (ITEMDEF[id].kind === 'key') big = [ITEMDEF[id].name, ITEMDEF[id].desc];
  }
  const own = (list, id, def, tail) => {
    if (list.includes(id)) { gainRunes(500, x, y); got.push('+500 rune (đã có ' + def.name + ')'); return; }
    list.push(id); got.push(def.name); big = [def.name, def.desc + tail];
    markNew(list, id);
  };
  if (L.weapon) own(S.weapons, L.weapon, WEAPONS[L.weapon], weaponHint(WEAPONS[L.weapon]));
  if (L.armor) own(S.armors, L.armor, ARMORS[L.armor], ' · mặc tại Ân Điển');
  if (L.tal) own(S.tals, L.tal, TALISMANS[L.tal], ' · đeo tại Ân Điển');
  if (L.ash) own(S.ashes, L.ash, ASHES[L.ash], ' · gắn vào vũ khí tại Ân Điển');
  if (L.spirit) { S.spirits = S.spirits || []; own(S.spirits, L.spirit, SPIRITS[L.spirit], S.bell ? ' · chọn trong Túi đồ, rung Chuông Gọi Hồn khi đánh boss' : ' · cần Chuông Gọi Hồn để dùng'); if (!S.spiritSel) S.spiritSel = L.spirit; }
  if (L.spell) {
    const had = S.spells.includes(L.spell);
    own(S.spells, L.spell, SPELLS[L.spell], ' · ghi nhớ tại Ân Điển');
    if (!had && S.att.length < S.slots) S.att.push(L.spell);
  }
  if (L.seed) {
    if (S.flaskMax < FLASK_CAP) { S.flaskMax++; P.flasks++; got.push('Hạt Vàng · bình tăng lên ' + S.flaskMax); }
    else { gainRunes(300, x, y); got.push('Hạt Vàng · bình đã tối đa, đổi thành 300 rune'); }
  }
  if (L.tear) {
    if (S.tears < TEAR_CAP) { S.tears++; got.push('Nước Mắt Thánh · bình hồi nhiều hơn (' + S.tears + '/' + TEAR_CAP + ')'); }
    else { gainRunes(500, x, y); got.push('+500 rune'); }
  }
  if (L.mem) { if (S.slots < SLOT_CAP) { S.slots++; got.push('Đá Ký Ức · ' + S.slots + ' ô phép'); } else { gainRunes(800, x, y); got.push('+800 rune'); } }
  if (L.pouch) { if (S.talSlots < TAL_CAP) { S.talSlots++; got.push('Túi Bùa · ' + S.talSlots + ' ô bùa'); } else { gainRunes(800, x, y); got.push('+800 rune'); } }
  if (L.quiver) { S.arrowMax += 20; S.arrows += 20; got.push('Ống Tên Lớn · mang tối đa ' + S.arrowMax + ' mũi tên'); }
  if (L.gr && !S.gr.includes(L.gr)) {
    S.gr.push(L.gr); applyStats(false);
    const R = GREAT_RUNES[L.gr];
    if (!quiet) {
      banner('grace', 'ĐẠI ẤN · ' + R.name, R.desc + ' · ' + S.gr.length + '/3', 5);
      if (S.gr.length === 3) later(5.2, () => subtitle('Ba Đại Ấn cộng hưởng trong lồng ngực ngươi. Cổng Kinh Thành Aurumhold đang chờ ở phương bắc.', 5));
      if (got.length) later(5.4, () => banner('item', big ? big[0] : 'Nhận được', got.join(' · '), 4));
    }
    save();
    return got;
  }
  if (!quiet && got.length) {
    // đồ vặt (nguyên liệu, đồ dùng, rune) hiện thành dòng nhỏ bên phải; bảng giữa màn hình để dành cho đồ quan trọng
    if (!big) { if (fd.length) fd.forEach(f => feedPush(...f)); else got.forEach(g => feedPush(g)); SFX.pickup(); save(); return got; }
    if (big && got.length === 1) banner('item', big[0], big[1], 4.2);
    else banner('item', big ? big[0] : 'Nhận được', got.join(' · '), 4);
    SFX.pickup();
  }
  save();
  return got;
}

// ───────────────────────── lên cấp ─────────────────────────
function levelUp(stat) {
  const cost = levelCost();
  if (S.runes < cost || S.stats[stat] >= 99) return false;
  S.runes -= cost; S.level++; S.stats[stat]++;
  applyStats(true); save(); SFX.levelup();
  return true;
}

// ───────────────────────── cường hóa ở lò rèn ─────────────────────────
const upgradable = id => { const Wp = WEAPONS[id]; return Wp && Wp.type !== 'shield'; };
function upgradeNeed(id) {
  const next = upLv(id) + 1, Wp = WEAPONS[id];
  if (!upgradable(id) || next > maxUp(id)) return null;
  if (Wp.somber) return { lv: next, mat: next <= 2 ? 'somber1' : 'somber2', n: 1, runes: 400 * next };
  return { lv: next, mat: next <= 3 ? 'stone1' : next <= 6 ? 'stone2' : 'stone3', n: ((next - 1) % 3) + 1, runes: 150 * next };
}
function doUpgrade(id) {
  const need = upgradeNeed(id);
  if (!need || invN(need.mat) < need.n || S.runes < need.runes) return false;
  S.inv[need.mat] -= need.n; if (!S.inv[need.mat]) delete S.inv[need.mat];
  S.runes -= need.runes; S.wup[id] = need.lv;
  SFX.boom(); save();
  return true;
}

// ───────────────────────── cửa hàng ─────────────────────────
function shopRow(r) {
  let name, desc, sold = false;
  if (r.item) { name = ITEMDEF[r.item].name; desc = ITEMDEF[r.item].desc + ' · đang có ' + invN(r.item); }
  else if (r.weapon) { const Wp = WEAPONS[r.weapon]; name = Wp.name; desc = Wp.desc; sold = S.weapons.includes(r.weapon); }
  else if (r.armor) { name = ARMORS[r.armor].name; desc = ARMORS[r.armor].desc; sold = S.armors.includes(r.armor); }
  else if (r.tal) { name = TALISMANS[r.tal].name; desc = TALISMANS[r.tal].desc; sold = S.tals.includes(r.tal); }
  else if (r.spell) { const sp = SPELLS[r.spell]; name = sp.name; desc = sp.desc + ' · ' + sp.fp + ' FP · cần ' + Object.entries(sp.req).map(([k, v]) => STAT_NAME[k] + ' ' + v).join(', '); sold = S.spells.includes(r.spell); }
  else { name = r.name; desc = r.desc; sold = S.bought.includes(r.id); }
  const locked = r.req && !r.req();
  return { name, desc, sold, locked, price: r.price };
}
function buyRow(npc, i) {
  const r = SHOPS[npc].stock[i], info = shopRow(r);
  if (info.sold || info.locked || S.runes < r.price) return false;
  S.runes -= r.price;
  if (r.id) S.bought.push(r.id);
  const L = {};
  if (r.item) L.items = { [r.item]: 1 };
  for (const k of ['weapon', 'armor', 'tal', 'spell', 'quiver', 'mem']) if (r[k]) L[k] = r[k];
  grant(L, P.x, P.y, true);
  SFX.pickup(); toast('Đã mua ' + info.name);
  return true;
}

// ───────────────────────── tái sinh (tẩy điểm) ─────────────────────────
// như Rennala trong Elden Ring: chỉ số về như lúc mới chọn xuất thân, rune đã dùng để lên cấp được trả lại để phân bổ lại.
// Lần đầu miễn phí, các lần sau cần một Nước Mắt Ấu Trùng.
// xuất thân của bản lưu: bản lưu cũ (trước khi đổi sang mười xuất thân kiểu Elden Ring) giữ chỉ số gốc cũ và cấp 1
const LEGACY_CLS = { knight: { vig: 12, mnd: 8, end: 11, str: 13, dex: 10, int: 8, fai: 8 }, samurai: { vig: 11, mnd: 8, end: 11, str: 9, dex: 15, int: 8, fai: 8 },
  mage: { vig: 9, mnd: 13, end: 9, str: 8, dex: 9, int: 15, fai: 7 }, cleric: { vig: 10, mnd: 13, end: 9, str: 10, dex: 8, int: 7, fai: 13 }, hunter: { vig: 11, mnd: 9, end: 12, str: 9, dex: 13, int: 8, fai: 8 } };
function clsBase() {
  const C = CLASSES.find(c => c.id === S.cls) || CLASSES[0];
  if (S.clsV !== 2 && LEGACY_CLS[S.cls]) return { stats: LEGACY_CLS[S.cls], lv: 1 };
  return { stats: C.stats, lv: C.lv };
}
const clsBaseLv = () => clsBase().lv;
function respecRefund() {
  const L0 = S.level; let n = 0;
  for (let l = clsBaseLv(); l < L0; l++) { S.level = l; n += levelCost(); }
  S.level = L0;
  return n;
}
const respecFree = () => !S.respecs;
function doRespec() {
  if (S.level <= clsBaseLv()) { toast('Chưa lên cấp lần nào, không cần tái sinh'); return false; }
  if (!respecFree() && invN('larval') < 1) { toast('Cần một Nước Mắt Ấu Trùng'); return false; }
  if (!respecFree()) { S.inv.larval--; if (!S.inv.larval) delete S.inv.larval; }
  const C = clsBase(), refund = respecRefund();
  S.stats = Object.assign({}, C.stats); S.level = C.lv; S.runes += refund; S.respecs = (S.respecs || 0) + 1;
  applyStats(true); save(); SFX.grace();
  burst(P.x, P.y, 40, '#bfe4ff', 140, 3, 'mote', 1.2);
  banner('grace', 'TÁI SINH', 'Nhận lại ' + refund.toLocaleString(numLoc()) + ' rune · lên cấp lại ở Ân Điển', 4);
  return true;
}

// ───────────────────────── trang bị ở Ân Điển ─────────────────────────
function setArmor(id) { if (S.armors.includes(id)) { S.armor = id; applyStats(false); save(); SFX.glint(); } }
function toggleTal(id) {
  if (!S.tals.includes(id)) return;
  if (S.tal.includes(id)) S.tal = S.tal.filter(t => t !== id);
  else if (S.tal.length < S.talSlots) S.tal.push(id);
  else { toast('Hết ô bùa (' + S.talSlots + ')'); return; }
  applyStats(false); save(); SFX.glint();
}
function toggleAttune(id) {
  if (!S.spells.includes(id)) return;
  if (S.att.includes(id)) S.att = S.att.filter(t => t !== id);
  else if (S.att.length < S.slots) S.att.push(id);
  else { toast('Hết ô phép (' + S.slots + ')'); return; }
  S.spellIdx = 0; save(); SFX.glint();
}
function setAsh(id) {
  const Wp = WEAPONS[S.equipped];
  if (Wp.unique || Wp.type !== 'melee') return;
  if (id === Wp.ash) delete S.ash[S.equipped]; else if (S.ashes.includes(id)) S.ash[S.equipped] = id;
  save(); SFX.glint();
}
function flaskAlloc(d) {
  S.flaskFp = clamp(S.flaskFp + d, 0, S.flaskMax);
  applyStats(true); save(); SFX.glint();
}
function applyClass(id) {
  const c = CLASSES.find(q => q.id === id) || CLASSES[0];
  S.cls = c.id; S.clsV = 2; S.stats = Object.assign({}, c.stats); S.level = c.lv; S.twoH = false;
  S.weapons = [...new Set([...c.weapons, 'shield', c.off])];
  S.equipped = c.equipped; S.off = c.off; S.armor = c.armor; S.armors = [...new Set(['rags', c.armor])];
  S.spells = [...c.spells]; S.att = [...c.spells]; S.flaskFp = c.flaskFp;
  if (c.id === 'samurai') S.ashes = [...new Set([...(S.ashes || []), 'deflect'])];
  S.arrows = S.arrowMax;
}
