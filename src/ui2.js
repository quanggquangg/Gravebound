'use strict';
// Gravebound — Giao diện hành trang kiểu souls: ô trang bị có biểu tượng, lưới vật phẩm gọn,
// bảng chi tiết bên phải hiện khi rê chuột / chọn (so sánh với món đang dùng), màn chọn xuất thân,
// bảng hướng dẫn điều khiển, nhật ký gợi ý, chú thích khi rê chuột lên HUD và dòng nhặt đồ bên phải.

// ───────────────────────── biểu tượng: vẽ bằng canvas rồi dùng lại như ảnh ─────────────────────────
const ICON_CACHE = new Map();
const TAL_COL = ['#c83a3a', '#3a78c8', '#3aa860', '#d8a83a', '#9a5ac8', '#c86a3a', '#3ab8b0', '#e0e0e0'];
const hashCol = (id, pal) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return pal[h % pal.length]; };
const ARMOR_COL = { rags: ['#6a5e4a', '#8a7a5a'], squire: ['#5a5448', '#8a8474'], samurai: ['#4a3a34', '#a0523a'], robe: ['#2f3a5a', '#6f86c9'], priest: ['#cfc2a0', '#b8952f'],
  leather: ['#5a4a34', '#7a6a4a'], knightset: ['#3b3c43', '#b08d4c'], crystalset: ['#7aa0c0', '#d8f0ff'], royalset: ['#8a7440', '#f0d27a'] };
