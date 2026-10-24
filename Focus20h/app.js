'use strict';
/* Focus 20h : appli de suivi, données stockées uniquement sur l'appareil.
   - Données (texte) : localStorage
   - Photos : IndexedDB (compressées en JPEG) */

const D = window.F20_DATA;
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const FORMATS = D.formats, FMT = byId(D.formats);
const PLATFORMS = D.platforms, PLT = byId(D.platforms);
const STAGES = D.stages, STG = byId(D.stages);
const THEMES = D.themes, THM = byId(D.themes);
const MOODS = D.moods;
const STAT_LABEL = { views: 'Vues', likes: 'J’aime', shares: 'Partages', follows: 'Abonnés gagnés' };

/* ---------- Outils ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const fmtDate = (k, opts = { day: 'numeric', month: 'short' }) => parseD(k).toLocaleDateString('fr-FR', opts);
const fmtNum = (n) => (n == null ? '–' : Math.round(n).toLocaleString('fr-FR'));
const hashStr = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const pickDaily = (arr, salt = '') => arr[hashStr(dkey() + salt) % arr.length];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const plural = (n, one, many) => `${fmtNum(n)} ${n > 1 ? many : one}`;

function fmtTime(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* ---------- Stockage ---------- */
const KEY = 'focus20h:v1';
const UI_KEY = 'focus20h:ui';

function defaultState() {
  const now = dkey();
  return {
    version: 1,
    createdAt: now,
    profile: { why: D.seed.why, success: [...D.seed.success] },
    settings: { theme: 'dark', lastExport: null },
    contents: [{
      id: uid(), title: 'Citation discipline (photo + son)', format: 'citation', platforms: ['tiktok'], stage: 'publiee',
      hook: '', script: '', notes: 'Ma meilleure vidéo pour l’instant : une photo avec une citation motivation / discipline et un fond sonore.',
      phaseId: null, createdAt: now, publishedAt: now, stats: { tiktok: { views: 1000, likes: 100 } }, images: [],
    }],
    myQuotes: [],
    favQuotes: [],
    phases: [],
    journal: [],
    habits: D.defaultHabits.map((h) => ({ ...h })),
    habitLog: {},
    perfs: [],
    customExercises: [],
    wins: D.seed.wins.map((w) => ({ id: uid(), date: now, ...w })),
    milestones: {},
    intentions: [],
    goals: D.defaultGoals.map((g) => ({ id: uid(), current: 0, doneAt: null, ...g })),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn(e); }
  return defaultState();
}
function normalize(s) {
  const d = defaultState();
  const out = { ...d, ...s };
  out.settings = { ...d.settings, ...(s.settings || {}) };
  out.profile = { ...d.profile, ...(s.profile || {}) };
  for (const k of ['contents', 'myQuotes', 'favQuotes', 'phases', 'journal', 'habits', 'perfs', 'customExercises', 'wins', 'intentions', 'goals']) {
    if (!Array.isArray(out[k])) out[k] = d[k];
  }
  for (const k of ['habitLog', 'milestones']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
  return out;
}

let S = load();
let saveFailed = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; }
  catch (e) { if (!saveFailed) toast('⚠️ Stockage plein : exporte tes données et supprime quelques photos.'); saveFailed = true; }
}
function commit() { checkMilestones(); save(); render(); }

const UI = (() => {
  const d = { route: 'home', sub: { contenus: 'videos', tests: 'phases', moi: 'journal', semaine: 'semaine' }, quoteType: 'citation', favOnly: false, plat: 'all', perfEx: null, weekOffset: 0, genTheme: 'all', genFormat: 'all' };
  try { return { ...d, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}'), weekOffset: 0 }; } catch { return d; }
})();
const saveUI = () => { try { localStorage.setItem(UI_KEY, JSON.stringify(UI)); } catch {} };

/* Photos dans IndexedDB (data URL JPEG) */
const IMG = (() => {
  let dbp = null;
  const cache = new Map();
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('focus20h', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('images');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('images', mode);
      const req = fn(t.objectStore('images'));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    async put(id, data) { cache.set(id, data); await run('readwrite', (s) => s.put(data, id)); },
    async get(id) { if (cache.has(id)) return cache.get(id); const v = await run('readonly', (s) => s.get(id)); if (v) cache.set(id, v); return v; },
    async del(id) { cache.delete(id); await run('readwrite', (s) => s.delete(id)); },
    async clear() { cache.clear(); await run('readwrite', (s) => s.clear()); },
    async all() {
      const db = await open();
      return new Promise((res, rej) => {
        const out = {};
        const req = db.transaction('images').objectStore('images').openCursor();
        req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
        req.onerror = () => rej(req.error);
      });
    },
  };
})();

async function compressImage(file, max = 1400, quality = 0.8) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}
function hydrateImages(root = document) {
  $$('img[data-img]', root).forEach(async (el) => {
    const v = await IMG.get(el.dataset.img).catch(() => null);
    if (v) el.src = v; else el.closest('.thumb')?.classList.add('missing');
  });
}
const thumbsHtml = (ids, removable) => ids.map((id) => `
  <div class="thumb"><img data-img="${esc(id)}" alt="" data-act="viewImg" data-id="${esc(id)}">
  ${removable ? `<button type="button" class="x" data-act="removeImg" data-id="${esc(id)}" aria-label="Retirer">✕</button>` : ''}</div>`).join('');

