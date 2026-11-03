'use strict';
const tg = window.Telegram && Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); } catch (e) {} }
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sh = n => n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? +(n / 1e3).toFixed(1) + 'k' : String(n);
const CO = '<i class="co"></i>';
const hms = ms => { ms = Math.max(0, ms); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(ms / 36e5))}:${p(Math.floor(ms / 6e4) % 60)}:${p(Math.floor(ms / 1e3) % 60)}`; };
const wearAb = f => f < .07 ? 'FN' : f < .15 ? 'MW' : f < .38 ? 'FT' : f < .45 ? 'WW' : 'BS';
const wearFull = f => ({ FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' }[wearAb(f)]);
const NWN = { mil: 'High Grade', res: 'Remarkable', cla: 'Exotic', cov: 'Extraordinary', gold: 'Master' };
const BASE = ((window.SKINHUB && window.SKINHUB.API) || '').replace(/\/$/, '');
let LASTBAL = null, CAT, ME, view = 'home', arg = null, stack = [], QTY = 1, DT = 'top', INV = 'inv', SELMODE = false, SEL = new Set(), UP = { sel: new Set(), t: null }, CT = new Set(), SORT = 'price', PDIR = 1, WIKI = 'all', BCASE = 0, TALL = false;
const TABS = ['home', 'cases', 'games', 'inventory'];
const IT = id => CAT.items[id];
const rname = it => it.nw ? NWN[it.r] : CAT.R[it.r].n;
const REF = new URLSearchParams(location.search).get('ref') || (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
function devUser() { let d = localStorage.getItem('dev'); if (!d) { d = JSON.stringify({ id: 1e8 + Math.floor(Math.random() * 9e8), first_name: 'Mehmon', last_name: '', username: '' }); localStorage.setItem('dev', d); } return d; }
async function api(p, b) {
  const h = { 'content-type': 'application/json' };
  if (tg && tg.initData) h['x-init-data'] = tg.initData; else h['x-dev-user'] = devUser();
  if (REF) h['x-ref'] = REF;
  const r = await fetch(BASE + '/api/' + p, { method: b ? 'POST' : 'GET', headers: h, body: b ? JSON.stringify(b) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Xato');
  if (j.me) ME = j.me;
  return j;
}
const T = async f => { try { return await f(); } catch (e) { toast(e.message, 1); } };
function toast(m, bad) { if (bad) SFX.err(); else if (/^[+−]|Ulandi|Faollashdi|Sotib|Bilet|Omon/.test(m)) SFX.coin(); const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
function modal(h, keep) {
  let m = $('#modal');
  if (!h) { if (m) m.remove(); return; }
  if (!m) { m = document.createElement('div'); m.id = 'modal'; m.onclick = e => { if (e.target === m && !keep) modal(); }; document.body.appendChild(m); }
  m.innerHTML = `<div class="sheet">${h}</div>`;
}
const ask = msg => new Promise(r => tg && tg.showConfirm ? tg.showConfirm(msg, r) : r(confirm(msg)));

/* ---------- Rasmlar (SVG) ---------- */
let gid = 0;
const SHP = {
  rifle: '<path d="M8 50 L72 45 L150 43 L206 45 L292 41 L292 51 L206 55 L182 58 L168 84 L152 84 L146 61 L112 59 L102 88 L84 88 L80 60 L42 64 L30 76 L10 76Z"/>',
  sniper: '<path d="M8 52 L72 48 L150 47 L206 49 L296 46 L296 54 L206 58 L182 61 L168 86 L152 86 L146 64 L112 62 L102 88 L84 88 L80 62 L42 66 L30 78 L10 78Z"/><rect x="104" y="30" width="62" height="12" rx="5"/>',
  pistol: '<path d="M70 34 L236 34 L236 56 L156 56 L146 66 L136 94 L106 94 L114 60 L70 60Z"/>',
  knife: '<path d="M20 64 Q90 8 280 40 Q170 66 20 64Z"/><rect x="2" y="58" width="44" height="18" rx="8"/>',
  glove: '<path d="M96 96 L84 52 L72 40 L82 34 L96 46 L98 18 L110 16 L114 44 L120 12 L132 12 L132 44 L142 18 L154 22 L148 54 L176 40 L184 50 L158 80 L152 96Z"/>'
};
function art(it) {
  const s = svgArt(it);
  if (!it.img) return s;
  return `<span class="aw"><img src="${esc(it.img)}" alt="${esc(it.w + ' ' + it.s)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('nf')">${s}</span>`;
}
function svgArt(it) {
  const id = 'g' + gid++, [a, b, c] = it.g;
  if (it.sh === 'sticker') return `<svg viewBox="0 0 120 100" role="img" aria-label="${esc(it.w + ' ' + it.s)}"><defs><radialGradient id="${id}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><circle cx="60" cy="50" r="42" fill="url(#${id})" stroke="${b}" stroke-width="5"/><circle cx="60" cy="50" r="33" fill="none" stroke="${b}" stroke-opacity=".5" stroke-width="2"/><text x="60" y="56" text-anchor="middle" font-size="${it.s.replace(/\s*\(.*\)/, '').length > 6 ? 12 : 15}" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" font-family="system-ui,sans-serif">${esc(it.s.replace(/\s*\(.*\)/, '').slice(0, 9))}</text></svg>`;
  if (it.sh === 'charm') return `<svg viewBox="0 0 120 100" role="img" aria-label="${esc(it.w + ' ' + it.s)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><circle cx="60" cy="12" r="8" fill="none" stroke="#cfd3db" stroke-width="4"/><path d="M60 21 L60 32" stroke="#cfd3db" stroke-width="4"/><rect x="34" y="32" width="52" height="60" rx="22" fill="url(#${id})" stroke="#000" stroke-opacity=".6" stroke-width="3"/><circle cx="49" cy="55" r="4" fill="#000"/><circle cx="71" cy="55" r="4" fill="#000"/><path d="M50 71 Q60 79 70 71" stroke="#000" fill="none" stroke-width="3" stroke-linecap="round"/></svg>`;
  const P = {
    stripes: `<pattern id="${id}p" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="5" height="14" fill="#000" opacity=".28"/></pattern>`,
    blocks: `<pattern id="${id}p" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="9" fill="#000" opacity=".22"/><rect x="22" y="12" width="16" height="6" fill="#fff" opacity=".25"/></pattern>`,
    camo: `<pattern id="${id}p" width="46" height="34" patternUnits="userSpaceOnUse"><ellipse cx="12" cy="10" rx="14" ry="8" fill="#000" opacity=".3"/><ellipse cx="34" cy="26" rx="10" ry="7" fill="#fff" opacity=".18"/></pattern>`,
    flame: `<pattern id="${id}p" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 60 Q15 20 30 60 Q45 10 60 60Z" fill="#000" opacity=".3"/></pattern>`
  };
  const ov = P[it.p] || '', s = SHP[it.sh] || SHP.rifle;
  return `<svg viewBox="0 0 300 100" role="img" aria-label="${esc(it.w + ' ' + it.s)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient><filter id="${id}f" x="-5%" y="-10%" width="110%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="3.5" flood-color="#000" flood-opacity=".55"/></filter>${ov}</defs><g filter="url(#${id}f)"><g fill="url(#${id})" stroke="#05070c" stroke-width="2.5" stroke-linejoin="round">${s}</g>${ov ? `<g fill="url(#${id}p)">${s}</g>` : ''}<g fill="url(#${id}s)" stroke="#fff" stroke-opacity=".28" stroke-width="1">${s}</g></g></svg>`;
}
function chest(c1, c2) {
  const id = 'c' + gid++;
  return `<svg viewBox="0 0 160 120"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><ellipse cx="80" cy="108" rx="62" ry="8" fill="#000" opacity=".4"/><rect x="22" y="52" width="116" height="52" rx="7" fill="url(#${id})" stroke="#000" stroke-opacity=".5" stroke-width="2"/><path d="M18 56 L24 30 Q80 18 136 30 L142 56Z" fill="url(#${id})" stroke="#000" stroke-opacity=".5" stroke-width="2"/><rect x="40" y="52" width="6" height="52" fill="#000" opacity=".25"/><rect x="114" y="52" width="6" height="52" fill="#000" opacity=".25"/><rect x="70" y="50" width="20" height="16" rx="3" fill="#f2d22a" stroke="#000" stroke-opacity=".5"/></svg>`;
}
const fixWear = it => ['FT', 'MW', 'FN', 'BS', 'WW'][it.id % 5];
const usdTag = it => `<span class="tag" style="font-size:13px"><svg viewBox="0 0 24 24" style="width:13px;height:13px;margin-right:4px"><circle cx="12" cy="12" r="9"/></svg>$${it.usd}</span>`;
function icard(id, o = {}) {
  const it = IT(id), r = CAT.R[it.r], i = o.inst;
  const tl = it.nw ? '' : (i ? (i.st ? '<span class="st">ST</span> ' : '') + wearAb(i.f) : fixWear(it));
  const price = o.price === undefined ? `<span class="tag">${fmt(it.c)}${CO}</span>${usdTag(it)}` : o.price;
  return `<div class="ic ${o.sel ? 'sel' : ''}" style="--rc:${r.c}" ${o.attr || ''}><div class="top"><span>${o.tl !== undefined ? o.tl : (it.r === 'gold' ? '★ ' : '') + tl}</span></div>${o.ch ? `<span class="ch ${o.ch.hi ? 'hi' : ''}">${o.ch.t}</span>` : ''}${art(it)}<div class="nm"><small>${esc(it.w)}</small><b>${esc(it.s)}</b></div>${o.mid || ''}<div class="pr">${price}</div>${o.av ? `<span class="av">${esc(o.av)}</span>` : ''}</div>`;
}
const flt = f => `<div class="fl"><u style="left:${Math.min(100, f * 100)}%"></u></div><div class="flr"><span>${wearFull(f)}</span><span>Float ${f.toFixed(4)}</span></div>`;