function drawIconInto(kind, id, s) {
  const c = s / 2;
  if (kind === 'w') {
    const Wp = WEAPONS[id];
    if (Wp.hand === 'off' || Wp.type === 'shield' || Wp.type === 'staff' || Wp.type === 'seal') drawOffIcon(Object.assign({ id }, Wp), c, c, s * 0.62);
    else drawWeaponIcon(id, c, c, s * 0.78);
  } else if (kind === 'a') {
    const [b, t] = ARMOR_COL[id] || ['#5a5448', '#8a8474'];
    ctx.save(); ctx.translate(c, c); ctx.scale(s / 48, s / 48); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,6,4,.9)'; ctx.lineWidth = 1.6;
    const g = ctx.createLinearGradient(-14, -14, 14, 16); g.addColorStop(0, tint(b, 1.4)); g.addColorStop(1, tint(b, 0.7));
    ctx.fillStyle = g; iconPath([[-15, -11], [-7, -15], [-4, -12], [4, -12], [7, -15], [15, -11], [12, -2], [10, 16], [-10, 16], [-12, -2]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = t; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 15); ctx.moveTo(-9, 4); ctx.lineTo(9, 4); ctx.stroke();
    ctx.fillStyle = t; for (const x of [-12, 12]) { ctx.beginPath(); ctx.arc(x, -11, 3.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  } else if (kind === 't') {
    const col = hashCol(id, TAL_COL);
    ctx.save(); ctx.translate(c, c); ctx.scale(s / 48, s / 48);
    ctx.strokeStyle = '#b08d4c'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -8, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = '#c9a44e'; ctx.strokeStyle = 'rgba(8,6,4,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 4, 11, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.shadowColor = col; ctx.shadowBlur = 8; const g = ctx.createRadialGradient(-2, 2, 1, 0, 4, 8); g.addColorStop(0, '#fff'); g.addColorStop(0.3, col); g.addColorStop(1, tint(col, 0.5));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 4, 7, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
  } else if (kind === 's') {
    const sp = SPELLS[id], col = sp.school === 'sorc' ? '#8fc0ff' : '#ffd76a';
    ctx.save(); ctx.translate(c, c); ctx.scale(s / 48, s / 48);
    ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
  } else if (kind === 'x') {
    ctx.save(); ctx.translate(c, c); ctx.scale(s / 48, s / 48); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#2a2418'; ctx.strokeStyle = '#d6b25e'; ctx.lineWidth = 1.6; ctx.fillRect(-11, -11, 22, 22); ctx.strokeRect(-11, -11, 22, 22);
    ctx.rotate(-Math.PI / 4); ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0.3, 5.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(3, -6); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
  } else if (kind === 'p') {
    ctx.save(); ctx.translate(c, c); ctx.scale(s / 48, s / 48);
    ctx.shadowColor = '#9fc0ff'; ctx.shadowBlur = 12; const g = ctx.createRadialGradient(0, -4, 1, 0, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#a8c8ff'); g.addColorStop(1, 'rgba(120,150,230,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -15); ctx.bezierCurveTo(12, -12, 11, 6, 6, 14); ctx.quadraticCurveTo(0, 9, -6, 14); ctx.bezierCurveTo(-11, 6, -12, -12, 0, -15); ctx.fill();
    ctx.fillStyle = '#1a2440'; ctx.beginPath(); ctx.arc(-3.5, -4, 1.8, 0, TAU); ctx.arc(3.5, -4, 1.8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
  } else drawQuickIcon(id, c, c);
}
function iconURL(kind, id, s = 48) {
  const key = kind + ':' + id + ':' + s;
  if (ICON_CACHE.has(key)) return ICON_CACHE.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = s * 2;
  const g = cv.getContext('2d'), old = ctx;
  ctx = g; g.scale(2, 2);
  try { drawIconInto(kind, id, s); } catch (e) { /* biểu tượng lỗi thì để trống */ }
  ctx = old;
  const url = cv.toDataURL(); ICON_CACHE.set(key, url); return url;
}
const img = (kind, id, s = 48) => `<img alt="" src="${iconURL(kind, id, s)}" width="${s}" height="${s}">`;

// ───────────────────────── thẻ chi tiết ─────────────────────────
const WTYPE = { sword: 'Kiếm', greatsword: 'Đại kiếm', katana: 'Katana', dagger: 'Dao găm', spear: 'Giáo', axe: 'Rìu', club: 'Chùy', scythe: 'Lưỡi hái', bow: 'Cung', staff: 'Gậy phép', seal: 'Ấn thánh' };
function row(k, v, cmp) { return `<dt>${k}</dt><dd>${v}${cmp || ''}</dd>`; }
function delta(a, b, fmt = x => x) { const d = Math.round(a - b); return d ? ` <span class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${fmt(Math.abs(d))}</span>` : ''; }
function weaponCard(id) {
  const Wp = WEAPONS[id], lv = upLv(id), off = Wp.hand === 'off' || Wp.type === 'shield' || Wp.type === 'staff' || Wp.type === 'seal' || (invSlot === 'left' && Wp.type === 'melee');
  const cur = off ? S.off : S.equipped, cmp = cur && cur !== id && WEAPONS[cur];
  let dl = '';
  if (Wp.type === 'shield') { dl += row('Chặn', Math.round((1 - 0.15 * Wp.guard.chip) * 100) + '%'); }
  else if (Wp.sp) { const p = spellPower(id); dl += row('Sức mạnh phép', Math.round(p), cmp && WEAPONS[cur].sp ? delta(p, spellPower(cur)) : ''); dl += row('Hệ số', scText(Wp)); }
  else {
    const ar = weaponAR(id, lv, off ? false : undefined); dl += row('Công', Math.round(ar), cmp && !WEAPONS[cur].sp && WEAPONS[cur].type !== 'shield' ? delta(ar, weaponAR(cur, upLv(cur), off ? false : undefined)) : '');
    if (Wp.cls) dl += row('Loại', WCLS_NAME[Wp.cls] || Wp.cls);
    if (canGrip2(id)) dl += row('Cầm hai tay', 'Công ' + Math.round(weaponAR(id, lv, true)) + ' · Sức ×1.5');
    dl += row('Loại sát thương', DT_NAME[Wp.dt]); dl += row('Hệ số', scText(Wp));
    if (Wp.ash && ASHES[Wp.ash]) dl += row('Kỹ năng', ASHES[Wp.ash].name);
  }
  if (Wp.req) dl += row('Yêu cầu', reqText(Wp.req));
  dl += row('Cân nặng', Wp.wt, cmp ? delta(Wp.wt, WEAPONS[cur].wt, x => x) .replace('up', 'tmp').replace('dn', 'up').replace('tmp', 'dn') : '');
  if (Wp.twoHanded) dl += row('Cầm', 'Hai tay');
  if (Wp.paired) dl += row('Cầm', 'Vũ khí đôi · luôn song kiếm');
  // ghép đôi: món này với vũ khí ở tay bên kia có vào được tư thế song kiếm không
  const other = WEAPONS[off ? S.equipped : S.off];
  if (Wp.type === 'melee' && canGrip2(id) && other && other.type === 'melee' && other.id !== id) dl += row('Song kiếm', other.cls === Wp.cls ? '<span class="up">Được, cùng loại với ' + esc(other.name) + '</span>' : 'Không, khác loại với ' + esc(other.name));
  const ty = (Wp.cls && WCLS_NAME[Wp.cls]) || WTYPE[(Wp.look && Wp.look.weapon) || Wp.type] || (Wp.type === 'shield' ? 'Khiên' : 'Vũ khí');
  return card('w', id, Wp.name + (lv ? ' +' + lv : ''), ty + (off ? ' · tay trái' : ' · tay phải'), Wp.desc + (reqMet(Wp.req, off ? S.stats : wStats(id)) ? '' : ' · <span class="dn">Thiếu chỉ số: đòn yếu đi rất nhiều</span>'), dl);
}
function card(kind, id, name, ty, desc, dl = '', acts = '') {
  return `<div class="dh">${img(kind, id, 64)}<div><h4>${esc(name)}</h4><div class="ty">${ty}</div></div></div>${desc ? `<p>${desc}</p>` : ''}${dl ? `<dl>${dl}</dl>` : ''}${acts ? `<div class="acts">${acts}</div>` : ''}`;
}
function armorCard(a) { const A = ARMORS[a], C = ARMORS[S.armor], cmp = a !== S.armor; return card('a', a, A.name, 'Giáp', A.desc, row('Giảm sát thương', Math.round(A.abs * 100) + '%', cmp ? delta(A.abs * 100, C.abs * 100) : '') + row('Trụ vững', A.poise, cmp ? delta(A.poise, C.poise) : '') + row('Cân nặng', A.wt) + row('Tải sau khi mặc', (equipLoad() - C.wt + A.wt).toFixed(1) + ' / ' + maxLoad().toFixed(1))); }
function talCard(t) { return card('t', t, TALISMANS[t].name, 'Bùa hộ mệnh' + (S.tal.includes(t) ? ' · đang đeo' : ''), TALISMANS[t].desc); }
function ashCard(a) { const A = ASHES[a]; return card('x', a, A.name, 'Kỹ năng · ' + A.fp + ' FP', A.desc); }
function spellCard(s) { const sp = SPELLS[s]; return card('s', s, sp.name, (sp.school === 'sorc' ? 'Phép Trí Tuệ · cần gậy' : 'Phép Đức Tin · cần ấn') + ' · ' + sp.fp + ' FP', sp.desc, row('Yêu cầu', reqText(sp.req)) + row('Trạng thái', S.att.includes(s) ? 'Đã ghi nhớ' : 'Chưa ghi nhớ')); }
function itemCard(id) {
  if (id === 'flask') return card('i', 'flask', 'Bình Máu', 'Ô nhanh', 'Hồi ' + flaskHeal() + ' máu. Nạp lại khi nghỉ ở Ân Điển.', row('Còn', P.flasks + ' / ' + (S.flaskMax - S.flaskFp)));
  if (id === 'fpflask') return card('i', 'fpflask', 'Bình FP', 'Ô nhanh', 'Hồi ' + fpFlaskAmt() + ' FP.', row('Còn', P.fpflasks + ' / ' + S.flaskFp));
  const D = ITEMDEF[id]; return card('i', id, D.name, D.kind === 'use' ? 'Đồ dùng' : D.kind === 'key' ? 'Vật phẩm quan trọng' : D.kind === 'bell' ? 'Vật phẩm quan trọng' : 'Nguyên liệu', D.desc, invN(id) ? row('Đang có', invN(id)) : '');
}
function spiritCard(k) { const sp = SPIRITS[k]; return card('p', k, sp.name, 'Tro Triệu Hồi · ' + sp.fp + ' FP', sp.desc + (S.bell ? '' : ' · <span class="dn">Cần Chuông Gọi Hồn</span>')); }

// ───────────────────────── tab Trang bị ─────────────────────────
let invSlot = 'right', detailKey = null, bagCat = 'all';
// tay trái nhận khiên, chất xúc tác và mọi vũ khí cận chiến cầm một tay được
const leftOwned = () => [...OFF_ORDER.filter(w => S.weapons.includes(w)), ...WEAPON_ORDER.filter(w => S.weapons.includes(w) && canGrip2(w))];
const SLOT_LABEL = { right: 'Tay phải', left: 'Tay trái', ash: 'Kỹ năng', armor: 'Giáp', tal: 'Bùa' };
function gearTiles() {
  const Wp = WEAPONS[S.equipped];
  if (invSlot === 'right') return ownedRight().map(w => ({ k: 'w:' + w, kind: 'w', id: w, name: WEAPONS[w].name, n: upLv(w) ? '+' + upLv(w) : '', eq: w === S.equipped, nw: isNew('w', w), act: `data-weapon="${w}"` }));
  if (invSlot === 'left') return leftOwned().map(w => ({ k: 'w:' + w, kind: 'w', id: w, name: WEAPONS[w].name, n: upLv(w) ? '+' + upLv(w) : '', eq: w === S.off, nw: isNew('w', w), act: `data-off="${w}"`, dis: w === S.equipped }));
  if (invSlot === 'ash') {
    if (Wp.type !== 'melee') return [];
    const list = Wp.unique ? [Wp.ash] : [...new Set([Wp.ash, ...S.ashes.filter(a => !ASHES[a].unique && !ASHES[a].bow)])];
    return list.map(a => ({ k: 'x:' + a, kind: 'x', id: a, name: ASHES[a].name, eq: a === ashOf(S.equipped), nw: isNew('x', a), act: `data-ash="${a}"`, dis: Wp.unique || !atGrace() }));
  }
  if (invSlot === 'armor') return ARMOR_ORDER.filter(a => S.armors.includes(a)).map(a => ({ k: 'a:' + a, kind: 'a', id: a, name: ARMORS[a].name, eq: a === S.armor, nw: isNew('a', a), act: `data-armor="${a}"` }));
  return TAL_ORDER.filter(t => S.tals.includes(t)).map(t => ({ k: 't:' + t, kind: 't', id: t, name: TALISMANS[t].name, eq: S.tal.includes(t), nw: isNew('t', t), act: `data-tal="${t}"` }));
}
function cardFor(key) {
  if (!key) return '';
  const [k, id] = key.split(':');
  return k === 'w' ? weaponCard(id) : k === 'a' ? armorCard(id) : k === 't' ? talCard(id) : k === 'x' ? ashCard(id) : k === 's' ? spellCard(id) : k === 'p' ? spiritCard(id) : itemCard(id);
}
function tilesHTML(list) {
  return '<ul class="tiles">' + list.map(t => `<li><button class="tile${t.eq ? ' eq' : ''}${t.k === detailKey ? ' sel' : ''}" data-key="${t.k}" ${t.act || ''} ${t.dis ? 'disabled' : ''} title="${esc(t.name)}">${img(t.kind, t.id)}<span class="nm">${esc(t.name)}</span>${t.n !== undefined && t.n !== '' ? `<span class="n">${t.n}</span>` : ''}${t.nw ? '<em class="newb">MỚI</em>' : ''}</button></li>`).join('') + '</ul>';
}
function renderGear() {
  const Wp = WEAPONS[S.equipped], ash = Wp.type === 'melee' ? ashOf(S.equipped) : null;
  const slots = [
    ['right', 'w', S.equipped, Wp.name], ['left', 'w', S.off, S.off ? WEAPONS[S.off].name + (powerStance() && !pairedW() ? ' · song kiếm' : '') : '—'],
    ['ash', ash ? 'x' : null, ash, ash ? ASHES[ash].name : '—'], ['armor', 'a', S.armor, ARMORS[S.armor].name], ['tal', S.tal[0] ? 't' : null, S.tal[0], S.tal.length + '/' + S.talSlots + ' bùa'],
  ];
  const nwSlot = { right: ownedRight().some(w => isNew('w', w)), left: leftOwned().some(w => isNew('w', w)), ash: S.ashes.some(a => isNew('x', a)), armor: S.armors.some(a => isNew('a', a)), tal: S.tals.some(t => isNew('t', t)) };
  const grip = canGrip2() ? `<div class="grip"><button class="mini${gripTwo() ? ' on' : ''}" data-twoh="1">${gripTwo() ? 'Đang cầm hai tay' : 'Cầm hai tay'}</button><span>${gripTwo() ? 'Sức Mạnh ×1.5, phá thế mạnh hơn; đỡ đòn bằng thân vũ khí.' : powerStance() ? 'Tư thế song kiếm: nút Đỡ ra chuỗi đòn bằng cả hai lưỡi.' : 'Nắm vũ khí tay phải bằng cả hai tay: Sức Mạnh ×1.5.'} <kbd data-k="twohand">H</kbd></span></div>` : '';
  let h = '<div class="slots">' + slots.map(([s, kind, id, nm]) => `<button class="slot${invSlot === s ? ' on' : ''}" data-slot="${s}">${kind && id ? img(kind, id, 44) : '<span class="empty"></span>'}<span class="lbl">${SLOT_LABEL[s]}</span><span class="val">${esc(nm)}</span>${nwSlot[s] ? '<em class="newb">MỚI</em>' : ''}</button>`).join('') + '</div>' + grip;
  const list = gearTiles();
  const why = invSlot === 'ash' ? (Wp.type !== 'melee' ? 'Vũ khí này không gắn kỹ năng' : Wp.unique ? 'Kỹ năng riêng của vũ khí, không đổi được' : !atGrace() ? 'Chỉ đổi kỹ năng khi nghỉ ở Ân Điển' : '') : invSlot === 'left' && Wp.twoHanded ? 'Tay trái bị khóa vì tay phải cầm vũ khí hai tay' : invSlot === 'left' && Wp.paired ? 'Vũ khí đôi chiếm cả hai tay: món ở tay trái chỉ được cất theo, không dùng' : invSlot === 'left' && gripTwo() ? 'Đang cầm hai tay: món ở tay trái được cất sau lưng' : invSlot === 'left' ? 'Cầm vũ khí ở tay trái thì nút Đỡ thành đòn tay trái. Hai vũ khí cùng loại: tư thế song kiếm' : invSlot === 'tal' ? `Đeo tối đa ${S.talSlots} bùa. Bấm để đeo hoặc tháo.` : '';
  h += `<h3 class="sec">${SLOT_LABEL[invSlot]}${invSlot === 'armor' ? ` · tải trọng ${equipLoad().toFixed(1)} / ${maxLoad().toFixed(1)} (${ROLLS[rollType()].name})` : ''}</h3>` + (why ? `<p class="note">${why}</p>` : '');
  h += list.length ? tilesHTML(list) : '<p class="note">Chưa có món nào cho ô này. Tìm trong rương, hầm ngục và cửa hàng.</p>';
  if (!detailKey || !list.some(t => t.k === detailKey)) detailKey = (list.find(t => t.eq) || list[0] || {}).k || null;
  $('gearWrap').innerHTML = `<div class="inv2"><div>${h}</div><aside class="detail" id="gearDetail">${cardFor(detailKey) || '<p class="note">Rê chuột hoặc chọn một món để xem chi tiết.</p>'}</aside></div>`;
  refreshKbd($('gearWrap'));
}
// ───────────────────────── tab Túi đồ ─────────────────────────
function bagTiles() {
  const q = quickList(), out = [];
  const quick = id => q.includes(id);
  const use = [{ k: 'i:flask', kind: 'i', id: 'flask', name: 'Bình Máu', n: P.flasks, q: 'flask' }, { k: 'i:fpflask', kind: 'i', id: 'fpflask', name: 'Bình FP', n: P.fpflasks, q: 'fpflask' }];
  if (S.bell) use.push({ k: 'i:bell', kind: 'i', id: 'bell', name: ITEMDEF.bell.name, n: '', q: 'bell' });
  for (const id of USE_ORDER) if (invN(id)) use.push({ k: 'i:' + id, kind: 'i', id, name: ITEMDEF[id].name, n: invN(id), q: quick(id) ? id : null, nw: false });
  const mats = Object.keys(ITEMDEF).filter(k => ITEMDEF[k].kind === 'mat' && invN(k)).map(id => ({ k: 'i:' + id, kind: 'i', id, name: ITEMDEF[id].name, n: invN(id) }));
  const keysI = Object.keys(ITEMDEF).filter(k => ITEMDEF[k].kind === 'key' && invN(k)).map(id => ({ k: 'i:' + id, kind: 'i', id, name: ITEMDEF[id].name, n: '' }));
  const sps = SPIRIT_ORDER.filter(k => (S.spirits || []).includes(k)).map(k => ({ k: 'p:' + k, kind: 'p', id: k, name: SPIRITS[k].name, eq: S.spiritSel === k, nw: isNew('p', k) }));
  const cur = curQuick();
  for (const t of use) t.eq = t.id === cur;
  if (bagCat === 'all' || bagCat === 'use') out.push(...use);
  if (bagCat === 'all' || bagCat === 'mat') out.push(...mats);
  if (bagCat === 'all' || bagCat === 'key') out.push(...keysI);
  if (bagCat === 'all' || bagCat === 'spirit') out.push(...sps);
  return out;
}
function renderBag() {
  const cats = [['all', 'Tất cả'], ['use', 'Đồ dùng'], ['mat', 'Nguyên liệu'], ['key', 'Quan trọng'], ['spirit', 'Tro Triệu Hồi']];
  const list = bagTiles(), cur = curQuick();
  let h = '<div class="chips">' + cats.map(([k, n]) => `<button class="chip${bagCat === k ? ' on' : ''}" data-cat="${k}">${n}</button>`).join('') + '</div>';
  h += `<p class="note">Ô nhanh đang chọn: <b>${cur === 'flask' ? 'Bình Máu' : cur === 'fpflask' ? 'Bình FP' : ITEMDEF[cur].name}</b>. Bấm một món để xem, rồi chọn “Đặt vào ô nhanh” hoặc “Dùng”.</p>`;
  h += list.length ? tilesHTML(list) : '<p class="note">Chưa có gì trong mục này.</p>';
  h += `<p class="note">Mũi tên ${S.arrows}/${S.arrowMax} · Nước Mắt Thánh ${S.tears}/${TEAR_CAP} · Hạt Vàng ${S.flaskMax}/${FLASK_CAP} bình · Ô phép ${S.slots} · Ô bùa ${S.talSlots}</p>`;
  if (!detailKey || !list.some(t => t.k === detailKey)) detailKey = (list[0] || {}).k || null;
  $('invWrap').innerHTML = `<div class="inv2"><div>${h}</div><aside class="detail" id="bagDetail">${bagDetail(detailKey)}</aside></div>`;
}
function bagDetail(key) {
  if (!key) return '<p class="note">Chọn một món để xem chi tiết.</p>';
  const [k, id] = key.split(':');
  if (k === 'p') return cardFor(key) + `<div class="acts"><button class="mini" data-spirit="${id}" ${S.spiritSel === id ? 'disabled' : ''}>${S.spiritSel === id ? 'Đang chọn' : 'Chọn hồn này'}</button></div>`;
  const inQ = quickList().includes(id), usable = id === 'cure' || id === 'grease' || id.startsWith('grune');
  return cardFor(key) + `<div class="acts">${inQ ? `<button class="mini" data-quick="${id}" ${curQuick() === id ? 'disabled' : ''}>${curQuick() === id ? 'Đang ở ô nhanh' : 'Đặt vào ô nhanh'}</button>` : ''}${usable && invN(id) ? `<button class="mini" data-use="${id}">Dùng</button>` : ''}</div>`;
}
// ───────────────────────── tab Phép ─────────────────────────
function renderSpells() {
  const g = atGrace(), own = SPELL_ORDER.filter(s => S.spells.includes(s)), cs = curSpell();
  const list = own.filter(s => g || S.att.includes(s)).map(s => ({ k: 's:' + s, kind: 's', id: s, name: SPELLS[s].name, eq: g ? S.att.includes(s) : s === cs, nw: isNew('s', s), act: `data-spell="${s}"` }));
  let h = `<p class="note">${g ? `Ghi nhớ ${S.att.length}/${S.slots} ô. Bấm để ghi nhớ hoặc bỏ.` : `Đang ghi nhớ ${S.att.length}/${S.slots} ô. Bấm để chọn phép dùng tiếp theo.`} Phép Trí Tuệ cần gậy, phép Đức Tin cần ấn ở tay trái; niệm bằng <kbd data-k="spell">L</kbd> hoặc giữ chuột phải khi cầm gậy/ấn.</p>`;
  h += list.length ? tilesHTML(list) : '<p class="note">Chưa học phép nào. Học Giả Lyra và Nữ Tu Seraphine ở Sảnh Hearthhold có bán phép.</p>';
  if (!detailKey || !list.some(t => t.k === detailKey)) detailKey = (list.find(t => t.eq) || list[0] || {}).k || null;
  $('spellWrap').innerHTML = `<div class="inv2"><div>${h}</div><aside class="detail">${cardFor(detailKey) || '<p class="note">Chọn một phép để xem chi tiết.</p>'}</aside></div>`;
  refreshKbd($('spellWrap'));
}
// rê chuột hoặc dời tiêu điểm lên một ô: cập nhật thẻ chi tiết mà không vẽ lại cả danh sách
function hookDetail(wrapId, detail) {
  const wrap = $(wrapId);
  const show = e => {
    const b = e.target.closest && e.target.closest('.tile');
    if (!b || !wrap.contains(b)) return;
    const d = wrap.querySelector('.detail'); if (!d || b.dataset.key === d.dataset.key) return;
    d.dataset.key = b.dataset.key; d.innerHTML = detail(b.dataset.key);
  };
  wrap.addEventListener('mouseover', show); wrap.addEventListener('focusin', show);
}
hookDetail('gearWrap', cardFor); hookDetail('invWrap', bagDetail); hookDetail('spellWrap', cardFor);
// bấm ô trang bị: đổi danh sách; bấm ô vật phẩm: nhớ món đang xem (các nút hành động xử lý ở hud.js)
$('gearWrap').addEventListener('click', e => { if (e.target.closest('[data-twoh]')) { toggleTwoHand(); renderGear(); return; } const s = e.target.closest('[data-slot]'); if (s) { invSlot = s.dataset.slot; detailKey = null; renderGear(); return; } const t = e.target.closest('.tile'); if (t) detailKey = t.dataset.key; }, true);
$('invWrap').addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c) { bagCat = c.dataset.cat; detailKey = null; renderBag(); return; } const t = e.target.closest('.tile'); if (t) { detailKey = t.dataset.key; const d = $('bagDetail'); if (d) d.innerHTML = bagDetail(detailKey); for (const x of $('invWrap').querySelectorAll('.tile')) x.classList.toggle('sel', x === t); } }, true);
$('spellWrap').addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) detailKey = t.dataset.key; }, true);