/* ---------- Calculs ---------- */
const published = () => S.contents.filter((c) => c.stage === 'publiee');
const activePhase = () => S.phases.find((p) => !p.endedAt) || null;
function statOf(c, key, plat = 'all') {
  const list = plat === 'all' ? PLATFORMS.map((p) => p.id) : [plat];
  let total = 0, has = false;
  for (const p of list) {
    const v = c.stats?.[p]?.[key];
    if (v !== undefined && v !== null && v !== '') { total += Number(v); has = true; }
  }
  return has ? total : null;
}
const viewsOf = (c, plat) => statOf(c, 'views', plat);
function withViews(plat = 'all') {
  return published().filter((c) => viewsOf(c, plat) !== null && (plat === 'all' || c.platforms.includes(plat) || c.stats?.[plat]));
}
function groupAvg(items, keyFn, plat) {
  const g = {};
  for (const c of items) {
    const k = keyFn(c); const v = viewsOf(c, plat);
    (g[k] ||= { key: k, n: 0, total: 0, best: 0 });
    g[k].n++; g[k].total += v; g[k].best = Math.max(g[k].best, v);
  }
  return Object.values(g).map((x) => ({ ...x, avg: x.total / x.n })).sort((a, b) => b.avg - a.avg);
}
const formatStats = (plat = 'all') => groupAvg(withViews(plat), (c) => c.format, plat);
function platformStats() {
  return PLATFORMS.map((p) => {
    const items = published().filter((c) => viewsOf(c, p.id) !== null);
    const total = items.reduce((a, c) => a + viewsOf(c, p.id), 0);
    return { key: p.id, n: items.length, total, avg: items.length ? total / items.length : 0 };
  }).filter((x) => x.n);
}
const testedFormats = () => new Set(published().map((c) => c.format));
const usedPlatforms = () => new Set(published().flatMap((c) => c.platforms));
const phaseVideos = (p) => S.contents.filter((c) => c.phaseId === p.id);
const phasePublished = (p) => phaseVideos(p).filter((c) => c.stage === 'publiee');
function phaseAvg(p) {
  const v = phasePublished(p).map((c) => viewsOf(c)).filter((x) => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function goalProgress(g) {
  switch (g.auto) {
    case 'formats': return testedFormats().size;
    case 'platforms': return usedPlatforms().size;
    case 'phases': return S.phases.filter((p) => p.endedAt).length;
    case 'published': return published().length;
    case 'journal': return S.journal.length;
    default: return g.current || 0;
  }
}
function allExercises() { return [...D.exercises, ...S.customExercises]; }
const exById = (id) => allExercises().find((e) => e.id === id);
function fmtPerf(ex, v) {
  if (!ex) return String(v);
  if (ex.type === 'time') return fmtTime(v);
  const unit = D.exerciseTypes.find((t) => t.id === ex.type)?.unit || '';
  return `${String(Math.round(v * 10) / 10).replace('.', ',')} ${unit}`.trim();
}
const isBetter = (ex, a, b) => (ex.type === 'time' ? a < b : a > b);
function allQuotes() {
  return [
    ...D.quotes.map((q, i) => ({ ...q, id: 'b' + i })),
    ...S.myQuotes.map((q) => ({ ...q, mine: true })),
  ];
}

/* ---------- Victoires automatiques ---------- */
const maxStat = (key) => Math.max(0, ...published().map((c) => statOf(c, key) || 0));
const MILESTONES = [
  { id: 'idea1', icon: '💡', text: 'Première idée notée', test: () => S.contents.length >= 1 },
  { id: 'pub1', icon: '✅', text: 'Première vidéo publiée', test: () => published().length >= 1 },
  { id: 'pub10', icon: '🎬', text: '10 vidéos publiées', test: () => published().length >= 10 },
  { id: 'pub25', icon: '🎬', text: '25 vidéos publiées', test: () => published().length >= 25 },
  { id: 'pub50', icon: '🎞️', text: '50 vidéos publiées', test: () => published().length >= 50 },
  { id: 'pub100', icon: '🏅', text: '100 vidéos publiées', test: () => published().length >= 100 },
  { id: 'v100', icon: '👀', text: 'Une vidéo à 100 vues', test: () => maxStat('views') >= 100 },
  { id: 'v1000', icon: '🔥', text: 'Une vidéo à 1 000 vues', test: () => maxStat('views') >= 1000 },
  { id: 'v10000', icon: '🚀', text: 'Une vidéo à 10 000 vues', test: () => maxStat('views') >= 10000 },
  { id: 'v100000', icon: '🌍', text: 'Une vidéo à 100 000 vues', test: () => maxStat('views') >= 100000 },
  { id: 'l100', icon: '❤️', text: 'Une vidéo à 100 j’aime', test: () => maxStat('likes') >= 100 },
  { id: 'l1000', icon: '💚', text: 'Une vidéo à 1 000 j’aime', test: () => maxStat('likes') >= 1000 },
  { id: 'f3', icon: '🧪', text: '3 formats testés', test: () => testedFormats().size >= 3 },
  { id: 'f5', icon: '🧬', text: '5 formats testés', test: () => testedFormats().size >= 5 },
  { id: 'plat2', icon: '📱', text: 'Publié sur 2 plateformes', test: () => usedPlatforms().size >= 2 },
  { id: 'phase1', icon: '🧪', text: 'Première phase de test terminée', test: () => S.phases.some((p) => p.endedAt) },
  { id: 'phase3', icon: '🔬', text: '3 phases de test terminées', test: () => S.phases.filter((p) => p.endedAt).length >= 3 },
  { id: 'j7', icon: '📝', text: '7 pages de journal', test: () => S.journal.length >= 7 },
  { id: 'j30', icon: '📔', text: '30 pages de journal', test: () => S.journal.length >= 30 },
  { id: 'perf1', icon: '⏱️', text: 'Première performance notée', test: () => S.perfs.length >= 1 },
];
let milestonesReady = false;
function checkMilestones() {
  const today = dkey();
  const fresh = [];
  for (const m of MILESTONES) {
    if (!S.milestones[m.id] && m.test()) { S.milestones[m.id] = today; fresh.push(m); }
  }
  for (const g of S.goals) {
    if (!g.doneAt && goalProgress(g) >= g.target) { g.doneAt = today; fresh.push({ icon: '🎯', text: `Objectif atteint : ${g.text}` }); }
  }
  // Pas de toast au premier lancement (victoires déjà acquises).
  if (milestonesReady && fresh.length) toast(`🏆 Nouvelle victoire : ${fresh[0].text}`);
  milestonesReady = true;
}
function allWins() {
  const auto = MILESTONES.filter((m) => S.milestones[m.id]).map((m) => ({ id: 'm-' + m.id, icon: m.icon, text: m.text, date: S.milestones[m.id], auto: true }));
  const goals = S.goals.filter((g) => g.doneAt).map((g) => ({ id: 'g-' + g.id, icon: '🎯', text: `Objectif atteint : ${g.text}`, date: g.doneAt, auto: true }));
  return [...S.wins, ...auto, ...goals].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/* ---------- Le coach ---------- */
function coachTips() {
  const tips = [];
  const pub = published();
  const fs = formatStats();
  const ideas = S.contents.filter((c) => c.stage === 'idee');
  const inProgress = S.contents.filter((c) => c.stage === 'tournee' || c.stage === 'montee');
  const missingStats = pub.filter((c) => viewsOf(c) === null);
  const phase = activePhase();
  const tested = testedFormats();

  if (fs.length >= 2) {
    const [a, b] = fs;
    const ratio = b.avg ? a.avg / b.avg : 0;
    const f = FMT[a.key];
    if (a.n < 3) tips.push({ icon: '📈', text: `Pour l’instant, ton meilleur format est <strong>${f.emoji} ${f.label}</strong> (${fmtNum(a.avg)} vues en moyenne). Fais-en encore ${3 - a.n} pour confirmer.`, act: 'genFormat', arg: a.key, label: 'Idées de ce format' });
    else tips.push({ icon: '📈', text: `<strong>${f.emoji} ${f.label}</strong> marche le mieux : ${fmtNum(a.avg)} vues en moyenne${ratio >= 1.3 ? `, ×${ratio.toFixed(1).replace('.', ',')} par rapport à ${FMT[b.key].label.toLowerCase()}` : ''}. Fais 3 variantes en changeant une seule chose (son, accroche, fond).`, act: 'genFormat', arg: a.key, label: 'Idées de ce format' });
  } else if (fs.length === 1) {
    const f = FMT[fs[0].key];
    tips.push({ icon: f.emoji, text: `Tes vidéos <strong>${f.label}</strong> font ${fmtNum(fs[0].avg)} vues en moyenne. Refais ce format en gardant le même style pour voir si ça se confirme, puis teste un 2e format pour comparer.`, act: 'genFormat', arg: f.id, label: 'Idées de ce format' });
  }
  if (phase) {
    const done = phasePublished(phase).length;
    if (done >= phase.goal) tips.push({ icon: '🏁', text: `Ta phase « ${esc(phase.name)} » a atteint ses ${phase.goal} vidéos. Termine-la et note ce que tu as appris.`, act: 'endPhase', arg: phase.id, label: 'Terminer la phase' });
  } else {
    tips.push({ icon: '🧪', text: 'Lance une phase de test : un seul format, 5 à 7 vidéos, puis on compare. C’est la façon la plus simple de trouver ce qui marche.', act: 'newPhase', label: 'Nouvelle phase' });
  }
  if (missingStats.length >= 2) tips.push({ icon: '📊', text: `${missingStats.length} vidéos publiées n’ont pas encore de vues notées. Ça prend 30 secondes, et le coach pourra comparer tes formats.`, act: 'goQuickStats', label: 'Ajouter les vues' });
  const untested = D.wantedFormats.filter((f) => !tested.has(f));
  if (untested.length) {
    const f = FMT[pickDaily(untested, 'u')];
    const idea = D.ideas.find((i) => i.f === f.id);
    tips.push({ icon: f.emoji, text: `Pas encore testé : <strong>${f.label}</strong>.${idea ? ` Idée : « ${esc(idea.title)} ».` : ''}`, act: 'genFormat', arg: f.id, label: 'Voir des idées' });
  }
  if (pub.length >= 3 && usedPlatforms().size === 1) tips.push({ icon: '📱', text: 'Republie tes vidéos sur Instagram Reels et YouTube Shorts : même vidéo, zéro travail en plus. Exporte depuis CapCut pour éviter le logo TikTok.' });
  if (ideas.length >= 8 && !inProgress.length) tips.push({ icon: '🎬', text: `Tu as ${ideas.length} idées en stock. Choisis-en une et tourne-la, rien de plus.`, act: 'goIdeas', label: 'Voir mes idées' });
  if (!ideas.length) tips.push({ icon: '🎲', text: 'Ta boîte à idées est vide. Le générateur peut t’en proposer.', act: 'genFormat', arg: 'all', label: 'Générer une idée' });
  if (!tips.length) tips.push({ icon: '💚', text: pickDaily(D.encouragements, 'c') });
  return tips.slice(0, 3);
}

/* ---------- Composants ---------- */
const chipRadio = (name, value, label, checked) => `<label class="chip"><input type="radio" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
const chipCheck = (name, value, label, checked) => `<label class="chip"><input type="checkbox" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
const seg = (key, items) => `<div class="seg" role="tablist">${items.map(([id, label]) => `<button class="${UI.sub[key] === id ? 'on' : ''}" data-act="sub" data-key="${key}" data-val="${id}">${label}</button>`).join('')}</div>`;
const fmtTag = (id) => { const f = FMT[id] || FMT.autre; return `<span class="tag">${f.emoji} ${esc(f.label)}</span>`; };
const platTags = (ids) => ids.map((p) => PLT[p] ? `<span class="tag">${PLT[p].emoji}</span>` : '').join('');
function bars(items, labelFn, valueFn = (x) => x.avg, subFn = () => '') {
  if (!items.length) return '<p class="hint">Pas encore de données.</p>';
  const max = Math.max(...items.map(valueFn), 1);
  return `<div class="bars">${items.map((x, i) => `
    <div><div class="bar-row-top"><span>${labelFn(x)} <span class="muted small">${subFn(x)}</span></span><span class="v">${fmtNum(valueFn(x))}</span></div>
    <div class="bar-track"><div class="bar-fill ${i ? 'dim' : ''}" style="width:${(valueFn(x) / max) * 100}%"></div></div></div>`).join('')}</div>`;
}
function lineChart(points, fmt) {
  if (points.length < 2) return '<p class="hint">Ajoute au moins 2 mesures pour voir la courbe.</p>';
  const W = 640, H = 220, L = 54, R = 16, T = 16, B = 30;
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const padY = (max - min) * 0.1; min -= padY; max += padY;
  const t0 = parseD(points[0].x).getTime(), t1 = parseD(points[points.length - 1].x).getTime();
  const sx = (x) => L + (t1 === t0 ? (W - L - R) / 2 : ((parseD(x).getTime() - t0) / (t1 - t0)) * (W - L - R));
  const sy = (y) => T + (1 - (y - min) / (max - min)) * (H - T - B);
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de progression">
    ${ticks.map((v) => `<line class="grid-line" x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}"/><text class="lbl" x="${L - 8}" y="${sy(v) + 4}" text-anchor="end">${esc(fmt(v))}</text>`).join('')}
    <polyline class="line" points="${points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}"/>
    ${points.map((p) => `<circle class="dot" cx="${sx(p.x)}" cy="${sy(p.y)}" r="5"><title>${esc(fmtDate(p.x))} : ${esc(fmt(p.y))}</title></circle>`).join('')}
    <text class="lbl" x="${L}" y="${H - 8}">${esc(fmtDate(points[0].x))}</text>
    <text class="lbl" x="${W - R}" y="${H - 8}" text-anchor="end">${esc(fmtDate(points[points.length - 1].x))}</text>
  </svg></div>`;
}
const empty = (icon, text) => `<div class="empty"><span class="big">${icon}</span>${text}</div>`;

/* ---------- Vues ---------- */
const VIEWS = {};

VIEWS.home = () => {
  const h = new Date().getHours();
  const greet = h < 5 ? 'Encore debout ?' : h < 18 ? 'Bonjour 👋' : 'Bonsoir 👋';
  const quotes = allQuotes().filter((q) => q.type === 'citation');
  const q = pickDaily(quotes, 'q');
  const fav = S.favQuotes.includes(q.id);
  const pub = published();
  const today = dkey();
  const todays = S.intentions.filter((i) => i.date === today);
  const log = S.habitLog[today] || [];
  const phase = activePhase();
  const totalViews = pub.reduce((a, c) => a + (viewsOf(c) || 0), 0);
  const lastWin = allWins()[0];
  const lastExportAge = S.settings.lastExport ? daysBetween(S.settings.lastExport, today) : null;
  const needBackup = (lastExportAge === null && daysBetween(S.createdAt, today) >= 7) || lastExportAge >= 14;

  return `
  <div class="page-head"><div><div class="hello">${greet}</div><div class="hello-msg">${esc(pickDaily(D.encouragements, 'm'))}</div></div></div>

  <div class="card quote-card accent">
    <div class="muted small" style="margin-bottom:8px">Citation du jour</div>
    <div class="quote-text">« ${esc(q.text)} »</div>
    ${q.author ? `<div class="quote-author">${esc(q.author)}</div>` : ''}
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-sm" data-act="favQuote" data-id="${q.id}">${fav ? '⭐ Favorite' : '☆ Favori'}</button>
      <button class="btn btn-sm" data-act="quoteToVideo" data-id="${q.id}">🎬 En faire une vidéo</button>
    </div>
  </div>

  <div class="section-title">Ta progression</div>
  <div class="tiles">
    <div class="tile"><div class="tile-v">${pub.length}</div><div class="tile-l">vidéos publiées</div></div>
    <div class="tile"><div class="tile-v">${testedFormats().size}</div><div class="tile-l">formats testés</div></div>
    <div class="tile"><div class="tile-v">${fmtNum(totalViews)}</div><div class="tile-l">vues au total</div></div>
    <div class="tile"><div class="tile-v">${allWins().length}</div><div class="tile-l">victoires</div></div>
  </div>

  <div class="section-title">Le coach</div>
  <div class="card"><ul class="tips">${coachTips().map((t) => `
    <li><span class="ico">${t.icon}</span><div class="txt">${t.text}${t.act ? `<div><button class="btn btn-sm" data-act="${t.act}" ${t.arg ? `data-arg="${esc(t.arg)}"` : ''}>${t.label}</button></div>` : ''}</div></li>`).join('')}
  </ul></div>

  <div class="section-title">Aujourd’hui</div>
  <div class="cols-2">
    <div class="card">
      <div class="card-head"><h3>Ce que j’ai envie de faire</h3><button class="btn btn-sm" data-act="addIntention" data-date="${today}">＋</button></div>
      ${todays.length ? todays.map(todoHtml).join('') : '<p class="hint">Rien de prévu, et c’est très bien aussi. Touche ＋ si tu as une envie.</p>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>Mes habitudes</h3><button class="link-btn" data-act="go" data-route="moi" data-sub="habitudes">Voir tout</button></div>
      <div class="habit-mini">${S.habits.map((hb) => `<button class="${log.includes(hb.id) ? 'on' : ''}" data-act="toggleHabit" data-id="${hb.id}" data-date="${today}">${hb.icon} ${esc(hb.name)}</button>`).join('')}</div>
    </div>
  </div>

  ${phase ? `<div class="section-title">Phase de test en cours</div>${phaseCard(phase)}` : ''}

  <div class="section-title">Pourquoi j’ai commencé</div>
  <div class="card"><p style="font-size:17px">« ${esc(S.profile.why)} »</p>
    ${lastWin ? `<p class="hint" style="margin-top:10px">Dernière victoire : ${lastWin.icon} ${esc(lastWin.text)}</p>` : ''}</div>

  ${needBackup ? `<div class="card" style="margin-top:12px"><div class="card-head"><h3>💾 Petite sauvegarde ?</h3></div>
    <p class="hint">Tes données sont uniquement sur cet iPad. Une copie dans Fichiers (ou iCloud Drive) les protège si l’iPad est changé ou réinitialisé. Ça prend 10 secondes.</p>
    <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-primary" data-act="exportData">Sauvegarder maintenant</button></div></div>` : ''}
  `;
};

/* --- Contenus --- */
VIEWS.contenus = () => {
  const sub = UI.sub.contenus;
  return `
  <div class="page-head"><div><h1 class="page-title">Contenus</h1><p class="page-sub">De l’idée à la publication, à ton rythme.</p></div></div>
  ${seg('contenus', [['videos', '🎬 Mes vidéos'], ['generateur', '🎲 Générateur'], ['citations', '💬 Citations'], ['modeles', '📋 Modèles']])}
  ${({ videos: viewVideos, generateur: viewGenerator, citations: viewQuotes, modeles: viewTemplates }[sub] || viewVideos)()}`;
};

function vcard(c) {
  const idx = STAGES.findIndex((s) => s.id === c.stage);
  const next = STAGES[idx + 1];
  const v = viewsOf(c);
  return `<div class="vcard" data-act="editContent" data-id="${c.id}">
    <div class="vcard-title">${esc(c.title || 'Sans titre')}</div>
    <div class="vcard-meta">${fmtTag(c.format)} ${platTags(c.platforms)} ${c.images?.length ? `<span class="tag">📷 ${c.images.length}</span>` : ''}</div>
    <div class="vcard-foot">
      <span class="muted small">${c.stage === 'publiee' ? (v !== null ? `👀 ${fmtNum(v)} vues` : 'Vues à noter') : esc(fmtDate(c.createdAt))}</span>
      ${next ? `<button class="next-btn" data-act="advance" data-id="${c.id}">${next.emoji} ${next.label} →</button>` : ''}
    </div>
  </div>`;
}
function viewVideos() {
  const byStage = (s) => S.contents.filter((c) => c.stage === s).sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt));
  return `
  <form class="inline-form" data-form="quickIdea" style="margin-bottom:14px">
    <input class="input" name="title" placeholder="💡 Une idée ? Note-la ici…" autocomplete="off" enterkeyhint="done">
    <button class="btn btn-primary" type="submit">Ajouter</button>
  </form>
  <div class="btn-row" style="margin-bottom:16px">
    <button class="btn btn-sm" data-act="newContent">＋ Vidéo détaillée</button>
    <button class="btn btn-sm" data-act="sub" data-key="contenus" data-val="generateur">🎲 Pas d’idée ? Générateur</button>
  </div>
  <div class="board">${STAGES.map((s) => {
    const list = byStage(s.id);
    const limit = s.id === 'publiee' && !UI.showAllPub ? 8 : Infinity;
    return `<div class="col">
      <div class="col-head"><span>${s.emoji} ${s.label}</span><span class="count">${list.length}</span></div>
      <div class="col-list">${list.length ? list.slice(0, limit).map(vcard).join('') : `<p class="hint" style="padding:0 6px 6px">${s.id === 'idee' ? 'Note ta première idée au-dessus.' : 'Rien pour l’instant.'}</p>`}
      ${list.length > limit ? `<button class="btn btn-sm btn-ghost btn-block" data-act="showAllPub">Voir les ${list.length} vidéos</button>` : ''}</div>
    </div>`;
  }).join('')}</div>`;
}

let currentIdea = null;
function pickIdea() {
  const pool = D.ideas.filter((i) => (UI.genTheme === 'all' || i.t === UI.genTheme) && (UI.genFormat === 'all' || i.f === UI.genFormat));
  if (!pool.length) return null;
  const others = pool.filter((i) => i !== currentIdea);
  return rand(others.length ? others : pool);
}
function viewGenerator() {
  if (!currentIdea || !((UI.genTheme === 'all' || currentIdea.t === UI.genTheme) && (UI.genFormat === 'all' || currentIdea.f === UI.genFormat))) currentIdea = pickIdea();
  const i = currentIdea;
  const filt = (key, val, label) => `<button class="chip ${UI[key] === val ? 'on' : ''}" data-act="genFilter" data-key="${key}" data-val="${val}">${label}</button>`;
  return `
  <div class="card" style="margin-bottom:12px">
    <div class="field" style="margin-bottom:12px"><span>Thème</span><div class="chips">${filt('genTheme', 'all', 'Tous')}${THEMES.map((t) => filt('genTheme', t.id, t.label)).join('')}</div></div>
    <div class="field" style="margin-bottom:0"><span>Format</span><div class="chips">${filt('genFormat', 'all', 'Tous')}${FORMATS.filter((f) => D.ideas.some((x) => x.f === f.id)).map((f) => filt('genFormat', f.id, `${f.emoji} ${f.label}`)).join('')}</div></div>
  </div>
  ${i ? `<div class="card gen-card accent">
    <div class="gen-format">${FMT[i.f].emoji} ${FMT[i.f].label} · ${THM[i.t].label}</div>
    <div class="gen-title">${esc(i.title)}</div>
    <div class="gen-label">Accroche</div><div class="gen-hook">« ${esc(i.hook)} »</div>
    <div class="gen-label">Comment filmer (sans visage)</div><p>${esc(i.how)}</p>
    <div class="btn-row" style="margin-top:18px">
      <button class="btn" data-act="genNext">🎲 Une autre</button>
      <button class="btn btn-primary" data-act="genKeep">＋ Garder dans mes idées</button>
    </div>
  </div>` : `<div class="card">${empty('🤷', 'Aucune idée pour ce filtre. Élargis le thème ou le format.')}</div>`}
  <p class="hint" style="margin-top:12px">${D.ideas.length} idées dans la banque. Les crochets [X] sont à remplacer par ton vécu.</p>`;
}

function viewQuotes() {
  const list = allQuotes().filter((q) => q.type === UI.quoteType && (!UI.favOnly || S.favQuotes.includes(q.id)));
  const t = (val, label) => `<button class="chip ${UI.quoteType === val ? 'on' : ''}" data-act="quoteType" data-val="${val}">${label}</button>`;
  return `
  <div class="page-head" style="margin-top:0">
    <div class="chips">${t('citation', '💬 Citations')}${t('accroche', '⚡ Accroches')}<button class="chip ${UI.favOnly ? 'on' : ''}" data-act="favOnly">⭐ Favoris</button></div>
    <div class="btn-row"><button class="btn btn-sm" data-act="randomQuote">🎲 Au hasard</button><button class="btn btn-sm btn-primary" data-act="addQuote">＋ Ajouter</button></div>
  </div>
  ${list.length ? `<div class="grid">${list.map(quoteCard).join('')}</div>` : `<div class="card">${empty('⭐', UI.favOnly ? 'Pas encore de favoris. Touche ☆ sur une citation que tu aimes.' : 'Rien ici pour l’instant.')}</div>`}`;
}
function quoteCard(q) {
  const fav = S.favQuotes.includes(q.id);
  return `<div class="card qcard" id="q-${q.id}">
    <div class="card-head" style="margin-bottom:6px;align-items:flex-start"><p>« ${esc(q.text)} »</p><button class="star" data-act="favQuote" data-id="${q.id}" aria-label="Favori">${fav ? '⭐' : '☆'}</button></div>
    ${q.author ? `<div class="quote-author">${esc(q.author)}</div>` : ''}
    <div class="btn-row">
      <button class="btn btn-sm" data-act="quoteToVideo" data-id="${q.id}">🎬 En faire une vidéo</button>
      <button class="btn btn-sm btn-ghost" data-act="copyQuote" data-id="${q.id}">Copier</button>
      ${q.mine ? `<button class="btn btn-sm btn-danger" data-act="deleteQuote" data-id="${q.id}">Supprimer</button>` : ''}
    </div>
  </div>`;
}

function viewTemplates() {
  return `<p class="hint" style="margin-bottom:12px">Une structure toute prête pour chaque format. « Utiliser » crée une nouvelle vidéo avec le modèle déjà rempli.</p>
  ${FORMATS.filter((f) => D.templates[f.id]).map((f) => `
    <details class="acc"><summary>${f.emoji} ${f.label}</summary><div class="acc-body">
      <pre class="tpl">${esc(D.templates[f.id])}</pre>
      <div class="btn-row" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="useTemplate" data-id="${f.id}">Utiliser ce modèle</button></div>
    </div></details>`).join('')}`;
}

/* --- Tests --- */
VIEWS.tests = () => `
  <div class="page-head"><div><h1 class="page-title">Tests</h1><p class="page-sub">Essayer, comparer, garder ce qui marche.</p></div></div>
  ${seg('tests', [['phases', '🧪 Phases de test'], ['analyse', '📊 Analyse']])}
  ${UI.sub.tests === 'analyse' ? viewAnalysis() : viewPhases()}`;

function phaseCard(p) {
  const done = phasePublished(p).length;
  const avg = phaseAvg(p);
  const f = FMT[p.format] || FMT.autre;
  return `<div class="card">
    <div class="card-head"><h3>${f.emoji} ${esc(p.name)}</h3>${p.endedAt ? verdictTag(p.verdict) : '<span class="tag accent">En cours</span>'}</div>
    <p class="hint">Depuis le ${esc(fmtDate(p.startedAt, { day: 'numeric', month: 'long' }))}${p.endedAt ? ` · terminée le ${esc(fmtDate(p.endedAt))}` : ''}</p>
    <div class="progress"><div style="width:${Math.min(100, (done / p.goal) * 100)}%"></div></div>
    <p class="small" style="margin-top:6px">${done} / ${p.goal} vidéos publiées${avg !== null ? ` · ${fmtNum(avg)} vues en moyenne` : ''}</p>
    ${p.notes ? `<p class="small muted" style="margin-top:8px">${esc(p.notes)}</p>` : ''}
    ${p.learnings ? `<p style="margin-top:8px"><strong>Ce que j’ai appris :</strong> ${esc(p.learnings)}</p>` : ''}
    <div class="btn-row" style="margin-top:12px">
      ${!p.endedAt ? `<button class="btn btn-sm btn-primary" data-act="newContentInPhase" data-id="${p.id}">＋ Vidéo de cette phase</button><button class="btn btn-sm" data-act="endPhase" data-id="${p.id}">Terminer la phase</button>` : ''}
      <button class="btn btn-sm btn-ghost" data-act="editPhase" data-id="${p.id}">Modifier</button>
    </div>
  </div>`;
}
const VERDICTS = { garder: '✅ À garder', retravailler: '🔁 À retravailler', abandonner: '⏸️ Pas pour moi' };
const verdictTag = (v) => (v ? `<span class="tag ${v === 'garder' ? 'accent' : ''}">${VERDICTS[v]}</span>` : '<span class="tag">Terminée</span>');

function viewPhases() {
  const active = activePhase();
  const past = S.phases.filter((p) => p.endedAt).sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  const untested = D.wantedFormats.filter((f) => !testedFormats().has(f) && !S.phases.some((p) => p.format === f));
  return `
  ${active ? phaseCard(active) : `<div class="card accent">
      <h3>Aucune phase en cours</h3>
      <p style="margin-top:6px">Une phase = <strong>un format, 5 à 7 vidéos</strong>, sans date limite. À la fin, tu notes ce que tu as appris et tu passes au suivant.</p>
      <div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-act="newPhase">＋ Lancer une phase</button></div>
    </div>`}
  ${untested.length ? `<div class="section-title">Formats à tester ensuite</div>
    <div class="chips">${untested.map((f) => `<button class="chip" data-act="newPhase" data-arg="${f}">${FMT[f].emoji} ${FMT[f].label}</button>`).join('')}</div>` : ''}
  <div class="section-title">Phases terminées</div>
  ${past.length ? `<div class="grid">${past.map(phaseCard).join('')}</div>` : '<p class="hint">Tes phases terminées apparaîtront ici, avec ce que tu en as retenu.</p>'}
  ${past.length >= 2 ? `<div class="section-title">Comparaison des phases</div><div class="card">${bars(past.filter((p) => phaseAvg(p) !== null).map((p) => ({ p, avg: phaseAvg(p) })).sort((a, b) => b.avg - a.avg), (x) => `${FMT[x.p.format]?.emoji || ''} ${esc(x.p.name)}`, (x) => x.avg, () => 'vues moy.')}</div>` : ''}`;
}

function viewAnalysis() {
  const plat = UI.plat;
  const pub = published();
  const items = withViews(plat);
  const total = items.reduce((a, c) => a + viewsOf(c, plat), 0);
  const fs = formatStats(plat);
  const ranking = [...items].sort((a, b) => viewsOf(b, plat) - viewsOf(a, plat)).slice(0, 10);
  const missing = pub.filter((c) => viewsOf(c) === null);
  const pchip = (val, label) => `<button class="chip ${plat === val ? 'on' : ''}" data-act="setPlat" data-val="${val}">${label}</button>`;
  return `
  <div class="chips" style="margin-bottom:14px">${pchip('all', 'Toutes')}${PLATFORMS.map((p) => pchip(p.id, `${p.emoji} ${p.label}`)).join('')}</div>
  <div class="tiles">
    <div class="tile"><div class="tile-v">${items.length}</div><div class="tile-l">vidéos avec stats</div></div>
    <div class="tile"><div class="tile-v">${fmtNum(total)}</div><div class="tile-l">vues</div></div>
    <div class="tile"><div class="tile-v">${items.length ? fmtNum(total / items.length) : '–'}</div><div class="tile-l">vues par vidéo</div></div>
    <div class="tile"><div class="tile-v">${fs.length}</div><div class="tile-l">formats comparés</div></div>
  </div>

  ${missing.length ? `<div class="section-title" id="quick-stats">Ajout rapide des vues</div>
  <div class="card"><p class="hint">Note les vues 2 ou 3 jours après la publication. Les autres chiffres sont dans la fiche de la vidéo.</p>
    <ul class="quick-stats">${missing.slice(0, 12).map((c) => `<li><div><strong>${esc(c.title || 'Sans titre')}</strong> ${fmtTag(c.format)}</div>
      <div class="qs-inputs">${(c.platforms.length ? c.platforms : ['tiktok']).map((p) => `<label>${PLT[p].emoji}<input type="number" inputmode="numeric" min="0" placeholder="vues" data-quickstat="${c.id}" data-plat="${p}"></label>`).join('')}</div></li>`).join('')}
    </ul></div>` : ''}

  <div class="section-title">Vues moyennes par format</div>
  <div class="card">${bars(fs, (x) => `${FMT[x.key]?.emoji || ''} ${FMT[x.key]?.label || x.key}`, (x) => x.avg, (x) => `· ${plural(x.n, 'vidéo', 'vidéos')}`)}
    ${fs.length && fs[0].n < 3 ? '<p class="hint" style="margin-top:12px">Avec moins de 3 vidéos par format, c’est encore une tendance, pas une certitude.</p>' : ''}</div>

  ${plat === 'all' ? `<div class="section-title">Vues moyennes par plateforme</div>
  <div class="card">${bars(platformStats(), (x) => `${PLT[x.key].emoji} ${PLT[x.key].label}`, (x) => x.avg, (x) => `· ${plural(x.n, 'vidéo', 'vidéos')}`)}</div>` : ''}

  <div class="section-title">Mes meilleures vidéos</div>
  <div class="card">${ranking.length ? `<ol class="rank">${ranking.map((c, i) => {
    const likes = statOf(c, 'likes', plat); const v = viewsOf(c, plat);
    return `<li data-act="editContent" data-id="${c.id}"><span class="pos">${i + 1}</span>
      <div class="t"><div>${esc(c.title || 'Sans titre')}</div><div class="muted small">${FMT[c.format]?.emoji || ''} ${FMT[c.format]?.label || ''}${likes !== null && v ? ` · ${Math.round((likes / v) * 100)} % de j’aime` : ''}</div></div>
      <span class="v">${fmtNum(v)}</span></li>`;
  }).join('')}</ol>` : empty('📊', 'Ajoute les vues de tes vidéos publiées pour voir ton classement.')}</div>`;
}

/* --- Moi --- */
VIEWS.moi = () => `
  <div class="page-head"><div><h1 class="page-title">Moi</h1><p class="page-sub">Ton mental, ton corps, tes victoires.</p></div></div>
  ${seg('moi', [['journal', '📝 Journal'], ['habitudes', '✅ Habitudes'], ['perfs', '⏱️ Perfs'], ['victoires', '🏆 Victoires'], ['pourquoi', '💚 Pourquoi']])}
  ${({ journal: viewJournal, habitudes: viewHabits, perfs: viewPerfs, victoires: viewWins, pourquoi: viewWhy }[UI.sub.moi] || viewJournal)()}`;

function viewJournal() {
  const today = dkey();
  const entry = S.journal.find((j) => j.date === today);
  const list = [...S.journal].sort((a, b) => b.date.localeCompare(a.date));
  const last30 = Array.from({ length: 30 }, (_, i) => dkey(addDays(new Date(), i - 29)));
  const moodMap = Object.fromEntries(S.journal.map((j) => [j.date, j.mood]));
  return `
  <div class="card">
    <div class="card-head"><h3>Comment tu te sens aujourd’hui ?</h3></div>
    <div class="moods">${MOODS.map((m) => `<button class="mood ${entry?.mood === m.v ? 'on' : ''}" data-act="setMood" data-v="${m.v}">${m.e}<small>${m.l}</small></button>`).join('')}</div>
    <form data-form="journal" style="margin-top:14px">
      <label class="field" style="margin-bottom:10px"><span>${esc(pickDaily(D.journalPrompts, 'p'))} <span class="muted">(facultatif)</span></span>
        <textarea name="text" rows="4" placeholder="Quelques mots suffisent…">${esc(entry?.text || '')}</textarea></label>
      <div class="thumbs">${thumbsHtml(entry?.images || [], true).replaceAll('data-act="removeImg"', 'data-act="removeJournalImg"')}</div>
      <div class="btn-row">
        <button class="btn btn-primary" type="submit">Enregistrer</button>
        <label class="btn upload-btn">📷 Photo<input type="file" accept="image/*" data-upload="journal"></label>
      </div>
    </form>
  </div>
  <div class="section-title">Mon humeur sur 30 jours</div>
  <div class="card"><div class="mood-strip">${last30.map((d) => `<span title="${esc(fmtDate(d))}">${moodMap[d] ? MOODS[moodMap[d] - 1].e : ''}</span>`).join('')}</div></div>
  <div class="section-title">Mes pages</div>
  <div class="card">${list.length ? list.map((j) => `<div class="entry">
      <div class="entry-head"><span class="e">${j.mood ? MOODS[j.mood - 1].e : '📝'}</span><strong style="text-transform:capitalize">${esc(fmtDate(j.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
      <span style="margin-left:auto"><button class="mini btn-sm btn btn-ghost" data-act="deleteJournal" data-id="${j.id}" aria-label="Supprimer">🗑️</button></span></div>
      ${j.text ? `<div class="entry-text">${esc(j.text)}</div>` : ''}
      ${j.images?.length ? `<div class="thumbs" style="margin-top:8px">${thumbsHtml(j.images, false)}</div>` : ''}
    </div>`).join('') : empty('📝', 'Ta première page t’attend. Un emoji suffit pour commencer.')}</div>`;
}
function ensureJournal(date = dkey()) {
  let e = S.journal.find((j) => j.date === date);
  if (!e) { e = { id: uid(), date, mood: null, text: '', images: [] }; S.journal.push(e); }
  return e;
}

function viewHabits() {
  const today = dkey();
  const log = S.habitLog[today] || [];
  const days = Array.from({ length: 7 }, (_, i) => dkey(addDays(new Date(), i - 6)));
  const weekCount = (id) => days.filter((d) => (S.habitLog[d] || []).includes(id)).length;
  return `
  <p class="hint" style="margin-bottom:12px">Chaque case cochée compte. Une case vide ne compte pas contre toi.</p>
  <div class="habit-today">${S.habits.map((h) => `<button class="habit-btn ${log.includes(h.id) ? 'on' : ''}" data-act="toggleHabit" data-id="${h.id}" data-date="${today}"><span class="i">${h.icon}</span><span class="n">${esc(h.name)}</span></button>`).join('')}</div>
  <div class="section-title">Les 7 derniers jours</div>
  <div class="card" style="overflow-x:auto"><table class="habit-grid">
    <thead><tr><th></th>${days.map((d) => `<th>${esc(parseD(d).toLocaleDateString('fr-FR', { weekday: 'narrow' }))}<br>${parseD(d).getDate()}</th>`).join('')}<th></th></tr></thead>
    <tbody>${S.habits.map((h) => `<tr><td>${h.icon} ${esc(h.name)}</td>${days.map((d) => `<td><button class="dot-btn ${(S.habitLog[d] || []).includes(h.id) ? 'on' : ''}" data-act="toggleHabit" data-id="${h.id}" data-date="${d}" aria-label="${esc(h.name)} ${esc(fmtDate(d))}"></button></td>`).join('')}<td class="muted">${weekCount(h.id)}/7</td></tr>`).join('')}</tbody>
  </table></div>
  <div class="btn-row" style="margin-top:12px"><button class="btn btn-sm" data-act="editHabits">✏️ Modifier mes habitudes</button></div>`;
}

function viewPerfs() {
  const used = [...new Set(S.perfs.map((p) => p.ex))];
  const exList = allExercises();
  if (!UI.perfEx || !exById(UI.perfEx)) UI.perfEx = used[0] || exList[0].id;
  const ex = exById(UI.perfEx);
  const entries = S.perfs.filter((p) => p.ex === ex.id).sort((a, b) => a.date.localeCompare(b.date));
  const best = entries.reduce((b, p) => (b === null || isBetter(ex, p.value, b.value) ? p : b), null);
  const last = entries[entries.length - 1];
  const first = entries[0];
  const fmt = (v) => fmtPerf(ex, v);
  return `
  <div class="page-head" style="margin-top:0">
    <div class="chips">${exList.map((e) => `<button class="chip ${e.id === ex.id ? 'on' : ''}" data-act="perfEx" data-id="${e.id}">${esc(e.name)}${used.includes(e.id) ? ' •' : ''}</button>`).join('')}</div>
  </div>
  <div class="btn-row" style="margin-bottom:14px"><button class="btn btn-primary" data-act="addPerf" data-id="${ex.id}">＋ Noter une perf</button><button class="btn btn-sm" data-act="addExercise">＋ Nouvel exercice</button></div>
  <div class="tiles">
    <div class="tile"><div class="tile-v">${best ? esc(fmt(best.value)) : '–'}</div><div class="tile-l">record</div></div>
    <div class="tile"><div class="tile-v">${last ? esc(fmt(last.value)) : '–'}</div><div class="tile-l">dernière fois</div></div>
    <div class="tile"><div class="tile-v">${first && last && first !== last ? esc(progressLabel(ex, first.value, last.value)) : '–'}</div><div class="tile-l">depuis le début</div></div>
    <div class="tile"><div class="tile-v">${entries.length}</div><div class="tile-l">mesures</div></div>
  </div>
  <div class="section-title">${esc(ex.name)}</div>
  <div class="card">${lineChart(entries.map((p) => ({ x: p.date, y: p.value })), fmt)}
    ${ex.type === 'time' ? '<p class="hint" style="margin-top:8px">Pour un temps, plus la courbe descend, mieux c’est.</p>' : ''}</div>
  ${entries.length ? `<div class="card" style="margin-top:12px">${[...entries].reverse().map((p) => `<div class="entry"><div class="entry-head">
    <strong>${esc(fmt(p.value))}</strong>${best && p.id === best.id ? '<span class="tag accent">🏆 Record</span>' : ''}
    <span class="muted small">${esc(fmtDate(p.date, { day: 'numeric', month: 'long', year: 'numeric' }))}</span>
    <span style="margin-left:auto"><button class="btn btn-sm btn-ghost" data-act="deletePerf" data-id="${p.id}" aria-label="Supprimer">🗑️</button></span></div>
    ${p.note ? `<div class="entry-text muted">${esc(p.note)}</div>` : ''}</div>`).join('')}</div>` : ''}`;
}
function progressLabel(ex, a, b) {
  const diff = b - a;
  if (ex.type === 'time') return (diff <= 0 ? '−' : '+') + fmtTime(Math.abs(diff));
  return (diff >= 0 ? '+' : '−') + fmtPerf(ex, Math.round(Math.abs(diff) * 10) / 10);
}

function viewWins() {
  const wins = allWins();
  const next = MILESTONES.filter((m) => !S.milestones[m.id]).slice(0, 3);
  return `
  <div class="btn-row" style="margin-bottom:14px"><button class="btn btn-primary" data-act="addWin">＋ Ajouter une victoire</button></div>
  <p class="hint" style="margin-bottom:12px">Premier commentaire, une séance difficile terminée, une vidéo qui t’a rendu fier : tout compte.</p>
  <div class="wins">${wins.map((w) => `<div class="win"><div class="i">${w.icon}</div><div class="t">${esc(w.text)}</div><div class="d">${w.date ? esc(fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })) : ''}</div>
    ${!w.auto ? `<button class="btn btn-sm btn-ghost del" data-act="deleteWin" data-id="${w.id}" aria-label="Supprimer">✕</button>` : ''}</div>`).join('')}</div>
  ${next.length ? `<div class="section-title">Prochaines victoires</div><div class="wins">${next.map((m) => `<div class="win locked"><div class="i">${m.icon}</div><div class="t">${esc(m.text)}</div></div>`).join('')}</div>` : ''}`;
}

function viewWhy() {
  return `<form data-form="why" class="card">
    <label class="field"><span>Pourquoi j’ai commencé</span><textarea name="why" rows="4">${esc(S.profile.why)}</textarea></label>
    <label class="field"><span>À quoi ressemble ma réussite dans un an (une idée par ligne)</span><textarea name="success" rows="4">${esc(S.profile.success.join('\n'))}</textarea></label>
    <button class="btn btn-primary" type="submit">Enregistrer</button>
  </form>
  <div class="section-title">Quand tu doutes</div>
  <div class="card stack">
    <p>• Tu compares ton début à la suite des autres. Eux aussi ont eu des vidéos à 20 vues.</p>
    <p>• Tu as déjà publié 15 vidéos en 2 semaines. La plupart des gens n’en publient jamais une.</p>
    <p>• Une citation à 1 000 vues, ça veut dire que 1 000 personnes ont vu ton message. C’est une salle de concert.</p>
    <p>• La discipline dont tu parles dans tes vidéos, c’est exactement ce que tu es en train de faire en continuant.</p>
  </div>`;
}

/* --- Semaine --- */
VIEWS.semaine = () => `
  <div class="page-head"><div><h1 class="page-title">Semaine</h1><p class="page-sub">Ce que tu as envie de faire. Rien n’est obligatoire.</p></div></div>
  ${seg('semaine', [['semaine', '🗓️ Ma semaine'], ['objectifs', '🎯 Objectifs']])}
  ${UI.sub.semaine === 'objectifs' ? viewGoals() : viewWeek()}`;

function todoHtml(i) {
  return `<div class="todo ${i.done ? 'done' : ''}">
    <button class="check" data-act="toggleIntention" data-id="${i.id}" aria-label="Fait">${i.done ? '✓' : ''}</button>
    <span class="tx">${esc(i.text)}</span>
    ${!i.done ? `<button class="mini" data-act="moveIntention" data-id="${i.id}" aria-label="Déplacer au lendemain" title="Au lendemain">↪</button>` : ''}
    <button class="mini" data-act="deleteIntention" data-id="${i.id}" aria-label="Supprimer">✕</button>
  </div>`;
}
function viewWeek() {
  const mon = addDays(mondayOf(new Date()), UI.weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => dkey(addDays(mon, i)));
  const today = dkey();
  const label = UI.weekOffset === 0 ? 'Cette semaine' : UI.weekOffset === 1 ? 'La semaine prochaine' : UI.weekOffset === -1 ? 'La semaine dernière' : `Semaine du ${fmtDate(days[0])}`;
  const all = S.intentions.filter((i) => days.includes(i.date));
  return `
  <div class="week-nav">
    <button class="btn btn-sm" data-act="week" data-val="-1" aria-label="Semaine précédente">‹</button>
    <div style="text-align:center"><strong>${esc(label)}</strong><div class="muted small">${esc(fmtDate(days[0]))} – ${esc(fmtDate(days[6]))}${all.length ? ` · ${all.filter((i) => i.done).length} fait${all.filter((i) => i.done).length > 1 ? 's' : ''}` : ''}</div></div>
    <button class="btn btn-sm" data-act="week" data-val="1" aria-label="Semaine suivante">›</button>
  </div>
  <div class="week">${days.map((d) => {
    const items = S.intentions.filter((i) => i.date === d);
    return `<div class="day ${d === today ? 'today' : ''}">
      <div class="day-head"><div><div class="n">${esc(parseD(d).toLocaleDateString('fr-FR', { weekday: 'long' }))}</div><div class="d">${esc(fmtDate(d))}</div></div>
      <button class="btn btn-sm btn-ghost" data-act="addIntention" data-date="${d}" aria-label="Ajouter">＋</button></div>
      ${items.map(todoHtml).join('')}
    </div>`;
  }).join('')}</div>`;
}
function viewGoals() {
  const list = [...S.goals].sort((a, b) => (a.doneAt ? 1 : 0) - (b.doneAt ? 1 : 0));
  return `
  <div class="btn-row" style="margin-bottom:12px"><button class="btn btn-primary" data-act="addGoal">＋ Nouvel objectif</button></div>
  <p class="hint" style="margin-bottom:12px">Des objectifs sans date limite. Certains avancent tout seuls (🔄) à partir de tes vidéos.</p>
  <div class="grid">${list.map((g) => {
    const p = goalProgress(g);
    return `<div class="card">
      <div class="card-head" style="align-items:flex-start"><h3>${g.doneAt ? '✅ ' : ''}${esc(g.text)}</h3>${g.auto ? '<span class="tag" title="Suivi automatique">🔄 auto</span>' : ''}</div>
      <div class="progress"><div style="width:${Math.min(100, (p / g.target) * 100)}%"></div></div>
      <div class="vcard-foot"><span class="small">${fmtNum(Math.min(p, g.target))} / ${fmtNum(g.target)}</span>
        <span class="btn-row">${!g.auto && !g.doneAt ? `<button class="btn btn-sm" data-act="goalStep" data-id="${g.id}" data-val="-1">−</button><button class="btn btn-sm btn-primary" data-act="goalStep" data-id="${g.id}" data-val="1">＋</button>` : ''}
        <button class="btn btn-sm btn-ghost" data-act="deleteGoal" data-id="${g.id}" aria-label="Supprimer">🗑️</button></span></div>
    </div>`;
  }).join('')}</div>`;
}

/* --- Guide --- */
VIEWS.guide = () => `
  <div class="page-head"><div><h1 class="page-title">Guide</h1><p class="page-sub">L’essentiel pour avancer sans te perdre.</p></div></div>
  ${D.guide.map((g, i) => `<details class="acc" ${i === 0 ? 'open' : ''}><summary><span>${g.icon}</span>${esc(g.title)}</summary><div class="acc-body">${g.html}</div></details>`).join('')}`;

/* ---------- Rendu ---------- */
function render() {
  const view = VIEWS[UI.route] ? UI.route : 'home';
  $('#view').innerHTML = VIEWS[view]();
  $$('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.route === view));
  $('#today-label').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  hydrateImages($('#view'));
}
function applyTheme() {
  document.documentElement.dataset.theme = S.settings.theme;
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    $('meta[name="theme-color"]').setAttribute('content', bg);
  });
}

/* ---------- Feuille modale ---------- */
let sheetCancel = null;
function openSheet(title, body, foot = '', { form = null, onCancel = null } = {}) {
  const el = $('#sheet');
  const inner = `<header class="sheet-head"><h2>${title}</h2><button type="button" class="icon-btn" data-act="closeSheet" aria-label="Fermer">✕</button></header>
    <div class="sheet-body">${body}</div>${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}`;
  el.innerHTML = `<div class="sheet-backdrop" data-act="closeSheet"></div><div class="sheet-panel" role="dialog" aria-modal="true">${form ? `<form data-form="${form}">${inner}</form>` : inner}</div>`;
  el.hidden = false;
  document.body.classList.add('noscroll');
  sheetCancel = onCancel;
  hydrateImages(el);
  return el;
}
function closeSheet(cancelled = true) {
  if (cancelled && sheetCancel) sheetCancel();
  sheetCancel = null;
  const el = $('#sheet');
  el.hidden = true; el.innerHTML = '';
  document.body.classList.remove('noscroll');
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ---------- Éditeur de vidéo ---------- */
let EDIT = null;
function openContent(id, preset = {}) {
  const isNew = !id;
  const phase = activePhase();
  const base = { id: uid(), title: '', format: 'citation', platforms: ['tiktok'], stage: 'idee', hook: '', script: '', notes: '', phaseId: null, createdAt: dkey(), publishedAt: null, stats: {}, images: [] };
  const found = isNew ? null : S.contents.find((x) => x.id === id);
  if (!isNew && !found) return;
  const c = isNew ? { ...base, ...preset } : { ...base, ...structuredClone(found) };
  c.images ||= []; c.platforms ||= [];
  if (isNew && phase && !('phaseId' in preset) && c.format === phase.format) c.phaseId = phase.id;
  EDIT = { c, isNew, added: [], removed: [] };
  const hooks = allQuotes().filter((q) => q.type === 'accroche');
  const body = `
    <label class="field"><span>Titre / idée</span><input name="title" value="${esc(c.title)}" placeholder="Ex. : Ma routine 5 h 30 en POV" autocomplete="off"></label>
    <div class="field"><span>Format</span><div class="chips">${FORMATS.map((f) => chipRadio('format', f.id, `${f.emoji} ${f.label}`, c.format === f.id)).join('')}</div></div>
    <div class="field"><span>Étape</span><div class="chips">${STAGES.map((s) => chipRadio('stage', s.id, `${s.emoji} ${s.label}`, c.stage === s.id)).join('')}</div></div>
    <div class="field"><span>Plateformes</span><div class="chips">${PLATFORMS.map((p) => chipCheck('platforms', p.id, `${p.emoji} ${p.label}`, c.platforms.includes(p.id))).join('')}</div></div>
    ${S.phases.length ? `<label class="field"><span>Phase de test</span><select name="phaseId"><option value="">Aucune</option>${S.phases.map((p) => `<option value="${p.id}" ${c.phaseId === p.id ? 'selected' : ''}>${esc(p.name)}${p.endedAt ? ' (terminée)' : ''}</option>`).join('')}</select></label>` : ''}
    <label class="field"><span>Accroche (les 2 premières secondes)</span><input name="hook" value="${esc(c.hook)}" placeholder="Ce qui apparaît à l’écran en premier" autocomplete="off"></label>
    <details class="box"><summary>⚡ Piocher une accroche</summary><div class="box-body"><div class="hook-list">${hooks.map((q) => `<button type="button" data-act="useHook" data-text="${esc(q.text)}">${esc(q.text)}</button>`).join('')}</div></div></details>
    <div class="field"><div class="field-row"><span>Script</span><button type="button" class="link-btn" data-act="insertTemplate">📋 Insérer le modèle</button></div>
      <textarea name="script" rows="8" placeholder="Touche « Insérer le modèle » pour avoir une structure.">${esc(c.script)}</textarea></div>
    <label class="field"><span>Notes</span><textarea name="notes" rows="3" placeholder="Son utilisé, idée de légende, ce que tu veux tester…">${esc(c.notes)}</textarea></label>
    <details class="box" id="stats-box" ${c.stage === 'publiee' ? 'open' : ''}><summary>📊 Statistiques (optionnel)</summary><div class="box-body">
      <p class="hint">Juste les vues suffisent. Le reste, si tu as le temps.</p>
      ${PLATFORMS.map((p) => `<div class="stat-plat" data-plat="${p.id}" ${c.platforms.includes(p.id) ? '' : 'hidden'}><h4>${p.emoji} ${p.label}</h4>
        <div class="stat-grid">${Object.keys(STAT_LABEL).map((k) => `<label><span>${STAT_LABEL[k]}</span><input type="number" inputmode="numeric" min="0" name="st_${p.id}_${k}" value="${esc(c.stats?.[p.id]?.[k] ?? '')}"></label>`).join('')}</div></div>`).join('')}
    </div></details>
    <div class="field"><span>Photos / captures (stats, repères de tournage…)</span>
      <div class="thumbs" id="edit-thumbs">${thumbsHtml(c.images, true)}</div>
      <label class="btn btn-sm upload-btn">📷 Ajouter<input type="file" accept="image/*" multiple data-upload="content"></label></div>`;
  const foot = `${!isNew ? '<button type="button" class="btn btn-danger" data-act="deleteContent">Supprimer</button><span class="spacer"></span>' : ''}<button class="btn btn-primary" type="submit">Enregistrer</button>`;
  const el = openSheet(isNew ? 'Nouvelle vidéo' : 'Modifier la vidéo', body, foot, {
    form: 'content',
    onCancel: () => { EDIT?.added.forEach((id) => IMG.del(id)); EDIT = null; },
  });
  $('.sheet-panel', el).addEventListener('change', (e) => {
    if (e.target.name === 'platforms') {
      const on = $$('input[name=platforms]:checked', el).map((x) => x.value);
      $$('.stat-plat', el).forEach((b) => { b.hidden = !on.includes(b.dataset.plat); });
    }
    if (e.target.name === 'stage' && e.target.value === 'publiee') $('#stats-box', el).open = true;
  });
}
function saveContent(fd) {
  const { c, isNew, removed } = EDIT;
  c.title = (fd.get('title') || '').trim() || 'Sans titre';
  c.format = fd.get('format') || 'autre';
  const prevStage = c.stage;
  c.stage = fd.get('stage') || 'idee';
  c.platforms = fd.getAll('platforms');
  if (fd.has('phaseId')) c.phaseId = fd.get('phaseId') || null;
  c.hook = fd.get('hook') || '';
  c.script = fd.get('script') || '';
  c.notes = fd.get('notes') || '';
  const stats = {};
  for (const p of PLATFORMS) {
    for (const k of Object.keys(STAT_LABEL)) {
      const v = fd.get(`st_${p.id}_${k}`);
      if (v !== null && v !== '' && Number.isFinite(Number(v))) (stats[p.id] ||= {})[k] = Number(v);
    }
  }
  c.stats = stats;
  if (c.stage === 'publiee' && !c.publishedAt) c.publishedAt = dkey();
  if (c.stage !== 'publiee') c.publishedAt = null;
  removed.forEach((id) => IMG.del(id));
  if (isNew) S.contents.push(c); else S.contents[S.contents.findIndex((x) => x.id === c.id)] = c;
  EDIT = null;
  closeSheet(false);
  commit();
  toast(c.stage === 'publiee' && prevStage !== 'publiee' ? '✅ Publiée ! Note les vues dans 2 ou 3 jours.' : 'Enregistré');
}

/* ---------- Autres feuilles ---------- */
function openPhase(id, format) {
  const p = id ? S.phases.find((x) => x.id === id) : null;
  const f = p?.format || format || D.wantedFormats.find((x) => !testedFormats().has(x)) || 'citation';
  const body = `
    <div class="field"><span>Format testé</span><div class="chips">${FORMATS.map((x) => chipRadio('format', x.id, `${x.emoji} ${x.label}`, x.id === f)).join('')}</div></div>
    <label class="field"><span>Nom de la phase</span><input name="name" value="${esc(p?.name || '')}" placeholder="Ex. : Citations photo + son" autocomplete="off"></label>
    <div class="field"><span>Nombre de vidéos (sans date limite)</span><div class="chips">${[3, 5, 7, 10].map((n) => chipRadio('goal', n, `${n} vidéos`, (p?.goal || 5) === n)).join('')}</div></div>
    <label class="field"><span>Ce que je veux tester <span class="muted">(facultatif)</span></span><textarea name="notes" rows="3" placeholder="Ex. : même fond noir, sons différents à chaque fois">${esc(p?.notes || '')}</textarea></label>
    ${p ? `<label class="field"><span>Ce que j’ai appris</span><textarea name="learnings" rows="3">${esc(p.learnings || '')}</textarea></label>` : ''}`;
  const foot = `${p ? '<button type="button" class="btn btn-danger" data-act="deletePhase" data-id="' + p.id + '">Supprimer</button><span class="spacer"></span>' : ''}<button class="btn btn-primary" type="submit">${p ? 'Enregistrer' : 'Lancer la phase'}</button>`;
  openSheet(p ? 'Modifier la phase' : 'Nouvelle phase de test', body, foot, { form: 'phase' }).dataset.id = p?.id || '';
}
function openEndPhase(id) {
  const p = S.phases.find((x) => x.id === id);
  if (!p) return;
  const avg = phaseAvg(p);
  const body = `<p style="margin-bottom:14px">${phasePublished(p).length} vidéos publiées${avg !== null ? `, ${fmtNum(avg)} vues en moyenne` : ''}. Bravo d’être allé au bout 💪</p>
    <div class="field"><span>Ton verdict</span><div class="chips">${Object.entries(VERDICTS).map(([k, l]) => chipRadio('verdict', k, l, k === 'garder')).join('')}</div></div>
    <label class="field"><span>Ce que j’ai appris</span><textarea name="learnings" rows="4" placeholder="Ce qui a marché, ce qui n’a pas marché, ce que je referais…">${esc(p.learnings || '')}</textarea></label>`;
  openSheet('Terminer la phase', body, '<button class="btn btn-primary" type="submit">Terminer la phase</button>', { form: 'endPhase' }).dataset.id = id;
}
function openIntention(date) {
  const body = `<p class="hint" style="margin-bottom:12px">${esc(fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' }))}. Touche une envie, ou écris la tienne.</p>
    <div class="chips" style="margin-bottom:16px">${D.intentionPresets.map((t) => `<button type="button" class="chip" data-act="quickIntention" data-text="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="inline-form"><input class="input" name="text" placeholder="Autre chose…" autocomplete="off"><button class="btn btn-primary" type="submit">Ajouter</button></div>`;
  openSheet('Ajouter une envie', body, '', { form: 'intention' }).dataset.date = date;
}
function openPerf(exId) {
  const ex = exById(exId);
  const isTime = ex.type === 'time';
  const num = (name, ph, extra = '') => `<input type="number" inputmode="numeric" min="0" name="${name}" placeholder="${ph}" ${extra}>`;
  const body = `
    ${isTime ? `<div class="field"><span>Temps</span><div class="time-inputs">
        <label>${num('h', '0')}<span>h</span></label>
        <label>${num('m', '00')}<span>min</span></label>
        <label>${num('s', '00', 'max="59"')}<span>s</span></label></div></div>`
      : `<label class="field"><span>Valeur (${D.exerciseTypes.find((t) => t.id === ex.type).unit})</span>
        <input name="value" type="number" inputmode="decimal" step="any" min="0" autocomplete="off" required></label>`}
    <label class="field"><span>Date</span><input type="date" name="date" value="${dkey()}" max="${dkey()}"></label>
    <label class="field"><span>Note <span class="muted">(facultatif)</span></span><input name="note" placeholder="Ex. : après une mauvaise nuit" autocomplete="off"></label>`;
  openSheet(esc(ex.name), body, '<button class="btn btn-primary" type="submit">Enregistrer</button>', { form: 'perf' }).dataset.id = ex.id;
}
function openExercise() {
  const body = `<label class="field"><span>Nom de l’exercice</span><input name="name" required autocomplete="off" placeholder="Ex. : Sled push 50 m"></label>
    <div class="field"><span>Type de mesure</span><div class="chips">${D.exerciseTypes.map((t, i) => chipRadio('type', t.id, t.label, i === 0)).join('')}</div></div>`;
  openSheet('Nouvel exercice', body, '<button class="btn btn-primary" type="submit">Créer</button>', { form: 'exercise' });
}
function openWin() {
  const icons = ['🏆', '🔥', '💪', '❤️', '🎬', '⭐', '🚀', '🥇', '🙌', '💚'];
  const body = `<label class="field"><span>Ma victoire</span><input name="text" required autocomplete="off" placeholder="Ex. : premier commentaire d’un inconnu"></label>
    <div class="field"><span>Icône</span><div class="chips">${icons.map((ic, i) => chipRadio('icon', ic, ic, i === 0)).join('')}</div></div>`;
  openSheet('Nouvelle victoire', body, '<button class="btn btn-primary" type="submit">Ajouter</button>', { form: 'win' });
}
function openGoal() {
  const body = `<label class="field"><span>Objectif</span><input name="text" required autocomplete="off" placeholder="Ex. : Faire 10 vidéos POV"></label>
    <div class="field"><span>Suivi</span><div class="chips">
      ${chipRadio('auto', '', '✋ Je compte moi-même', true)}
      ${chipRadio('auto', 'published', '🔄 Vidéos publiées', false)}
      ${chipRadio('auto', 'formats', '🔄 Formats testés', false)}
      ${chipRadio('auto', 'phases', '🔄 Phases terminées', false)}
      ${chipRadio('auto', 'journal', '🔄 Pages de journal', false)}
    </div></div>
    <label class="field"><span>Nombre à atteindre</span><input type="number" name="target" inputmode="numeric" min="1" value="10" required></label>`;
  openSheet('Nouvel objectif', body, '<button class="btn btn-primary" type="submit">Créer</button>', { form: 'goal' });
}
function openQuote() {
  const body = `<div class="field"><span>Type</span><div class="chips">${chipRadio('type', 'citation', '💬 Citation', UI.quoteType === 'citation')}${chipRadio('type', 'accroche', '⚡ Accroche', UI.quoteType === 'accroche')}</div></div>
    <label class="field"><span>Texte</span><textarea name="text" rows="3" required></textarea></label>
    <label class="field"><span>Auteur <span class="muted">(facultatif)</span></span><input name="author" autocomplete="off"></label>`;
  openSheet('Ajouter à la banque', body, '<button class="btn btn-primary" type="submit">Ajouter</button>', { form: 'quote' });
}
function openHabits() {
  const body = `<div id="habit-edit">${S.habits.map((h) => `<div class="inline-form" style="margin-bottom:8px">
      <input class="input" style="flex:0 0 64px;text-align:center" name="icon" value="${esc(h.icon)}" aria-label="Icône">
      <input class="input" name="name" value="${esc(h.name)}" aria-label="Nom"><input type="hidden" name="id" value="${esc(h.id)}">
      <button type="button" class="btn btn-ghost" data-act="removeHabitRow" aria-label="Retirer">✕</button></div>`).join('')}</div>
    <button type="button" class="btn btn-sm" data-act="addHabitRow">＋ Ajouter une habitude</button>
    <p class="hint" style="margin-top:12px">L’icône peut être n’importe quel emoji.</p>`;
  openSheet('Mes habitudes', body, '<button class="btn btn-primary" type="submit">Enregistrer</button>', { form: 'habits' });
}

/* ---------- Réglages, sauvegarde, bilan ---------- */
async function openSettings() {
  let usage = '';
  try { const e = await navigator.storage?.estimate?.(); if (e?.usage) usage = `${(e.usage / 1048576).toFixed(1).replace('.', ',')} Mo utilisés sur cet appareil.`; } catch {}
  const t = S.settings.theme;
  const themeBtn = (v, l) => `<button type="button" class="chip ${t === v ? 'on' : ''}" data-act="setTheme" data-val="${v}">${l}</button>`;
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const body = `
    <div class="field"><span>Apparence</span><div class="chips">${themeBtn('dark', '🌙 Sombre')}${themeBtn('auto', '📱 Comme l’iPad')}${themeBtn('light', '☀️ Clair')}</div></div>
    <div class="field"><span>Sauvegarde</span>
      <p class="hint" style="margin-bottom:10px">Tes données restent uniquement sur cet iPad. Exporte un fichier de temps en temps (dans Fichiers ou iCloud Drive) pour ne rien perdre.
      ${S.settings.lastExport ? `Dernière sauvegarde : ${esc(fmtDate(S.settings.lastExport, { day: 'numeric', month: 'long' }))}.` : 'Aucune sauvegarde pour l’instant.'} ${usage}</p>
      <div class="btn-row"><button type="button" class="btn btn-primary" data-act="exportData">💾 Exporter mes données</button>
      <label class="btn upload-btn">📂 Importer<input type="file" accept="application/json,.json" data-upload="import"></label></div></div>
    <div class="field"><span>Partager un bilan</span>
      <p class="hint" style="margin-bottom:10px">Un résumé de ta progression à envoyer (par message, par exemple). Rien n’est envoyé automatiquement.</p>
      <button type="button" class="btn" data-act="shareBilan">📤 Voir et partager mon bilan</button></div>
    ${!standalone ? `<div class="field"><span>Installer sur l’iPad</span><p class="hint">Dans Safari, touche le bouton Partager (carré avec une flèche), puis « Sur l’écran d’accueil ». L’appli s’ouvrira comme une vraie appli, même sans internet.</p></div>` : ''}
    <div class="field"><span>Zone sensible</span><button type="button" class="btn btn-danger" data-act="resetAll">Tout effacer</button></div>
    <p class="hint">Focus 20h · version 1.0</p>`;
  openSheet('Réglages', body);
}

async function exportData() {
  try {
    const images = await IMG.all();
    const payload = JSON.stringify({ app: 'focus20h', version: 1, exportedAt: new Date().toISOString(), state: S, images });
    const name = `focus20h-sauvegarde-${dkey()}.json`;
    const file = new File([payload], name, { type: 'application/json' });
    const download = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde Focus 20h' }); }
      catch (e) { if (e.name === 'AbortError') return; download(); }
    } else download();
    S.settings.lastExport = dkey();
    save(); render();
    if (!$('#sheet').hidden) openSettings();
    toast('💾 Sauvegarde prête. Choisis « Enregistrer dans Fichiers ».');
  } catch (e) { console.error(e); toast('La sauvegarde n’a pas marché. Réessaie.'); }
}
async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== 'focus20h' || !data.state) { toast('Ce fichier n’est pas une sauvegarde Focus 20h.'); return; }
    if (!confirm(`Remplacer toutes les données actuelles par la sauvegarde du ${new Date(data.exportedAt).toLocaleDateString('fr-FR')} ?`)) return;
    await IMG.clear();
    for (const [id, v] of Object.entries(data.images || {})) await IMG.put(id, v);
    S = normalize(data.state);
    milestonesReady = false;
    closeSheet();
    commit();
    toast('✅ Données importées');
  } catch (e) { console.error(e); toast('Impossible de lire ce fichier.'); }
}
function bilanText() {
  const pub = published();
  const fs = formatStats();
  const top = [...withViews()].sort((a, b) => viewsOf(b) - viewsOf(a))[0];
  const phase = activePhase();
  const days = Array.from({ length: 7 }, (_, i) => dkey(addDays(new Date(), i - 6)));
  const habits = S.habits.map((h) => `${h.icon} ${h.name} : ${days.filter((d) => (S.habitLog[d] || []).includes(h.id)).length}/7`).join('\n');
  const wins = allWins().slice(0, 3).map((w) => `${w.icon} ${w.text}`).join('\n');
  const totalViews = pub.reduce((a, c) => a + (viewsOf(c) || 0), 0);
  return [
    `📊 Bilan Focus 20h, ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    '',
    `🎬 ${pub.length} vidéos publiées, ${testedFormats().size} formats testés`,
    `👀 ${fmtNum(totalViews)} vues au total`,
    fs[0] ? `📈 Meilleur format : ${FMT[fs[0].key].label} (${fmtNum(fs[0].avg)} vues en moyenne)` : '',
    top ? `🥇 Meilleure vidéo : « ${top.title} » (${fmtNum(viewsOf(top))} vues)` : '',
    phase ? `🧪 Phase en cours : ${phase.name} (${phasePublished(phase).length}/${phase.goal})` : '',
    '',
    'Habitudes sur 7 jours :',
    habits,
    '',
    wins ? `Dernières victoires :\n${wins}` : '',
  ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n').trim();
}
function openBilan() {
  const text = bilanText();
  openSheet('Mon bilan', `<pre class="bilan">${esc(text)}</pre>`,
    `<button type="button" class="btn" data-act="copyBilan">Copier</button>${navigator.share ? '<button type="button" class="btn btn-primary" data-act="sendBilan">📤 Partager</button>' : ''}`);
}

/* ---------- Actions ---------- */
const findQuote = (id) => allQuotes().find((q) => q.id === id);
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('Copié'); }
  catch { toast('Copie impossible sur cet appareil'); }
}
function go(route, sub) {
  UI.route = route;
  if (sub) UI.sub[route] = sub;
  saveUI(); render(); window.scrollTo(0, 0);
}

const ACT = {
  go: (el) => go(el.dataset.route, el.dataset.sub),
  goIdeas: () => go('contenus', 'videos'),
  sub: (el) => { UI.sub[el.dataset.key] = el.dataset.val; saveUI(); render(); window.scrollTo(0, 0); },
  closeSheet: () => closeSheet(),
  openSettings: () => openSettings(),

  // Contenus
  newContent: () => openContent(null),
  editContent: (el) => openContent(el.dataset.id),
  advance: (el, e) => {
    e.stopPropagation();
    const c = S.contents.find((x) => x.id === el.dataset.id);
    const i = STAGES.findIndex((s) => s.id === c.stage);
    if (i >= STAGES.length - 1) return;
    c.stage = STAGES[i + 1].id;
    if (c.stage === 'publiee') { c.publishedAt = dkey(); toast('✅ Publiée ! Note les vues dans 2 ou 3 jours.'); }
    commit();
  },
  showAllPub: () => { UI.showAllPub = true; render(); },
  deleteContent: () => {
    if (!confirm('Supprimer cette vidéo ?')) return;
    const c = S.contents.find((x) => x.id === EDIT.c.id);
    [...(c?.images || []), ...EDIT.added].forEach((id) => IMG.del(id));
    S.contents = S.contents.filter((x) => x.id !== EDIT.c.id);
    EDIT = null; closeSheet(false); commit(); toast('Vidéo supprimée');
  },
  insertTemplate: () => {
    const form = $('#sheet form');
    const f = form.querySelector('input[name=format]:checked')?.value || 'autre';
    const ta = form.querySelector('textarea[name=script]');
    const tpl = D.templates[f] || D.templates.autre;
    ta.value = ta.value.trim() ? `${ta.value.trim()}\n\n${tpl}` : tpl;
    ta.focus();
  },
  useHook: (el) => { const input = $('#sheet input[name=hook]'); input.value = el.dataset.text; el.closest('details').open = false; },
  removeImg: (el) => {
    const id = el.dataset.id;
    EDIT.c.images = EDIT.c.images.filter((x) => x !== id);
    if (EDIT.added.includes(id)) { EDIT.added = EDIT.added.filter((x) => x !== id); IMG.del(id); } else EDIT.removed.push(id);
    el.closest('.thumb').remove();
  },
  viewImg: async (el, e) => {
    e.stopPropagation();
    const src = await IMG.get(el.dataset.id);
    if (!src) return;
    const lb = $('#lightbox'); lb.innerHTML = `<img src="${src}" alt="">`; lb.hidden = false;
  },
  closeLightbox: () => { const lb = $('#lightbox'); lb.hidden = true; lb.innerHTML = ''; },

  // Générateur
  genNext: () => { currentIdea = pickIdea(); render(); },
  genKeep: () => {
    const i = currentIdea;
    S.contents.push({ id: uid(), title: i.title, format: i.f, platforms: ['tiktok'], stage: 'idee', hook: i.hook, script: D.templates[i.f] || '', notes: `Comment filmer : ${i.how}`, phaseId: activePhase()?.format === i.f ? activePhase().id : null, createdAt: dkey(), publishedAt: null, stats: {}, images: [] });
    commit(); toast('💡 Ajoutée à tes idées');
    currentIdea = pickIdea(); render();
  },
  genFilter: (el) => { UI[el.dataset.key] = el.dataset.val; saveUI(); currentIdea = pickIdea(); render(); },
  genFormat: (el) => { UI.genFormat = el.dataset.arg || 'all'; UI.genTheme = 'all'; currentIdea = null; go('contenus', 'generateur'); },

  // Citations
  quoteType: (el) => { UI.quoteType = el.dataset.val; saveUI(); render(); },
  favOnly: () => { UI.favOnly = !UI.favOnly; saveUI(); render(); },
  favQuote: (el) => {
    const id = el.dataset.id;
    S.favQuotes = S.favQuotes.includes(id) ? S.favQuotes.filter((x) => x !== id) : [...S.favQuotes, id];
    commit();
  },
  quoteToVideo: (el) => {
    const q = findQuote(el.dataset.id);
    const isHook = q.type === 'accroche';
    openContent(null, { title: q.text.length > 60 ? q.text.slice(0, 57) + '…' : q.text, format: isHook ? 'pov' : 'citation', hook: q.text, script: isHook ? D.templates.pov : `« ${q.text} »${q.author ? `\n— ${q.author}` : ''}\n\n${D.templates.citation}` });
  },
  copyQuote: (el) => { const q = findQuote(el.dataset.id); copyText(q.author ? `« ${q.text} » — ${q.author}` : q.text); },
  deleteQuote: (el) => {
    if (!confirm('Supprimer de la banque ?')) return;
    S.myQuotes = S.myQuotes.filter((q) => q.id !== el.dataset.id);
    S.favQuotes = S.favQuotes.filter((x) => x !== el.dataset.id);
    commit();
  },
  addQuote: () => openQuote(),
  randomQuote: () => {
    UI.favOnly = false;
    const list = allQuotes().filter((q) => q.type === UI.quoteType);
    const q = rand(list);
    render();
    const card = document.getElementById('q-' + q.id);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.animate([{ outline: '3px solid var(--accent)' }, { outline: '3px solid transparent' }], { duration: 1600 });
  },
  useTemplate: (el) => openContent(null, { format: el.dataset.id, script: D.templates[el.dataset.id] }),

  // Tests
  newPhase: (el) => openPhase(null, el.dataset.arg),
  editPhase: (el) => openPhase(el.dataset.id),
  endPhase: (el) => openEndPhase(el.dataset.id || el.dataset.arg),
  deletePhase: (el) => {
    if (!confirm('Supprimer cette phase ? Les vidéos sont conservées.')) return;
    S.phases = S.phases.filter((p) => p.id !== el.dataset.id);
    S.contents.forEach((c) => { if (c.phaseId === el.dataset.id) c.phaseId = null; });
    closeSheet(); commit();
  },
  newContentInPhase: (el) => { const p = S.phases.find((x) => x.id === el.dataset.id); openContent(null, { format: p.format, phaseId: p.id }); },
  setPlat: (el) => { UI.plat = el.dataset.val; saveUI(); render(); },
  goQuickStats: () => { go('tests', 'analyse'); setTimeout(() => $('#quick-stats')?.scrollIntoView({ behavior: 'smooth' }), 50); },

  // Moi
  setMood: (el) => { const e = ensureJournal(); e.mood = Number(el.dataset.v); commit(); },
  deleteJournal: (el) => {
    if (!confirm('Supprimer cette page de journal ?')) return;
    const j = S.journal.find((x) => x.id === el.dataset.id);
    (j?.images || []).forEach((id) => IMG.del(id));
    S.journal = S.journal.filter((x) => x.id !== el.dataset.id);
    commit();
  },
  removeJournalImg: (el) => {
    const e = S.journal.find((j) => j.date === dkey());
    if (!e) return;
    e.images = e.images.filter((x) => x !== el.dataset.id);
    IMG.del(el.dataset.id); commit();
  },
  toggleHabit: (el) => {
    const { id, date } = el.dataset;
    const log = S.habitLog[date] || [];
    S.habitLog[date] = log.includes(id) ? log.filter((x) => x !== id) : [...log, id];
    if (!S.habitLog[date].length) delete S.habitLog[date];
    commit();
  },
  editHabits: () => openHabits(),
  addHabitRow: () => {
    $('#habit-edit').insertAdjacentHTML('beforeend', `<div class="inline-form" style="margin-bottom:8px"><input class="input" style="flex:0 0 64px;text-align:center" name="icon" value="⭐" aria-label="Icône"><input class="input" name="name" placeholder="Nouvelle habitude" aria-label="Nom"><input type="hidden" name="id" value="${uid()}"><button type="button" class="btn btn-ghost" data-act="removeHabitRow" aria-label="Retirer">✕</button></div>`);
    $$('#habit-edit input[name=name]').pop().focus();
  },
  removeHabitRow: (el) => el.closest('.inline-form').remove(),
  perfEx: (el) => { UI.perfEx = el.dataset.id; saveUI(); render(); },
  addPerf: (el) => openPerf(el.dataset.id),
  addExercise: () => openExercise(),
  deletePerf: (el) => { if (!confirm('Supprimer cette mesure ?')) return; S.perfs = S.perfs.filter((p) => p.id !== el.dataset.id); commit(); },
  addWin: () => openWin(),
  deleteWin: (el) => { if (!confirm('Supprimer cette victoire ?')) return; S.wins = S.wins.filter((w) => w.id !== el.dataset.id); commit(); },

  // Semaine
  week: (el) => { UI.weekOffset += Number(el.dataset.val); render(); },
  addIntention: (el) => openIntention(el.dataset.date),
  quickIntention: (el) => {
    S.intentions.push({ id: uid(), date: $('#sheet').dataset.date, text: el.dataset.text, done: false });
    closeSheet(); commit();
  },
  toggleIntention: (el) => { const i = S.intentions.find((x) => x.id === el.dataset.id); i.done = !i.done; commit(); },
  moveIntention: (el) => { const i = S.intentions.find((x) => x.id === el.dataset.id); i.date = dkey(addDays(parseD(i.date), 1)); commit(); toast('↪ Déplacé au lendemain'); },
  deleteIntention: (el) => { S.intentions = S.intentions.filter((x) => x.id !== el.dataset.id); commit(); },
  addGoal: () => openGoal(),
  goalStep: (el) => { const g = S.goals.find((x) => x.id === el.dataset.id); g.current = Math.max(0, (g.current || 0) + Number(el.dataset.val)); commit(); },
  deleteGoal: (el) => { if (!confirm('Supprimer cet objectif ?')) return; S.goals = S.goals.filter((g) => g.id !== el.dataset.id); commit(); },

  // Réglages
  setTheme: (el) => { S.settings.theme = el.dataset.val; save(); applyTheme(); openSettings(); },
  exportData: () => exportData(),
  shareBilan: () => openBilan(),
  copyBilan: () => copyText(bilanText()),
  sendBilan: async () => { try { await navigator.share({ title: 'Bilan Focus 20h', text: bilanText() }); } catch {} },
  resetAll: async () => {
    if (!confirm('Effacer TOUTES tes données ? Pense à exporter une sauvegarde avant.')) return;
    if (!confirm('Vraiment sûr ? C’est définitif.')) return;
    await IMG.clear();
    S = defaultState(); milestonesReady = false;
    closeSheet(); commit(); toast('Tout a été effacé');
  },
};

/* ---------- Formulaires ---------- */
const FORMS = {
  content: (form, fd) => saveContent(fd),
  quickIdea: (form, fd) => {
    const title = (fd.get('title') || '').trim();
    if (!title) return;
    const phase = activePhase();
    S.contents.push({ id: uid(), title, format: phase?.format || 'autre', platforms: ['tiktok'], stage: 'idee', hook: '', script: '', notes: '', phaseId: phase?.id || null, createdAt: dkey(), publishedAt: null, stats: {}, images: [] });
    commit(); toast('💡 Idée notée');
    $('#view input[name=title]')?.focus();
  },
  phase: (form, fd) => {
    const id = $('#sheet').dataset.id;
    const format = fd.get('format') || 'autre';
    const data = { format, name: (fd.get('name') || '').trim() || `Phase ${FMT[format].label.toLowerCase()}`, goal: Number(fd.get('goal')) || 5, notes: fd.get('notes') || '' };
    if (id) {
      const p = S.phases.find((x) => x.id === id);
      Object.assign(p, data);
      if (fd.has('learnings')) p.learnings = fd.get('learnings');
    } else {
      const cur = activePhase();
      if (cur && !confirm(`La phase « ${cur.name} » est encore en cours. La terminer et lancer la nouvelle ?`)) return;
      if (cur) cur.endedAt = dkey();
      S.phases.push({ id: uid(), ...data, startedAt: dkey(), endedAt: null, verdict: null, learnings: '' });
      toast('🧪 Phase lancée. Prends ton temps.');
    }
    closeSheet(); commit();
  },
  endPhase: (form, fd) => {
    const p = S.phases.find((x) => x.id === $('#sheet').dataset.id);
    p.endedAt = dkey(); p.verdict = fd.get('verdict'); p.learnings = fd.get('learnings') || '';
    closeSheet(); commit(); toast('🏁 Phase terminée. Bien joué !');
  },
  intention: (form, fd) => {
    const text = (fd.get('text') || '').trim();
    if (!text) return;
    S.intentions.push({ id: uid(), date: $('#sheet').dataset.date, text, done: false });
    closeSheet(); commit();
  },
  journal: (form, fd) => {
    const e = ensureJournal();
    e.text = (fd.get('text') || '').trim();
    commit(); toast('📝 Page enregistrée');
  },
  why: (form, fd) => {
    S.profile.why = (fd.get('why') || '').trim();
    S.profile.success = (fd.get('success') || '').split('\n').map((s) => s.trim()).filter(Boolean);
    commit(); toast('💚 Enregistré');
  },
  perf: (form, fd) => {
    const ex = exById($('#sheet').dataset.id);
    const n = (k) => Number(fd.get(k) || 0);
    const value = ex.type === 'time' ? n('h') * 3600 + n('m') * 60 + n('s') : Number(String(fd.get('value')).replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) { toast(ex.type === 'time' ? 'Indique au moins les minutes ou les secondes' : 'Valeur invalide'); return; }
    const prev = S.perfs.filter((p) => p.ex === ex.id);
    const record = prev.length && prev.every((p) => isBetter(ex, value, p.value));
    S.perfs.push({ id: uid(), ex: ex.id, value, date: fd.get('date') || dkey(), note: fd.get('note') || '' });
    closeSheet(); commit();
    toast(record ? '🏆 Nouveau record !' : '⏱️ Perf notée');
  },
  exercise: (form, fd) => {
    const name = (fd.get('name') || '').trim();
    if (!name) return;
    const ex = { id: 'c' + uid(), name, type: fd.get('type') || 'kg' };
    S.customExercises.push(ex); UI.perfEx = ex.id; saveUI();
    closeSheet(); commit();
  },
  win: (form, fd) => {
    const text = (fd.get('text') || '').trim();
    if (!text) return;
    S.wins.push({ id: uid(), text, icon: fd.get('icon') || '🏆', date: dkey() });
    closeSheet(); commit(); toast('🏆 Victoire ajoutée !');
  },
  goal: (form, fd) => {
    const text = (fd.get('text') || '').trim();
    if (!text) return;
    S.goals.push({ id: uid(), text, auto: fd.get('auto') || null, target: Math.max(1, Number(fd.get('target')) || 1), current: 0, doneAt: null });
    closeSheet(); commit();
  },
  quote: (form, fd) => {
    const text = (fd.get('text') || '').trim();
    if (!text) return;
    const type = fd.get('type') || 'citation';
    S.myQuotes.push({ id: 'm' + uid(), type, text, author: (fd.get('author') || '').trim() });
    UI.quoteType = type; saveUI();
    closeSheet(); commit(); toast('Ajouté à la banque');
  },
  habits: (form, fd) => {
    const ids = fd.getAll('id'), names = fd.getAll('name'), icons = fd.getAll('icon');
    S.habits = ids.map((id, i) => ({ id, name: names[i].trim(), icon: icons[i].trim() || '⭐' })).filter((h) => h.name);
    closeSheet(); commit();
  },
};

/* ---------- Événements ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  FORMS[form.dataset.form]?.(form, new FormData(form));
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.quickstat) {
    const c = S.contents.find((x) => x.id === t.dataset.quickstat);
    const v = Number(t.value);
    if (t.value === '' || !Number.isFinite(v) || v < 0) return;
    ((c.stats ||= {})[t.dataset.plat] ||= {}).views = v;
    commit(); toast('📊 Vues notées');
    return;
  }
  if (!t.dataset.upload) return;
  const files = [...(t.files || [])];
  if (!files.length) return;
  if (t.dataset.upload === 'import') { importData(files[0]); t.value = ''; return; }
  toast('📷 Ajout de la photo…');
  const ids = [];
  for (const f of files) {
    try { const data = await compressImage(f); const id = 'img' + uid(); await IMG.put(id, data); ids.push(id); }
    catch (err) { console.error(err); toast('Impossible d’ajouter cette photo'); }
  }
  t.value = '';
  if (!ids.length) return;
  if (t.dataset.upload === 'content' && EDIT) {
    EDIT.c.images.push(...ids); EDIT.added.push(...ids);
    $('#edit-thumbs').insertAdjacentHTML('beforeend', thumbsHtml(ids, true));
    hydrateImages($('#edit-thumbs'));
  } else if (t.dataset.upload === 'journal') {
    const entry = ensureJournal();
    const ta = $('#view textarea[name=text]');
    if (ta) entry.text = ta.value.trim();
    entry.images = [...(entry.images || []), ...ids];
    commit();
  }
  toast('📷 Photo ajoutée');
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#lightbox').hidden) ACT.closeLightbox();
  else if (!$('#sheet').hidden) closeSheet();
});
// Recharge l'affichage quand on revient sur l'appli un autre jour.
let lastDay = dkey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dkey() !== lastDay && $('#sheet').hidden) { lastDay = dkey(); render(); }
});

/* ---------- Démarrage ---------- */
applyTheme();
checkMilestones();
save();
render();
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}