/* ---------- Navigatsiya ---------- */
function nav() {
  $('#nav').style.display = TABS.includes(view) ? 'flex' : 'none';
  const cur = TABS.includes(view) ? view : null;
  $$('#nav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === cur));
  let d = $('#devback'); if (!tg && stack.length) { if (!d) { d = document.createElement('button'); d.id = 'devback'; d.className = 'devback'; d.textContent = '← Orqaga'; d.onclick = back; document.body.appendChild(d); } } else if (d) d.remove();
  if (tg && tg.BackButton) stack.length ? tg.BackButton.show() : tg.BackButton.hide();
}
const SK = () => '<div class="sk">' + '<i></i>'.repeat(8) + '</div>';
async function render(keep) {
  const y = scrollY, a = $('#app');
  if (!keep) a.innerHTML = SK();
  try { a.innerHTML = await VIEWS[view](arg); } catch (e) { a.innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
  scrollTo(0, keep ? y : 0); nav(); afterRender();
}
function afterRender() {
  const b = $('#bal'); if (b && ME) { if (LASTBAL != null && LASTBAL !== ME.coins) FX.count(b, LASTBAL, ME.coins); }
  if (ME) LASTBAL = ME.coins;
  FX.bind();
}
function tab(v) { stack = []; view = v; arg = null; SELMODE = false; SEL.clear(); modal(); render(); }
function go(v, a) { stack.push([view, arg]); view = v; arg = a === undefined ? null : a; modal(); render(); }
function back() { const s = stack.pop(); if (s) { view = s[0]; arg = s[1]; modal(); render(); } }
if (tg && tg.BackButton) tg.BackButton.onClick(back);
$$('#nav [data-t]').forEach(b => b.onclick = () => tab(b.dataset.t));
$('#menuBtn').onclick = () => modal(`<button class="mi" onclick="go('profile')">Profil</button><button class="mi" onclick="go('friends')">Do‘stlar</button><button class="mi" onclick="go('pay')">Hamyon (tanga sotib olish)</button><button class="mi" onclick="go('settings')">Sozlamalar</button><button class="mi" onclick="go('wiki')">Skinlar vikisi</button>`);
setInterval(() => $$('[data-end]').forEach(e => e.textContent = hms(+e.dataset.end - Date.now())), 1000);

/* ---------- Bosh sahifa komponentlari ---------- */
const segs = (n, on) => `<div class="segs">${[...Array(n)].map((_, i) => `<s class="${i < on ? 'on' : ''}"></s>`).join('')}</div>`;
const task = (t, sub, btn) => `<div class="task"><div style="flex:1;min-width:0"><b>${t}</b>${sub || ''}</div>${btn}</div>`;
const tmr = e => `<b data-end="${e}">${hms(e - Date.now())}</b>`;
const ini = s => esc(String(s || '?').slice(0, 1).toUpperCase());
function pcard(r) {
  const it = IT(r.item), fr = r.kind === 'friends', buy = r.kind === 'buy';
  const lab = buy ? 'LOTEREYA' : fr ? 'DO‘STLAR UCHUN' : `Kirish ${fmt(r.price)}${CO}`;
  const btn = fr ? `<button class="btn" onclick="go('friends')">Taklif qilish</button>` : buy ? `<button class="btn" onclick="A.join(${r.id},1)">Chipta sotib olish ${fmt(r.price)}${CO}</button>` : `<button class="btn" onclick="A.join(${r.id},1)">O‘ynash ${fmt(r.price)}${CO}</button>`;
  return `<div class="pc ${buy ? 'red' : fr ? 'pink' : ''}"><div class="row"><span class="tag">${lab}</span><span class="tag">⏱ ${tmr(r.end)}</span></div>${art(it)}<small class="up">${esc(it.w)} ${it.nw ? '' : fixWear(it)}</small><h3>${esc(it.s)}</h3><div class="m2">${fmt(it.c)}${CO} · $${it.usd}</div><div class="two"><div><small>Biletlaring</small><b>${r.mine}</b></div><div><small>Ishtirokchi</small><b>${r.players}</b></div></div>${btn}</div>`;
}
function racecard(r) {
  const it = IT(r.item), cs = CAT.cases[r.cid], L = r.leader;
  return `<div class="pc"><div class="row"><span class="tag"> </span><span class="tag">⏱ ${tmr(r.end)}</span></div>${art(it)}<small class="up">${esc(it.w)} ${fixWear(it)}</small><h3>${esc(it.s)}</h3><div class="m2">${fmt(it.c)}${CO} · $${it.usd}</div><div class="two"><div class="sm">${r.mine ? `Sizda <b>${r.mine}</b> ochilish` : 'Hali poygada emassiz'}</div><div class="sm">${L ? `<small>${esc(L.me ? 'Siz' : L.n)}</small>${L.c} ochilish` : 'Yetakchi yo‘q'}</div></div><button class="btn" onclick="go('case',${cs.id})">Ochish «${esc(cs.name)}»</button></div>`;
}
const sec = (t, link) => `<div class="sech"><h2>${t}</h2>${link || ''}</div>`;
const rules = k => `<button class="mut" onclick="A.rules('${k}')">ⓘ Qoidalar</button>`;

const VIEWS = {};
VIEWS.home = async () => {
  const [d, rf, rc] = await Promise.all([api('drops' + (DT === 'top' ? '?top=1' : '')), api('raffles'), api('races')]);
  const m = ME, cf = CAT.cfg, p = Math.min(100, Math.floor(m.xp / m.need * 100)), dl = m.daily, fr = Date.now() - m.freeAt >= 864e5;
  const knife = CAT.items.find(x => x.sh === 'knife'), fd = d.free;
  const t1 = task('Steam hisobni ulang', '', m.steamDone ? '<span class="pbtn dim">Bajarildi ✓</span>' : `<button class="pbtn" onclick="A.steamModal()">${cf.steamReward}${CO}</button>`);
  const ttag = (k, title, days, on, at, rew) => task(title, `${segs(10, days)}<small>${days}/10 Kun · Maks +${rew * 10}${on ? ' · avtomatik tekshiriladi' : ''}</small>`, on ? `<span class="pbtn dim">${tmr(at + 864e5)}<br>+${rew}${CO}</span>` : days >= 10 ? '<span class="pbtn dim">Bajarildi ✓</span>' : `<button class="pbtn" onclick="A.tagTask('${k}')">${rew}${CO}</button>`);
  const t2 = ttag('name', 'Familiyada bot nomi', m.nameDays, m.nameOn, m.nameAt, cf.nameReward);
  const t3 = ttag('bio', 'Bio da referal havolasi', m.bioDays, m.bioOn, m.bioAt, cf.bioReward);
  const t4 = task('Do‘stni taklif qiling', `${segs(10, Math.min(10, m.refs))}<small>${Math.min(10, m.refs)}/10 do‘st · 10-chi uchun +4 000${CO}</small>`, `<button class="pbtn" onclick="go('friends')">Do‘stlar</button>`);
  const t5 = task('Kunlik bonus', `${segs(7, dl.streak)}<small>${dl.streak}/7 Kun · Maks +${cf.daily[6]}${CO}</small>`, dl.ready ? `<button class="pbtn" onclick="A.daily()">+${dl.next}${CO}</button>` : `<span class="pbtn dim">${tmr(dl.at + 864e5)}<br>+${dl.next}${CO}</span>`);
  const t6 = task('Kanalga obuna', `<small>${esc(cf.channel || 'Kanal sozlanmagan')}</small>`, m.chDone ? `<span class="pbtn dim" style="color:var(--g)">${cf.chReward}${CO} ✓</span>` : `<button class="pbtn" onclick="A.chTask()">${cf.chReward}${CO}</button>`);
  return `<div class="panel"><div class="row"><div style="display:flex;align-items:center;gap:14px"><span class="av" style="position:static;width:56px;height:56px;font-size:22px">${ini(m.name)}</span><div class="big"><span id="bal">${fmt(m.coins)}</span>${CO}</div></div><span class="lvl">LVL ${m.lvl}</span></div><div class="row mut" style="margin-top:8px"><span>${fmt(m.xp)} XP dan ${fmt(m.need)} XP</span><span>${p}%</span></div><div class="bar"><i style="width:${p}%"></i></div></div>
<button class="btn blue wide" onclick="go('pay')">Tanga sotib olish</button>
${sec('Vazifalar')}${t1}${t2}${t3}${TALL ? t4 + t5 + t6 : ''}
<button class="panel mut wide" style="text-align:center;padding:14px;border-radius:20px;width:100%" onclick="A.tall()">${TALL ? 'Vazifalarni yashirish ⌃' : 'Barcha vazifalarni ko‘rsatish ⌄'}</button>
<button class="banner" style="background:linear-gradient(120deg,#12306a,#7a4a10)" onclick="go('battles')"><h3>Case Battles</h3><p>Boshqa o‘yinchilarga qarshi omadingizni sinab ko‘ring</p><span class="btn blue sm" style="width:fit-content">Jang</span><span class="li">🏆</span></button>
<button class="banner club" onclick="A.club()"><b>🔒 SKINHUB YOPIQ KLUBI</b><p style="max-width:75%">Har hafta keshbek, kunlik vazifalar va pichoq lotereyasida yutish imkoniyati.</p><span class="btn sm" style="width:fit-content">Batafsil</span><span class="li">⚡</span></button>
<button class="banner" style="background:linear-gradient(120deg,#f5a20a,#f2550a)" onclick="go('friends')"><div style="width:42%;margin-left:-8px">${art(knife)}</div><div style="position:absolute;right:22px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;width:50%"><h3 style="font-size:21px">Do‘stlar uchun pichoq</h3><p style="max-width:100%">Top-5 — pichoq, 6–20 — tanga</p></div></button>
${sec('Bepul keys', `<button class="mut" onclick="A.freeInfo()">O‘tganlari ›</button>`)}
<div class="panel" style="background:linear-gradient(120deg,#0a2a50,#101a30)"><div class="row" style="gap:14px"><div style="width:32%">${chest('#1a5a9a', '#6ad0ff')}</div><div style="flex:1;min-width:0">${fd ? `<small class="mut">O‘tgan ulashish · ${Math.max(1, Math.round((Date.now() - fd.t) / 6e4))} daqiqa oldin</small><br><b>${esc(fd.n)}</b><br>${esc(IT(fd.id).s)} <span class="tag">${fmt(fd.c)}${CO}</span>` : '<b>Kunlik bepul keys</b><br><small class="mut">Har 24 soatda bitta skin</small>'}</div></div><div style="margin-top:12px">${fr ? '<button class="btn blue wide" onclick="A.free()">Bepul ochish</button>' : `<div class="pbtn dim" style="text-align:center;display:block">Keyingisi: ${tmr(m.freeAt + 864e5)}</div>`}</div></div>
<div class="row"><h2>24 soatlik droplar</h2><div class="seg"><button class="${DT === 'top' ? 'on' : ''}" onclick="A.dt('top')">Top</button><button class="${DT === 'all' ? 'on' : ''}" onclick="A.dt('all')">Hammasi</button></div></div>
<div class="hs">${d.drops.length ? d.drops.map(x => `<div style="flex:0 0 230px;position:relative">${icard(x.id, { inst: { f: x.f, st: x.st }, av: ini(x.n) })}</div>`).join('') : '<p class="empty">Hozircha droplar yo‘q — birinchi bo‘ling!</p>'}</div>
${sec('Rush Mid yutuq o‘yini', rules('rush'))}<div class="hs">${rf.raffles.filter(r => r.kind === 'rush').map(pcard).join('')}</div>
${sec('Qurollanish poygasi', rules('race'))}<div class="hs">${rc.races.map(racecard).join('')}</div>
${sec('Lotereyalar')}<div class="hs">${rf.raffles.filter(r => r.kind !== 'rush').map(pcard).join('')}</div>
<button class="banner" style="background:linear-gradient(120deg,#26301a,#14180c);min-height:110px" onclick="go('friends')"><p style="max-width:80%;font-size:18px">Faolligingiz uchun kuboklar, tangalar va XP yutib oling!</p><span class="li" style="font-size:60px">🏅</span></button>
<button class="banner" style="background:linear-gradient(120deg,#1664ff,#2a8cff);min-height:120px" onclick="go('friends')"><h3 style="font-size:22px">Do‘stlaringizni taklif qiling</h3><p style="max-width:90%">Har biri uchun ${fmt(cf.refBonus)} tanga va ularning har bir to‘ldirishidan ${cf.refPct}% oling!</p></button>
<span class="lk">Foydalanuvchi shartnomasi<br>Maxfiylik siyosati</span>`;
};

/* ---------- Keyslar ---------- */
const bd = c => (c.badge === 'hot' || (!c.badge && HOT.includes(c.name))) ? '<span class="badge h">🔥 XIT</span>' : (c.badge === 'new' || (!c.badge && NEW.includes(c.name))) ? '<span class="badge n">YANGI</span>' : '';
const HOT = ['Grunt', 'Tundra', 'Lurk', 'Strike', 'Ronin'], NEW = ['Capivara', 'Favela', 'Investor', 'Charm'];
VIEWS.cases = async () => {
  const cs = CAT.cases.filter(c => !c.off);
  if (SORT === 'opens') cs.sort((a, b) => b.opens - a.opens); else if (SORT === 'new') cs.sort((a, b) => (NEW.includes(b.name) - NEW.includes(a.name)) || a.price - b.price); else cs.sort((a, b) => (a.price - b.price) * PDIR);
  const tb = (k, t) => `<button style="font-size:17px;padding:8px 14px;color:${SORT === k ? '#fff' : 'var(--m)'};font-weight:600" onclick="A.sort('${k}')">${t}</button>`;
  return `<div class="row" style="margin:6px 0 12px">${tb('new', 'Yangi')}${tb('opens', 'Eng ko‘p ochilgan')}<button style="margin-left:auto;font-size:18px;color:var(--y)" onclick="A.pdir()">${CO}${PDIR > 0 ? '↑' : '↓'}</button></div>
<div class="grid2">${cs.map(c => `<button class="case" style="--c1:${c.c1};--c2:${c.c2}" onclick="go('case',${c.id})">${bd(c)}${chest(c.c1, c.c2)}<div class="nm">${esc(c.name)}</div><div class="tags"><span class="tag">${sh(c.price)}${CO}</span><span class="tag">▣ ${sh(c.opens)}</span></div></button>`).join('')}</div>`;
};
VIEWS.case = async id => {
  const c = CAT.cases[id], e = c.e.slice().sort((a, b) => a.p - b.p), cost = c.price * QTY, short = cost - ME.coins;
  const sim = CAT.cases.filter(x => x.id !== id && !x.off).sort((a, b) => Math.abs(a.price - c.price) - Math.abs(b.price - c.price)).slice(0, 4);
  return `<div class="hero" style="--c1:${c.c1};--c2:${c.c2}">${chest(c.c1, c.c2)}<h1>${esc(c.name)}</h1><div class="tags"><span class="tag">${fmt(c.price)}${CO}</span><span class="tag">▣ ${sh(c.opens)}</span></div></div>
<h3 style="text-align:center;margin:12px 0">Keysdagi buyumlar</h3>
<div class="grid2">${e.map(x => icard(x.id, { ch: { t: (x.p * 100).toFixed(x.p < .01 ? 2 : 2) + '%' } })).join('')}</div>
<h3 style="text-align:center;margin:22px 0 12px">O‘xshash keyslar</h3><div class="grid2">${sim.map(x => `<button class="case" style="--c1:${x.c1};--c2:${x.c2}" onclick="go('case',${x.id})">${chest(x.c1, x.c2)}<div class="nm">${esc(x.name)}</div><div class="tags"><span class="tag">${sh(x.price)}${CO}</span><span class="tag">▣ ${sh(x.opens)}</span></div></button>`).join('')}</div>
<div style="height:190px"></div>
<div class="obar"><span class="bal">Balans ${fmt(ME.coins)}${CO}</span><div class="qty">${[1, 2, 3, 5, 10].map(n => `<button class="${QTY === n ? 'on' : ''}" onclick="A.qty(${n})">×${n}</button>`).join('')}</div>${short > 0 ? `<button class="btn blue" onclick="go('pay')">${fmt(short)}${CO} yetmaydi — to‘ldirish</button>` : `<button class="btn blue" onclick="A.open(${id})">Ochish ${fmt(cost)}${CO} <small style="opacity:.8">+${QTY} XP</small></button>`}</div>`;
};
function reel(c, item) {
  const rnd = () => { let x = Math.random(), s = 0; for (const e of c.e) { s += e.p; if (x < s) return e; } return c.e[0]; };
  const pm = {}; c.e.forEach(e => pm[e.id] = e.p);
  const H = 200, W = 30, tiles = [], it0 = IT(item.id), col = CAT.R[it0.r].c;
  for (let i = 0; i < 40; i++) tiles.push(i === W ? { id: item.id, p: pm[item.id] || 0 } : rnd());
  const ov = document.createElement('div'); ov.id = 'reel'; ov.style.setProperty('--wc', col);
  ov.innerHTML = `<div class="rl"><div class="rail2" id="rail2">${tiles.map((t, i) => { const it = IT(t.id); return `<div class="rt ${i === W ? 'wn' : ''}">${art(it)}<small>${esc(it.w)}</small><b>${esc(it.s)}</b><span>${fmt(it.c)}${CO} <small>${(t.p * 100).toFixed(2)}%</small></span></div>`; }).join('')}</div></div><i class="ar l"></i><i class="ar r"></i>`;
  document.body.appendChild(ov);
  const rail = $('#rail2'), box = innerHeight, target = W * H + H / 2 - box / 2 + (Math.random() * 60 - 30);
  SFX.whoosh();
  requestAnimationFrame(() => requestAnimationFrame(() => { rail.style.transform = `translateY(${-target}px)`; }));
  let last = -1, alive = true;
  const watch = () => { if (!alive) return; const m = new DOMMatrix(getComputedStyle(rail).transform), idx = Math.floor((-m.m42 + box / 2) / H); if (idx !== last) { last = idx; SFX.tick(1 + Math.min(.5, idx / 80)); } requestAnimationFrame(watch); };
  requestAnimationFrame(watch);
  setTimeout(() => {
    alive = false; rail.classList.add('done'); rail.children[W].classList.add('win'); SFX.win(it0.r);
    const cols = [col, '#ffffff', '#ffd24a'];
    FX.burst(innerWidth / 2, innerHeight / 2, cols, it0.r === 'mil' ? 36 : 90, it0.r === 'mil' ? 8 : 13);
    if (it0.r === 'cov' || it0.r === 'gold') { FX.shake(600); FX.rain(cols, 110); }
  }, 5300);
  setTimeout(() => {
    ov.remove();
    if (c.id < 0) { const v = Math.floor(IT(item.id).c * CAT.cfg.sell); return modal(`<div style="max-width:300px;margin:0 auto">${icard(item.id, { inst: item })}</div><div class="row" style="margin-top:16px;gap:10px"><button class="btn dark wide" onclick="modal();render(true)">Saqlash</button><button class="btn blue wide" onclick="A.sellOne('${item.uid}')">Sotish +${fmt(v)}${CO}</button></div>`), render(true); }
    go('result', { items: [item], cid: c.id });
  }, 6400);
}
VIEWS.result = async a => {
  const its = a.items, c = CAT.cases[a.cid], val = i => Math.floor(IT(i.id).c * CAT.cfg.sell), cost = c.price * its.length;
  const again = ME.coins < c.price * QTY ? `<button class="btn blue" style="flex:1" onclick="go('pay')">To‘ldirish</button>` : `<button class="btn blue" style="flex:1" onclick="A.again(${c.id})">Yana ochish ${fmt(c.price * QTY)}${CO} <small style="opacity:.8">+${QTY} XP</small></button>`;
  const share = `<button class="btn purple sq" aria-label="Ulashish" onclick="A.share(location.origin)">↗</button>`;
  if (its.length === 1) {
    const i = its[0], it = IT(i.id);
    return `<div class="rcard tilt pop gl-${it.r}" style="--rc:${CAT.R[it.r].c};margin-top:44px"><small>${esc(rname(it).toUpperCase())}${i.st ? ' · STATTRAK' : ''}</small><div>${art(it)}</div><h2>${esc(it.s)}</h2></div>
<div class="panel row" style="margin-top:12px;padding:14px 18px"><span class="mut">Narx</span><b>${fmt(it.c)}${CO} <small>$${it.usd}</small></b></div>${it.nw ? '' : flt(i.f)}
<div class="obar"><button class="btn dark" style="color:var(--b)" onclick="A.sellRes('${i.uid}')">Sotish ${fmt(val(i))}${CO}</button><div class="row" style="gap:8px">${again}${share}</div></div><div style="height:140px"></div>`;
  }
  return `<h3 style="margin-top:44px">Tushgan skinlar (${its.length})</h3><div class="grid2">${its.map(i => icard(i.id, { inst: i })).join('')}</div>
<div class="obar"><button class="btn dark" style="color:var(--b)" onclick="A.sellAllRes()">Hammasini sot ${fmt(its.reduce((a, i) => a + val(i), 0))}${CO}</button><div class="row" style="gap:8px">${again}${share}</div></div><div style="height:140px"></div>`;
};

/* ---------- O'yinlar ---------- */
VIEWS.games = async () => {
  const g = (v, t, p, bg, em, btn, bc) => `<button class="gcard" style="background:${bg}" onclick="go('${v}')"><h3>${t}</h3><p>${p}</p><span class="btn ${bc}">${btn}</span><span class="em">${em}</span></button>`;
  return `<h2 style="margin-top:6px;text-align:center;font-size:20px">O‘yinlar</h2>` +
    g('battles', 'Case Battles', 'Boshqa o‘yinchilarga qarshi omadingizni sinab ko‘ring', 'linear-gradient(120deg,#1a2a55,#6a4210)', '🏆', 'Jang', 'blue') +
    g('upgrade', 'Upgrade', 'Buyumlarni kamyob skinlarga yaxshilash imkoniyati bilan', 'linear-gradient(120deg,#10221a,#1a3a40)', '⬆️', 'Yaxshilash', 'green') +
    g('rush', 'Rush Mid', 'Skinlar uchun navbatma-navbat yutuq o‘yini: bilet oling', 'linear-gradient(120deg,#0c0c18,#3a1a5a)', '🎯', 'Midni rush qilish', 'red') +
    g('roulette', 'Rus ruletkasi', 'R8 barabani, omon qolgan bankni oladi', 'linear-gradient(120deg,#120808,#5a1208)', '🔫', 'O‘ynash', 'red') +
    g('contracts', 'Kontraktlar', 'Buyumlarni qimmatroqlariga almashtiring', 'linear-gradient(120deg,#16121e,#3a2a5a)', '📜', 'Almashtirish', 'dark') +
    g('shop', 'Do‘kon', 'Buyumlarni sotib oling', 'linear-gradient(120deg,#1a140a,#3a2a10)', '🛒', 'Ochish', 'dark');
};

/* ---------- Inventar ---------- */
VIEWS.inventory = async () => {
  const L = INV === 'inv' ? ME.inv.slice().sort((a, b) => IT(b.id).c - IT(a.id).c) : INV === 'sold' ? ME.sold : ME.out;
  const tabs = `<div class="tabs"><button class="${INV === 'inv' ? 'on' : ''}" onclick="A.inv('inv')">Mavjud</button><button class="${INV === 'sold' ? 'on' : ''}" onclick="A.inv('sold')">Sotilgan</button><button class="${INV === 'out' ? 'on' : ''}" onclick="A.inv('out')">Chiqarilgan</button></div>`;
  if (!L.length) return tabs + `<div style="text-align:center;padding:36px 10px"><b style="font-size:18px">Sizning inventaringiz bo‘sh</b><p class="mut">Skinlar keyslardan tushadi. Keys ochsang, shu yerda paydo bo‘ladi.</p><button class="btn blue sm" onclick="tab('cases')">Keyslarni ochish</button></div>`;
  const chip = i => INV === 'inv' ? '<span class="stc g">MAVJUD</span>' : INV === 'out' ? '<span class="stc g">CHIQARILGAN</span>' : `<span class="stc r">${i.tag === 'up' ? 'APGREYDDA' : 'SOTILGAN'}</span>`;
  const grid = `<div class="grid2">${L.map(i => icard(i.id, { inst: i, sel: SEL.has(i.uid), attr: INV === 'inv' ? `onclick="A.tap('${i.uid}')"` : '', mid: `<div style="margin-top:6px">${chip(i)}</div>`, price: INV === 'sold' ? `<span class="tag ok">${i.tag === 'up' ? fmt(IT(i.id).c) : '+' + fmt(i.price)}${CO}</span>${usdTag(IT(i.id))}` : undefined })).join('')}</div>`;
  let bar = '';
  if (INV === 'inv') bar = SELMODE ? `<div class="bbar"><button class="btn blue" onclick="A.sellSel()">Sotish (${SEL.size})</button><button class="btn dark" onclick="A.wd()">Steamga</button><button class="btn dark" onclick="A.tabSel(false)">Bekor</button></div>` : `<div class="bbar"><button class="btn blue" onclick="A.sellAll()">Hammasini sot</button><button class="btn dark" style="color:var(--b)" onclick="A.tabSel(true)">Tanlash</button></div>`;
  return tabs + grid + bar + '<div style="height:70px"></div>';
};

VIEWS.upgrade = async () => {
  const sel = ME.inv.filter(i => UP.sel.has(i.uid)), V = sel.reduce((a, i) => a + IT(i.id).c, 0);
  const tg2 = V ? CAT.items.filter(x => !x.nw && x.c > V && V / x.c * .92 >= .01 && V / x.c * .92 <= .9).sort((a, b) => a.c - b.c).slice(0, 40) : [];
  const t = UP.t != null ? IT(UP.t) : null, ch = t && V ? V / t.c * .92 : 0, ok = t && V && ch >= .01 && ch <= .9;
  return `<h2 style="margin-top:44px">Upgrade</h2><p class="mut">1) o‘z skinlaringizni tanlang (10 tagacha), 2) maqsadni tanlang. Natija serverda halol hisoblanadi.</p>
<div class="panel"><div class="row"><span>Tanlangan qiymat</span><b>${fmt(V)}${CO}</b></div><div class="row"><span>Imkoniyat</span><b>${ok ? (ch * 100).toFixed(1) + '%' : '—'}</b></div><div class="bar"><i style="width:${ok ? ch * 100 : 0}%;background:var(--g)"></i></div></div>
<button class="btn green wide" ${ok ? '' : 'disabled'} onclick="A.upgrade()">Upgrade qilish</button>
<h3 style="margin-top:18px">Sizning skinlaringiz</h3>${ME.inv.length ? `<div class="grid2">${ME.inv.map(i => icard(i.id, { inst: i, sel: UP.sel.has(i.uid), attr: `onclick="A.upSel('${i.uid}')"` })).join('')}</div>` : '<p class="empty">Inventar bo‘sh — avval keys oching.</p>'}
<h3 style="margin-top:18px">Maqsad</h3>${V ? (tg2.length ? `<div class="grid2">${tg2.map(x => icard(x.id, { sel: UP.t === x.id, attr: `onclick="A.upT(${x.id})"`, price: `<span class="tag">${fmt(x.c)}${CO}</span><span class="tag ok">${(V / x.c * 92).toFixed(1)}%</span>` })).join('')}</div>` : '<p class="empty">Bu qiymat uchun mos maqsad yo‘q.</p>') : '<p class="empty">Avval skin tanlang.</p>'}`;
};
VIEWS.contracts = async () => {
  const L = ME.inv.filter(i => !['cov', 'gold'].includes(IT(i.id).r));
  return `<h2 style="margin-top:44px">Kontraktlar</h2><p class="mut">10 ta bir xil noyoblikdagi skinni bitta keyingi noyoblikdagi skinga almashtiring.</p><button class="btn blue wide" ${CT.size === 10 ? '' : 'disabled'} onclick="A.contract()">Almashtirish (${CT.size}/10)</button>
${L.length ? `<div class="grid2" style="margin-top:12px">${L.map(i => icard(i.id, { inst: i, sel: CT.has(i.uid), attr: `onclick="A.ctSel('${i.uid}')"` })).join('')}</div>` : '<p class="empty">Mil-Spec, Restricted yoki Classified skinlar kerak.</p>'}`;
};
VIEWS.shop = async () => `<h2 style="margin-top:44px">Do‘kon</h2><div class="grid2">${CAT.items.slice().sort((a, b) => a.c - b.c).map(x => icard(x.id, { price: `<button class="tag" style="background:var(--b)" onclick="A.buy(${x.id})">${fmt(Math.ceil(x.c * CAT.cfg.shopMul))}${CO}</button>` })).join('')}</div>`;
VIEWS.rush = async () => { const r = await api('raffles'); return `<h2 style="margin-top:44px">Rush Mid</h2><p class="mut">Bilet oling — g‘olib vaqt tugaganda tasodifiy tanlanadi. Ko‘p bilet = ko‘p imkoniyat (maks 50).</p><div style="display:grid;gap:14px">${r.raffles.filter(x => x.kind === 'rush').map(pcard).join('')}</div><h3 style="margin-top:20px">So‘nggi g‘oliblar</h3>${r.done.map(x => `<div class="lr"><span>${esc(IT(x.item).w)} | ${esc(IT(x.item).s)}</span><b>${esc(x.win || '—')}</b></div>`).join('') || '<p class="empty">Hali yo‘q</p>'}`; };
VIEWS.battles = async () => {
  const r = await api('battles'), c = CAT.cases[BCASE];
  return `<h2 style="margin-top:44px">Case Battles</h2><p class="mut">Ikki o‘yinchi bir xil keys ochadi — qimmatroq skin tushgan hammasini oladi.</p>
<div class="chips">${CAT.cases.filter(x => !x.off).map(x => `<button class="chip ${x.id === BCASE ? 'on' : ''}" onclick="A.bcase(${x.id})">${esc(x.name)}</button>`).join('')}</div>
<div class="panel row"><div class="case" style="--c1:${c.c1};--c2:${c.c2};width:90px;padding:4px;border-radius:18px;aspect-ratio:auto">${chest(c.c1, c.c2)}</div><div style="flex:1"><b style="font-size:20px">${esc(c.name)}</b><br><span class="tag">${fmt(c.price)}${CO}</span></div></div>
<div class="row" style="gap:10px"><button class="btn blue wide" onclick="A.battle(true)">Bot bilan</button><button class="btn dark wide" onclick="A.battle(false)">Lobbi yaratish</button></div>
<h3 style="margin-top:16px">Ochiq lobbilar</h3>${r.open.map(b => `<div class="lr"><span>${esc(CAT.cases[b.cid].name)} · ${fmt(CAT.cases[b.cid].price)}${CO} · ${esc(b.by)}</span>${b.mine ? '<span class="mut">sizniki</span>' : `<button class="btn sm blue" onclick="A.joinB(${b.id})">Qo‘shilish</button>`}</div>`).join('') || '<p class="empty">Ochiq lobbi yo‘q</p>'}
<h3 style="margin-top:16px">So‘nggi janglar</h3>${r.done.map(b => `<div class="lr"><span>${esc(b.an)} <b class="${b.winA ? 'ok' : ''}">${fmt(IT(b.a).c)}</b> : <b class="${b.winA ? '' : 'ok'}">${fmt(IT(b.b).c)}</b> ${esc(b.bn)}</span><small>${esc(CAT.cases[b.cid].name)}</small></div>`).join('') || '<p class="empty">Hali yo‘q</p>'}`;
};
VIEWS.roulette = async () => {
  const g = ME.rr, drum = `<div class="drum">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${g && i <= g.pulls ? 'ok' : ''}"></i>`).join('')}</div>`;
  return `<h2 style="margin-top:44px">Rus ruletkasi</h2><p class="mut">Barabanda 6 ta uya, bittasida o‘q. Har bir omon qolgan tortish bankni oshiradi. Xohlagan payt pulni oling. Maks 5 tortish.</p>${drum}
${g ? `<div class="panel"><div class="row"><span>Stavka</span><b>${fmt(g.bet)}${CO}</b></div><div class="row"><span>Joriy bank</span><b class="ok">${fmt(g.pot)}${CO}</b></div></div><button class="btn red wide" onclick="A.pull()">Tortish 🔫</button><button class="btn green wide" ${g.pulls ? '' : 'disabled'} onclick="A.cash()">Pulni olish +${fmt(g.pot)}${CO}</button>`
    : `<div class="panel"><input id="bet" type="number" inputmode="numeric" min="100" max="${CAT.cfg.rrMax}" value="500" aria-label="Stavka"><div class="chips">${[100, 500, 1000, 5000, 10000].map(n => `<button class="chip" onclick="$('#bet').value=${n}">${sh(n)}</button>`).join('')}</div></div><button class="btn red wide" onclick="A.rrStart()">Boshlash</button>`}`;
};
VIEWS.profile = async () => { const m = ME; return `<div class="panel" style="margin-top:44px"><h3 style="font-size:26px">${esc(m.name)}</h3><span class="mut">${m.un ? '@' + esc(m.un) + ' · ' : ''}ID ${m.id}</span><div class="row" style="margin-top:12px"><span class="lvl">LVL ${m.lvl}</span><b>${fmt(m.coins)}${CO}</b></div></div>
<div class="panel"><div class="lr"><span>Ochilgan keyslar</span><b>${fmt(m.opens)}</b></div><div class="lr"><span>Sarflangan tanga</span><b>${fmt(m.spent)}</b></div><div class="lr"><span>Sotib olingan tanga</span><b>${fmt(m.bought)}</b></div><div class="lr"><span>Inventardagi skinlar</span><b>${m.inv.length}</b></div><div class="lr"><span>Inventar qiymati</span><b>${fmt(m.inv.reduce((a, i) => a + IT(i.id).c, 0))}${CO}</b></div><div class="lr"><span>Takliflar</span><b>${m.refs}</b></div></div>`; };
VIEWS.friends = async () => {
  const f = await api('friends'), m = ME, link = f.link;
  return `<h2 style="margin-top:44px">Do‘stlar</h2><div class="panel"><p>Har bir do‘st uchun <b>${fmt(CAT.cfg.refBonus)}</b>${CO} va ularning to‘ldirishidan <b>${CAT.cfg.refPct}%</b>. 10-chi do‘st uchun +4 000${CO}.</p><div class="row"><span>Takliflar</span><b>${m.refs}</b></div><div class="row"><span>Topilgan</span><b>${fmt(m.refEarn)}${CO}</b></div>${link ? `<input readonly value="${esc(link)}" onclick="this.select()"><div class="row" style="gap:10px"><button class="btn blue wide" onclick="A.share('${esc(link)}')">Ulashish</button><button class="btn dark wide" onclick="A.copy('${esc(link)}')">Nusxa</button></div>` : '<p class="mut">Havola uchun serverda BOT_USERNAME ni sozlang.</p>'}</div>
<h3>Top taklifchilar</h3>${f.top.map((x, i) => `<div class="lr"><span>${i + 1}. ${esc(x.n)} ${i < 5 ? '🔪' : ''}</span><b>${x.r}</b></div>`).join('') || '<p class="empty">Hali yo‘q</p>'}`;
};
VIEWS.settings = async () => {
  const f = await api('fair');
  return `<h2 style="margin-top:44px">Sozlamalar</h2><div class="panel"><b>Steam trade URL</b><input id="turl" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…" value="${esc(ME.tradeUrl)}"><button class="btn blue wide" onclick="A.saveUrl()">Saqlash</button></div>
<div class="panel"><b>Ovoz va bildirishnomalar</b><div class="row" style="margin:12px 0"><span>Ovozlar</span><button class="btn sm ${SFX.on ? 'green' : 'dark'}" onclick="A.sfx()">${SFX.on ? 'Yoqiq' : 'O‘chiq'}</button></div><div class="row"><span>Bot xabarlari</span><button class="btn sm ${ME.mute ? 'dark' : 'green'}" onclick="A.notif()">${ME.mute ? 'O‘chiq' : 'Yoqiq'}</button></div></div>
<div class="panel"><b>Promo kod</b><input id="promo" placeholder="KOD" autocapitalize="characters"><button class="btn blue wide" onclick="A.promo()">Faollashtirish</button></div>
<div class="panel"><b>Halol o‘yin (provably fair)</b><p class="mut" style="word-break:break-all">Server seed hash:<br>${f.hash}</p><div class="row"><span>Client seed</span><b>${esc(f.client)}</b></div><div class="row"><span>Nonce</span><b>${f.nonce}</b></div><input id="cs" maxlength="32" placeholder="Yangi client seed (ixtiyoriy)"><button class="btn dark wide" onclick="A.rotate()">Seedni almashtirish va eskisini ochish</button><p class="mut">Natija = HMAC-SHA256(serverSeed, clientSeed:nonce). Seedni almashtirsangiz, eski seed ochiladi va o‘tgan natijalarni tekshirish mumkin.</p></div>`;
};
VIEWS.wiki = async () => {
  const rs = ['all', ...Object.keys(CAT.R)], L = CAT.items.filter(x => WIKI === 'all' || x.r === WIKI).sort((a, b) => b.c - a.c);
  return `<h2 style="margin-top:44px">Skinlar vikisi</h2><div class="chips">${rs.map(r => `<button class="chip ${WIKI === r ? 'on' : ''}" onclick="A.wiki('${r}')">${r === 'all' ? 'Hammasi' : CAT.R[r].n}</button>`).join('')}</div><div class="grid2">${L.map(x => icard(x.id)).join('')}</div>`;
};
VIEWS.pay = async () => {
  const p = await api('pay/info'), st = { new: 'Kutilmoqda', review: 'Tekshiruvda', paid: 'Tasdiqlangan', rejected: 'Rad etilgan' };
  return `<h2 style="margin-top:44px">Tanga sotib olish</h2>${p.packages.map(k => `<button class="task" style="width:100%" onclick="A.order('${k.id}')"><b>${fmt(k.coins)}${CO}</b><span class="pbtn">${fmt(k.uzs)} so‘m</span></button>`).join('')}
<p class="mut">${esc(p.note)}</p><h3 style="margin-top:18px">Buyurtmalarim</h3>${p.orders.map(o => `<div class="lr"><span>#${o.id} · ${fmt(o.coins)}${CO} · ${fmt(o.uzs)} so‘m</span>${o.st === 'new' ? `<button class="btn sm blue" onclick="A.submitPay(${o.id})">Chek yuborish</button>` : `<b class="${o.st === 'paid' ? 'ok' : o.st === 'rejected' ? 'bad' : ''}">${st[o.st]}</b>`}</div>`).join('') || '<p class="empty">Hali yo‘q</p>'}`;
};

/* ---------- Amallar ---------- */
const A = {
  go, back, dt: v => { DT = v; render(true); }, sort: v => { SORT = v; render(true); }, pdir: () => { PDIR = -PDIR; SORT = 'price'; render(true); }, inv: v => { INV = v; SELMODE = false; SEL.clear(); render(); }, wiki: v => { WIKI = v; render(true); }, tall: () => { TALL = !TALL; render(true); },
  qty: n => { QTY = n; render(true); }, bcase: i => { BCASE = i; render(true); },
  club: () => modal('<h3>🔒 SkinHub yopiq klubi</h3><p class="mut">Har hafta keshbek, kunlik vazifalar va pichoq lotereyasida qatnashish. Tez orada ishga tushadi.</p><button class="btn wide" onclick="modal()">Yopish</button>'),
  rules: k => modal(k === 'rush' ? '<h3>Rush Mid qoidalari</h3><p>Kirish narxini to‘lab bilet oling. Vaqt tugaganda server bitta g‘olibni tasodifiy tanlaydi: ko‘proq bilet — ko‘proq imkoniyat (bir o‘yinda maksimal 50 bilet). G‘olib skinni oladi.</p><button class="btn wide" onclick="modal()">Tushunarli</button>' : '<h3>Qurollanish poygasi</h3><p>Ko‘rsatilgan keysni vaqt tugaguncha eng ko‘p ochgan o‘yinchi skinni yutadi. Teng bo‘lsa, avval yetib olgan yutadi.</p><button class="btn wide" onclick="modal()">Tushunarli</button>'),
  freeInfo: () => modal('<h3>Bepul keys</h3><p class="mut">Har 24 soatda bitta bepul keys. Tushgan skinni inventarda ko‘rasiz.</p><button class="btn wide" onclick="modal()">Yopish</button>'),
  daily: () => T(async () => { const r = await api('task/daily', {}); toast(`+${r.reward} tanga`); render(true); }),
  tagTask: k => modal(`<h3>${k === 'name' ? 'Familiyada bot nomi' : 'Bio’da bot nomi'}</h3><p>${k === 'name' ? `Telegram → Sozlamalar → Profilni tahrirlash → <b>Familiya</b> maydoniga <b>@${esc(CAT.cfg.bot || 'bot_username')}</b> yozing.` : `Telegram → Sozlamalar → Profilni tahrirlash → <b>Bio</b> maydoniga <b>@${esc(CAT.cfg.bot || 'bot_username')}</b> yozing.`}</p><p class="mut">Har kuni avtomatik tekshiriladi va kunlik mukofot o‘zi beriladi. Bot nomini olib tashlasangiz, kunlar 0 dan boshlanadi. Avval botga /start yuborgan bo‘lishingiz kerak.</p><button class="btn blue wide" onclick="A.tagGo('${k}')">Tekshirish va boshlash</button>`),
  tagGo: k => T(async () => { const r = await api('task/' + k, {}); modal(); toast(`Faollashdi! +${r.reward} tanga`); render(true); }),
  sfx: () => { SFX.set(!SFX.on); render(true); },
  notif: () => T(async () => { await api('settings/notify', { on: ME.mute }); render(true); }),
  promo: () => T(async () => { const r = await api('promo', { code: $('#promo').value }); toast(`+${fmt(r.reward)} tanga`); $('#promo').value = ''; render(true); }),
  chTask: () => T(async () => { const r = await api('task/channel', {}); toast(`+${r.reward} tanga`); render(true); }),
  steamModal: () => modal(`<h3>Steam hisobni ulang</h3><p class="mut">Steam → Inventar → Trade Offers → “Who can send me trade offers?” dagi havolani kiriting.</p><input id="turl" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"><button class="btn blue wide" onclick="A.saveUrl()">Ulash</button>`),
  saveUrl: () => T(async () => { const r = await api('task/steam', { url: $('#turl').value }); toast(r.reward ? `Ulandi! +${r.reward} tanga` : 'Saqlandi'); modal(); render(true); }),
  free: () => T(async () => { const r = await api('free/open', {}); const f = CAT.items.filter(i => i.usd <= .6 && !i.nw); const c = { id: -1, e: f.map(i => ({ id: i.id, p: 1 / f.length })) }; reel(c, r.items[0]); }),
  open: id => T(async () => { const r = await api('case/open', { id, n: QTY }); if (r.items.length === 1) reel(CAT.cases[id], r.items[0]); else go('result', { items: r.items, cid: id }); }),
  again: id => { const s = stack.pop(); if (s) { view = s[0]; arg = s[1]; } A.open(id); },
  sellRes: uid => T(async () => { const i = ME.inv.find(x => x.uid === uid); if (!i) return; const v = Math.floor(IT(i.id).c * CAT.cfg.sell); if (!(await ask(`${IT(i.id).w}ni ${fmt(v)}ga sotmoqchimisan?`))) return; await api('sell', { uids: [uid] }); toast(`+${fmt(v)} tanga`); back(); }),
  sellAllRes: () => T(async () => { const its = arg.items.filter(x => ME.inv.some(y => y.uid === x.uid)); if (!its.length) return; if (!(await ask(`${its.length} ta skin sotilsinmi?`))) return; const r = await api('sell', { uids: its.map(x => x.uid) }); toast(`+${fmt(r.sum)} tanga`); back(); }),
  sellOne: uid => T(async () => { const r = await api('sell', { uids: [uid] }); modal(); toast(`+${fmt(r.sum)} tanga`); render(true); }),
  tap: uid => { if (SELMODE) { SEL.has(uid) ? SEL.delete(uid) : SEL.add(uid); render(true); } else { const i = ME.inv.find(x => x.uid === uid); if (i) modal(`<div style="max-width:300px;margin:0 auto">${icard(i.id, { inst: i })}</div>${IT(i.id).nw ? '' : flt(i.f)}<div class="row" style="margin-top:16px;gap:10px"><button class="btn blue wide" onclick="A.sellOne('${uid}')">Sotish +${fmt(Math.floor(IT(i.id).c * CAT.cfg.sell))}${CO}</button><button class="btn dark wide" onclick="A.wd('${uid}')">Steamga</button></div>`); } },
  tabSel: v => { SELMODE = v; SEL.clear(); render(true); },
  sellSel: () => T(async () => { if (!SEL.size) return toast('Skin tanlang', 1); const r = await api('sell', { uids: [...SEL] }); SEL.clear(); SELMODE = false; toast(`+${fmt(r.sum)} tanga`); render(true); }),
  sellAll: async () => { if (!ME.inv.length) return toast('Inventar bo‘sh', 1); if (await ask('Barcha skinlar sotilsinmi?')) T(async () => { const r = await api('sell', { all: true }); toast(`${r.count} ta skin sotildi: +${fmt(r.sum)}`); render(true); }); },
  wd: uid => T(async () => { const u = uid ? [uid] : [...SEL]; if (!u.length) return toast('Skin tanlang', 1); const r = await api('withdraw', { uids: u }); modal(); toast(r.message); render(true); }),
  upSel: uid => { UP.sel.has(uid) ? UP.sel.delete(uid) : UP.sel.size < 10 && UP.sel.add(uid); UP.t = null; render(true); }, upT: id => { UP.t = id; render(true); },
  upgrade: () => T(async () => { const r = await api('upgrade', { uids: [...UP.sel], target: UP.t }); UP = { sel: new Set(), t: null }; if (r.win) { SFX.win('cov'); FX.burst(innerWidth / 2, innerHeight / 2, ['#22c55e', '#fff', '#ffd24a'], 80, 12); } else SFX.lose(); modal(r.win ? `<h3 class="ok">Muvaffaqiyat! 🎉</h3><div style="max-width:300px;margin:0 auto">${icard(r.item.id, { inst: r.item })}</div><p class="mut">Imkoniyat ${(r.chance * 100).toFixed(1)}%, tushgan raqam ${(r.roll * 100).toFixed(1)}</p><button class="btn wide" onclick="modal()">Yaxshi</button>` : `<h3 class="bad">Omad kelmadi</h3><p class="mut">Imkoniyat ${(r.chance * 100).toFixed(1)}%, tushgan raqam ${(r.roll * 100).toFixed(1)}</p><button class="btn wide" onclick="modal()">Yopish</button>`); render(true); }),
  ctSel: uid => { if (CT.has(uid)) CT.delete(uid); else { const f = ME.inv.find(i => CT.has(i.uid)), n = ME.inv.find(i => i.uid === uid); if (f && IT(f.id).r !== IT(n.id).r) return toast('Faqat bir xil noyoblik', 1); CT.size < 10 && CT.add(uid); } render(true); },
  contract: () => T(async () => { const r = await api('contract', { uids: [...CT] }); CT.clear(); modal(`<h3>Kontrakt natijasi</h3><div style="max-width:300px;margin:0 auto">${icard(r.item.id, { inst: r.item })}</div><button class="btn wide" style="margin-top:14px" onclick="modal()">Yaxshi</button>`); render(true); }),
  buy: id => T(async () => { if (!(await ask(`${IT(id).w} | ${IT(id).s} sotib olinsinmi?`))) return; await api('shop/buy', { id }); toast('Sotib olindi'); }),
  join: (id, n) => T(async () => { await api('raffle/join', { id, n }); toast('Bilet olindi'); render(true); }),
  battle: bot => T(async () => { const r = await api('battle/create', { cid: BCASE, bot }); if (r.result) showDuel(r.result); else toast('Lobbi yaratildi'); render(true); }),
  joinB: id => T(async () => { const r = await api('battle/join', { id }); showDuel(r.result); render(true); }),
  rrStart: () => T(async () => { await api('roulette', { a: 'start', bet: +$('#bet').value }); render(true); }),
  pull: () => T(async () => { const r = await api('roulette', { a: 'pull' }); if (r.dead) { SFX.boom(); FX.shake(500); toast(`💥 O‘q chiqdi! −${fmt(r.lost)} tanga`, 1); } else if (r.done) toast(`Omon qoldingiz! +${fmt(r.pot)} tanga`); render(true); }),
  cash: () => T(async () => { const r = await api('roulette', { a: 'cash' }); toast(`+${fmt(r.cash)} tanga`); render(true); }),
  order: id => T(async () => { const r = await api('pay/order', { pkg: id }); const p = await api('pay/info'); A.payInfo(r.order, p, r.payUrl); }),
  payInfo: (o, p, url) => modal(`<h3>#${o.id} · ${fmt(o.coins)}${CO}</h3><p>Summa: <b>${fmt(o.uzs)} so‘m</b></p><p>Karta: <b>${esc(p.card)}</b><br>${esc(p.holder)}</p><button class="btn dark wide" onclick="A.copy('${esc(p.card)}')">Karta raqamini nusxalash</button>${url ? `<a class="btn blue wide" style="display:block;text-decoration:none;margin-top:8px" href="${esc(url)}" target="_blank">To‘lash</a>` : ''}<input id="pref" placeholder="Chek raqami yoki karta oxirgi 4 raqami"><button class="btn blue wide" onclick="A.sendPay(${o.id})">Yuborish</button><p class="mut">${esc(p.note)}</p>`),
  submitPay: id => T(async () => { const p = await api('pay/info'); A.payInfo(p.orders.find(o => o.id === id), p, ''); }),
  sendPay: id => T(async () => { await api('pay/submit', { id, ref: $('#pref').value }); modal(); toast('Yuborildi. Admin tez orada tasdiqlaydi'); render(true); }),
  copy: t => { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Nusxalandi'), () => toast(t)); },
  share: l => { const u = 'https://t.me/share/url?url=' + encodeURIComponent(l) + '&text=' + encodeURIComponent('SkinHub CS2 — keyslar oching va skinlar yuting!'); tg ? tg.openTelegramLink(u) : window.open(u); },
  rotate: () => T(async () => { const r = await api('fair/rotate', { client: ($('#cs') || {}).value || '' }); modal(`<h3>Eski seed ochildi</h3><p style="word-break:break-all"><b>Server seed:</b><br>${r.revealed.seed}</p><p>Client: ${esc(r.revealed.client)}<br>Oxirgi nonce: ${r.revealed.nonce}</p><button class="btn wide" onclick="modal()">Yopish</button>`); render(true); })
};
function showDuel(r) {
  if (r.win) { SFX.win('cla'); FX.burst(innerWidth / 2, innerHeight / 2, ['#22c55e', '#fff', '#ffd24a'], 70, 12); } else SFX.lose();
  modal(`<h3 class="${r.win ? 'ok' : 'bad'}">${r.win ? 'Siz yutdingiz! 🏆' : 'Yutqazdingiz'}</h3><div class="grid2"><div><small>Siz</small>${icard(r.mine)}</div><div><small>${r.bot ? 'Bot' : 'Raqib'}</small>${icard(r.opp)}</div></div><button class="btn wide" style="margin-top:14px" onclick="modal()">Yaxshi</button>`);
}
window.A = A; window.go = go; window.modal = modal; window.tab = tab;

/* ---------- Boshlash ---------- */
(async () => {
  $('#app').innerHTML = SK();
  try { CAT = await (await fetch(BASE + '/api/catalog')).json(); await api('me'); render(); }
  catch (e) { $('#app').innerHTML = `<p class="empty">${esc(e.message)}<br><br>Ilovani Telegram orqali oching.</p>`; }
})();