// ───────────────────────── màn chọn xuất thân ─────────────────────────
const CLASS_INFO = {
  knight: { role: 'Hiệp sĩ cân bằng', diff: 1, play: 'Kiếm dài và khiên diều: giơ khiên đỡ đòn, chờ sơ hở rồi phản công. Mang theo cây kích để cầm hai tay khi cần tầm với xa. Lối chơi dễ làm quen nhất.', pros: ['Sinh Lực cao nhất, chịu đòn tốt', 'Khiên diều chặn tốt ngay từ đầu', 'Có cả kiếm lẫn kích để đổi tầm đánh'], cons: ['Cấp khởi đầu cao: lên cấp đắt hơn', 'Chưa có phép'] },
  warrior: { role: 'Song đao, Khéo Léo', diff: 2, play: 'Mỗi tay một thanh kiếm cong: bấm nút Đỡ để ra chuỗi đòn song kiếm, chém dồn dập bằng cả hai lưỡi. Không có khiên che chắn nên phải lăn né là chính.', pros: ['Khéo Léo cao nhất', 'Tư thế song kiếm ngay từ đầu, dồn sát thương rất nhanh', 'Giáp nhẹ, lăn xa'], cons: ['Cầm hai kiếm thì không đỡ đòn được', 'Máu vừa phải, tốn thể lực'] },
  hero: { role: 'Rìu nặng, Sức Mạnh', diff: 1, play: 'Rìu chiến chặt mạnh, phá thế nhanh, khiên diều che chắn. Cầm hai tay cây rìu để Sức Mạnh tính ×1.5 và đập vỡ thế đứng của kẻ địch.', pros: ['Sức Mạnh cao nhất', 'Rìu phá thế tốt, có kỹ năng Chiến Hống', 'Máu và Bền Bỉ khá'], cons: ['Khéo Léo, Trí Tuệ thấp', 'Đòn chậm hơn kiếm'] },
  hunter: { role: 'Dao găm, cung, đâm lưng', diff: 3, play: 'Lẻn ra sau lưng để đâm chí mạng, dùng cung kéo từng con quái ra khỏi bầy. Khiên nhỏ có cửa sổ phản đòn rộng nhất cho ai thích phản đòn.', pros: ['Cấp 1: lên cấp rẻ, phân điểm tự do', 'Dao găm chí mạng mạnh, gây chảy máu', 'Khiên nhỏ dễ phản đòn nhất'], cons: ['Chỉ số khởi đầu thấp', 'Máu thấp, đòn ngắn'] },
  mage: { role: 'Phép Trí Tuệ từ xa', diff: 3, play: 'Giữ khoảng cách và bắn Đá Sao bằng gậy phép; kiếm ngắn để chống đỡ khi bị áp sát. Máu và thể lực thấp nên phải đọc đòn thật kỹ.', pros: ['Trí Tuệ và Tâm Trí cao', 'Đánh từ xa an toàn', 'Mở ra những phép rất mạnh về sau'], cons: ['Máu và thể lực thấp', 'Hết FP là yếu hẳn'] },
  cleric: { role: 'Đức Tin, hồi phục', diff: 2, play: 'Giáo ngắn giữ kẻ địch ở xa, ấn thánh để tự hồi máu và phun Lửa Thiêng. Dẻo dai trong những trận dài.', pros: ['Đức Tin cao nhất', 'Có Hồi Phục và Lửa Thiêng', 'Giáo đâm xa, an toàn'], cons: ['Bền Bỉ thấp: ít cú lăn', 'Không có khiên'] },
  samurai: { role: 'Katana và cung dài', diff: 1, play: 'Katana chém nhanh, gây chảy máu; cung dài bắn xa để mở màn. Bền Bỉ cao cho nhiều cú lăn và chuỗi đòn dài. Được tặng sẵn kỹ năng Gạt Đòn.', pros: ['Katana mạnh, chảy máu dồn nhanh', 'Có cung dài đánh xa', 'Bền Bỉ cao, có sẵn Gạt Đòn'], cons: ['Khiên nhỏ chặn kém', 'Cấp khởi đầu cao'] },
  prisoner: { role: 'Kiếm đâm và phép', diff: 2, play: 'Kiếm đâm tầm xa, chí mạng cao; gậy phép bắn Đá Sao từ xa. Lối lai giữa kiếm và phép, linh hoạt theo từng trận.', pros: ['Khéo Léo và Trí Tuệ đều cao', 'Vừa cận chiến vừa bắn phép', 'Kiếm đâm chí mạng mạnh'], cons: ['Đức Tin thấp nhất', 'Không có khiên'] },
  confessor: { role: 'Kiếm và Đức Tin', diff: 2, play: 'Kiếm bản rộng chém chắc tay, ấn thánh để Hồi Phục. Mang sẵn khiên diều: đổi sang tay trái khi cần đỡ đòn, đổi lại ấn khi cần hồi máu.', pros: ['Cân bằng giữa kiếm và phép', 'Có Hồi Phục ngay từ đầu', 'Mang theo khiên diều'], cons: ['Máu vừa phải', 'Phép tấn công còn ít'] },
  wretch: { role: 'Tự do phân điểm', diff: 3, play: 'Không giáp, một cây chùy gỗ, mọi chỉ số đều 10. Cấp 1 nên lên cấp rẻ nhất: dựng nhân vật đúng như ý muốn từ con số không.', pros: ['Cấp 1: mỗi điểm chỉ số rẻ nhất', 'Không có chỉ số thừa', 'Thử thách cho người chơi lâu năm'], cons: ['Gần như không có giáp', 'Khởi đầu rất yếu'] },
};
let clsSel = 'knight';
function clsPortrait(cv, c, big) {
  const g = cv.getContext('2d'), s = cv.width, old = ctx, S0 = S;
  g.clearRect(0, 0, s, s);
  const bg = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2); bg.addColorStop(0, 'rgba(214,178,94,.22)'); bg.addColorStop(1, 'rgba(214,178,94,0)'); g.fillStyle = bg; g.fillRect(0, 0, s, s);
  ctx = g;
  try {
    S = Object.assign({}, S0, { equipped: c.equipped, armor: c.armor, off: c.off });
    const L = playerLook(), off = WEAPONS[c.off] || {};
    g.save(); g.translate(s / 2, s / 2 + s * 0.05); g.scale(s / (big ? 64 : 42), s / (big ? 64 : 42));
    drawHumanoid(0, 0, Math.PI / 2 - 0.35, L, 0.7, { anim: G.clock || 1, shield: off.type === 'shield' ? 3 : 0, cat: off.type === 'staff' ? 'staff' : off.type === 'seal' ? 'seal' : null, twoHand: false,
      left: off.type === 'melee' ? { L: off.look, wAng: 0.7 } : null });
    g.restore();
  } catch (e) { /* bỏ qua */ }
  S = S0; ctx = old;
}
function openClassSelect() {
  UI.title.hidden = true; UI.cls.hidden = false;
  $('clsEyebrow').textContent = 'Hành trình mới · Độ khó ' + DIFFS[pendingDiff].name;
  $('clsList').innerHTML = CLASSES.map(c => `<li><button class="ci${c.id === clsSel ? ' on' : ''}" data-pick="${c.id}"><canvas width="80" height="80"></canvas><span><b>${c.name}</b><small>${CLASS_INFO[c.id].role}</small></span><span class="lv">Cấp ${c.lv}</span></button></li>`).join('');
  $('clsList').querySelectorAll('canvas').forEach((cv, i) => clsPortrait(cv, CLASSES[i], false));
  renderClassDetail();
  setTimeout(() => { const b = $('clsList').querySelector('.ci.on'); if (b) b.focus({ preventScroll: true }); }, 30);
}
function renderClassDetail() {
  const c = CLASSES.find(q => q.id === clsSel), I = CLASS_INFO[c.id], max = Math.max(...CLASSES.flatMap(q => Object.values(q.stats)));
  const top = Math.max(...Object.values(c.stats));
  const S0 = S; S = Object.assign({}, S0, { stats: Object.assign({}, c.stats), tal: [], gr: [] });
  let hp = 0, fp = 0, st = 0; try { hp = maxHp(); fp = maxFp(); st = maxSt(); } catch (e) { /* bỏ qua */ }
  S = S0;
  const bars = Object.entries(c.stats).map(([k, v]) => `<div class="bar${v === top ? ' hi' : ''}"><span>${STAT_NAME[k]}</span><i style="--w:${Math.round(v / max * 100)}%"></i><b>${v}</b></div>`).join('');
  const gear = [...new Set([c.equipped, c.off, ...c.weapons])].filter(Boolean).map(w => `<li>${img('w', w, 28)}<span>${esc(WEAPONS[w].name)}${w === c.equipped ? ' <small>tay phải</small>' : w === c.off ? ' <small>tay trái</small>' : ''}</span></li>`).join('') + `<li>${img('a', c.armor, 28)}<span>${esc(ARMORS[c.armor].name)}</span></li>` + c.spells.map(s => `<li>${img('s', s, 28)}<span>${esc(SPELLS[s].name)}</span></li>`).join('');
  $('clsDetail').innerHTML = `<div class="cport"><canvas width="340" height="340" id="clsBig"></canvas><div class="clv">Cấp ${c.lv}</div><div class="dif">Độ khó làm quen <span>${'◆'.repeat(I.diff)}${'◇'.repeat(3 - I.diff)}</span></div></div>
    <div class="cinfo"><p class="role">${I.role}</p><h3>${c.name}</h3><p class="play">${I.play}</p>
      <div class="derv"><span>Máu <b>${hp}</b></span><span>FP <b>${fp}</b></span><span>Thể lực <b>${st}</b></span></div>
      <div class="bars">${bars}</div>
      <div class="pc"><ul class="pros">${I.pros.map(p => `<li>${p}</li>`).join('')}</ul><ul class="cons">${I.cons.map(p => `<li>${p}</li>`).join('')}</ul></div>
      <h4 class="sec">Trang bị ban đầu${WEAPONS[c.off].cls && WEAPONS[c.off].cls === WEAPONS[c.equipped].cls ? ' · tư thế song kiếm' : ''}</h4><ul class="sgear">${gear}</ul>
    </div>`;
  clsPortrait($('clsBig'), c, true); $('clsDetail').scrollTop = 0;
  $('btnClsGo').textContent = 'Bắt đầu với ' + c.name;
  for (const b of $('clsList').querySelectorAll('.ci')) b.classList.toggle('on', b.dataset.pick === clsSel);
}
$('clsList').addEventListener('mouseover', e => { const b = e.target.closest('[data-pick]'); if (b && b.dataset.pick !== clsSel) { clsSel = b.dataset.pick; renderClassDetail(); if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#clsList')) b.focus({ preventScroll: true }); } });
$('clsList').addEventListener('focusin', e => { const b = e.target.closest('[data-pick]'); if (b && b.dataset.pick !== clsSel) { clsSel = b.dataset.pick; renderClassDetail(); } });
$('clsList').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b) return; if (b.dataset.pick === clsSel && e.detail > 1) { audioInit(); startGame(null, clsSel); return; } clsSel = b.dataset.pick; renderClassDetail(); const go = $('btnClsGo'); if (go && G.touch) go.scrollIntoView({ block: 'nearest' }); });
$('btnClsGo').addEventListener('click', () => { audioInit(); startGame(null, clsSel); });

// ───────────────────────── nút bấm theo thiết bị: bàn phím, tay cầm hay cảm ứng ─────────────────────────
let INPUT = 'kb';
const PAD_NAME = { light: 'R1', heavy: 'R2', guard: 'L1', skill: 'L2', spell: 'L1', roll: 'B / ○', item: 'X / □', interact: 'Y / △', mount: 'A / ×', lock: 'R3', map: 'Back', inv: 'Start', itemnext: '↓', spellnext: '↑', eqnext: '→', eqprev: '←', twohand: 'Y + R1', up: 'Cần trái', down: 'Cần trái', left: 'Cần trái', right: 'Cần trái' };
const TOUCH_NAME = { light: 'Đánh', heavy: 'Mạnh', guard: 'Đỡ', skill: 'Kỹ năng', spell: 'Đỡ', roll: 'Lăn', item: 'Bình', interact: 'Dùng', mount: 'Ngựa', lock: 'Khóa', map: 'Bản đồ', inv: 'Hành trang', itemnext: 'Đồ', spellnext: 'Phép', eqnext: 'Vũ khí', eqprev: 'Vũ khí', twohand: '2 tay' };
function setInput(d) { if (d === INPUT) return; INPUT = d; refreshKbd(); }
window.addEventListener('keydown', () => setInput('kb'), true);
window.addEventListener('mousedown', () => { if (!G.touch) setInput('kb'); }, true);
window.addEventListener('gamepadconnected', () => setInput('pad'));
setInterval(() => { try { const gp = navigator.getGamepads && [...navigator.getGamepads()].find(g => g && g.connected); if (gp && gp.buttons.some(b => b.pressed)) setInput('pad'); } catch (e) { /* bỏ qua */ } }, 400);
const _keyOfKb = keyOf;
refreshKbd = function (root = document) { for (const k of root.querySelectorAll('kbd[data-k]')) k.textContent = G.touch ? (TOUCH_NAME[k.dataset.k] || _keyOfKb(k.dataset.k)) : INPUT === 'pad' ? (PAD_NAME[k.dataset.k] || _keyOfKb(k.dataset.k)) : _keyOfKb(k.dataset.k); };

// ───────────────────────── bảng Cách chơi (hiện một lần khi bắt đầu hành trình, xem lại ở menu tạm dừng) ─────────────────────────
const HOWTO = [
  ['Di chuyển', ['up', 'left', 'down', 'right'], 'Giữ nút Lăn để chạy nhanh'],
  ['Đánh thường', ['light'], 'Hoặc chuột trái. Bấm liên tiếp để ra chuỗi đòn'],
  ['Đánh mạnh', ['heavy'], 'Hoặc Shift + chuột trái. Chậm nhưng phá thế đứng'],
  ['Lăn né', ['roll'], 'Trong lúc lăn ngươi bất khả xâm phạm một khoảnh khắc'],
  ['Đỡ đòn / phản đòn', ['guard'], 'Hoặc chuột phải. Giơ đúng lúc đòn chạm tới để phản đòn'],
  ['Cầm hai tay', ['twohand'], 'Sức Mạnh ×1.5. Tay trái cầm vũ khí thì nút Đỡ thành đòn tay trái; hai vũ khí cùng loại: tư thế song kiếm'],
  ['Kỹ năng vũ khí', ['skill'], 'Tốn FP. Mỗi vũ khí một kỹ năng riêng'],
  ['Niệm phép', ['spell'], 'Cần gậy hoặc ấn ở tay trái'],
  ['Uống bình / dùng đồ', ['item'], 'Đổi đồ trong ô nhanh bằng', 'itemnext'],
  ['Tương tác', ['interact'], 'Nghỉ ở Ân Điển, mở rương, đọc lời nhắn'],
  ['Khóa mục tiêu', ['lock'], 'Luôn quay mặt về phía kẻ địch'],
  ['Ngựa / bản đồ / hành trang', ['mount', 'map', 'inv'], ''],
];
function renderHowto() {
  const k = a => `<kbd data-k="${a}"></kbd>`;
  $('howtoList').innerHTML = HOWTO.map(([n, acts, tip, extra]) => `<div><dt>${n}</dt><dd>${acts.map(k).join(' ')}${tip ? `<small>${tip}${extra ? ' ' + k(extra) : ''}</small>` : ''}</dd></div>`).join('');
  $('howtoTips').innerHTML = [
    ['Thể lực', 'Đánh, lăn, đỡ đều tốn thể lực. Hết thể lực là không thể né, hãy luôn chừa lại một cú lăn.'],
    ['Ân Điển', 'Điểm sáng vàng. Nghỉ để hồi máu, nạp bình, lên cấp. Quái thường sẽ hồi sinh khi ngươi nghỉ.'],
    ['Rune', 'Hạ quái nhận rune để lên cấp. Chết thì rune rơi lại; quay về nhặt trước khi chết lần nữa.'],
    ['Đọc đòn', 'Kẻ địch vung vũ khí lên trước khi chém. Đừng lăn quá sớm: chờ lưỡi kiếm gần chạm mới lăn.'],
  ].map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('');
  $('howtoHints').innerHTML = HINTS.filter(h => S.tips && S.tips[h[0]]).map(h => `<li><b>${h[2]}</b><span>${G.touch ? h[4] : h[3]}</span></li>`).join('') || '<li><span>Gợi ý sẽ hiện dần khi ngươi gặp tình huống mới, và được lưu lại ở đây.</span></li>';
  refreshKbd($('howto'));
}
let howtoBack = null;
function openHowto(back) {
  howtoBack = back || null; if (G.mode === 'play') setMode('menu');
  renderHowto(); UI.pause.hidden = true; $('howto').hidden = false; SFX.uiOpen();
  setTimeout(() => $('btnHowtoOk').focus({ preventScroll: true }), 30);
}
function closeHowto() { $('howto').hidden = true; S.tips.howto = 1; if (howtoBack === 'pause') { UI.pause.hidden = false; } else setMode('play'); }
$('btnHowtoOk').onclick = closeHowto;
$('btnHowto').onclick = () => openHowto('pause');
// lần đầu vào game của một hành trình mới: mở bảng Cách chơi sau khi màn hình hiện lên
function maybeShowHowto() { if (window.__T) return; // bản thử tự động không cần bảng này
  if (S && S.tips && !S.tips.howto && S.level <= clsBaseLv() && G.mode === 'play') openHowto(); }

// ───────────────────────── chú thích khi rê chuột lên HUD ─────────────────────────
const HUD_TIPS = [];
function hudTip(x, y, w, h, fn) { HUD_TIPS.push([x, y, w, h, fn]); }
function drawHudTip() {
  if (G.mode !== 'play' || G.touch || !mouse.inside) return;
  const mx = mouse.x / SET.text, my = mouse.y / SET.text; // HUD được vẽ thu phóng theo cỡ chữ
  const t = HUD_TIPS.find(([x, y, w, h]) => mx >= x && mx <= x + w && my >= y && my <= y + h);
  if (!t) return;
  const lines = t[4](); if (!lines || !lines.length) return;
  ctx.save(); ctx.font = `600 13px ${FONT_U}`;
  const pad = 8, lh = 18, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 2 - 4;
  let x = mx + 14, y = my + 12; if (x + w > CW - 4) x = mx - w - 10; if (y + h > CH - 4) y = my - h - 8;
  ctx.fillStyle = 'rgba(12,10,8,.94)'; ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.fillRect(x, y, w, h); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  lines.forEach((l, i) => { ctx.fillStyle = i ? '#d8ccb0' : '#f2dc97'; ctx.textBaseline = 'top'; ctx.fillText(l, x + pad, y + pad + i * lh); });
  ctx.restore();
}

// ───────────────────────── dòng nhặt đồ bên phải (thay cho bảng giữa màn hình với đồ vặt) ─────────────────────────
const FEED = [];
function feedPush(text, kind, id) { FEED.unshift({ text, kind, id, t: 0 }); if (FEED.length > 6) FEED.length = 6; }
let feedLast = 0;
function drawFeed() {
  const now = performance.now(), dt = Math.min(0.1, (now - feedLast) / 1000); feedLast = now;
  if (!FEED.length || G.mode === 'title') return;
  const k = 1, x = CW - 18, y0 = CH * 0.46;
  ctx.save(); ctx.font = `600 ${Math.round(13 * k)}px ${FONT_U}`; ctx.textBaseline = 'middle';
  FEED.forEach((f, i) => {
    f.t += dt;
    const a = Math.min(1, f.t * 4) * Math.min(1, (4.5 - f.t) / 0.6); if (a <= 0) return;
    const y = y0 + i * 30 * k, w = ctx.measureText(f.text).width + 44;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x - w, 0, x, 0); g.addColorStop(0, 'rgba(10,9,7,0)'); g.addColorStop(0.25, 'rgba(10,9,7,.78)'); g.addColorStop(1, 'rgba(10,9,7,.85)');
    ctx.fillStyle = g; ctx.fillRect(x - w, y - 12 * k, w, 24 * k);
    if (f.kind) { const im = feedImg(f.kind, f.id); if (im.complete) ctx.drawImage(im, x - 26 * k, y - 11 * k, 22 * k, 22 * k); }
    ctx.fillStyle = '#efe4c8'; ctx.textAlign = 'right'; ctx.fillText(f.text, x - 32 * k, y);
  });
  for (let i = FEED.length - 1; i >= 0; i--) if (FEED[i].t > 4.5) FEED.splice(i, 1);
  ctx.restore();
}
const FEED_IMG = new Map();
function feedImg(kind, id) { const key = kind + id; if (!FEED_IMG.has(key)) { const im = new Image(); im.src = iconURL(kind, id, 32); FEED_IMG.set(key, im); } return FEED_IMG.get(key); }
