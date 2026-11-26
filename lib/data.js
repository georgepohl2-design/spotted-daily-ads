// Shared helpers for the popup and the background worker.
import { REMOTE_BASE, MAX_AGE_DAYS } from './config.js';

const FILES = ['spotlights', 'quotes', 'league'];

// Works inside Chrome as an extension, and as a plain web page when previewing.
const hasExt = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
const localUrl = (path) => (hasExt ? chrome.runtime.getURL(path) : new URL('../' + path, import.meta.url).href);

export const store = {
  async get(key, area = 'local') {
    if (hasExt) return (await chrome.storage[area].get(key))[key];
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return undefined; }
  },
  async set(key, value, area = 'local') {
    if (hasExt) return chrome.storage[area].set({ [key]: value });
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* ignore */ }
  },
};

async function fetchJson(url, ms = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// The picks only change once a day, so download them once a day and reuse that copy.
// Order: today's saved copy, else a fresh online copy, else the last saved copy, else
// the bundled copy. If the bundled copy is newer than any of those, the bundled one wins.
export async function loadData() {
  const out = {};
  const today = todayISO();
  await Promise.all(FILES.map(async (name) => {
    let data = (await store.get('fetched_' + name)) === today ? (await store.get('cache_' + name)) || null : null;
    if (!data && REMOTE_BASE && hasExt) {
      try {
        data = await fetchJson(REMOTE_BASE + name + '.json');
        await store.set('cache_' + name, data);
        await store.set('fetched_' + name, today);
      } catch (_) { /* offline or not published yet: try again next time */ }
    }
    if (!data) data = (await store.get('cache_' + name)) || null;
    const bundled = await fetchJson(localUrl('data/' + name + '.json'));
    if (!data || (data.updated || '') < (bundled.updated || '')) data = bundled;
    out[name] = data;
  }));
  return out;
}

// Dates are plain 'YYYY-MM-DD' strings in the viewer's local time.
export function todayISO(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

export function niceDate(iso, withYear = false) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', withYear
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short' });
}

// Each pick comes out at 12:00 on its day, on the computer's own clock, wherever it is.
export const beforeNoon = () => new Date().getHours() < 12;
const heldBack = (today) => today === todayISO() && beforeNoon();

// Picks that are already out, newest first. Before 12:00, today's isn't out yet.
export function pastPicks(spots, today) {
  const hold = heldBack(today);
  return spots
    .filter((s) => s.featureDate < today || (s.featureDate === today && !hold))
    .sort((a, b) => (a.featureDate < b.featureDate ? 1 : -1));
}

// 'Monday'...'Sunday' for a YYYY-MM-DD date.
export function weekday(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
}
export const isWeekend = (iso) => ['Saturday', 'Sunday'].includes(weekday(iso));

// The midday alert, kept dead simple so it scans in a second. Chrome adds "Spotted." itself.
//   Heineken                          <- title (bold, the biggest text in the alert)
//   Publicis Dublin & LePub Milan     <- message
// The test alert on the setup page looks exactly the same.
export function alertTitle(pick) {
  return pick.brand;
}

// Some great work has no agency credited anywhere. Then we say so, never guess.
export const hasAgency = (pick) => pick.agencyKey !== 'none';

export function alertMessage(pick) {
  return hasAgency(pick) ? pick.agency : 'No agency found';
}

// Today's pick: the latest one that has run, but only if it's still fresh.
// Throwbacks are old on purpose, so their clock starts on the day they ran.
export function pickToday(spots, today) {
  const latest = pastPicks(spots, today)[0];
  if (!latest) return null;
  const from = latest.throwback ? latest.featureDate : latest.campaignDate;
  if (daysBetween(from, today) > MAX_AGE_DAYS) return null;
  return latest;
}

export function issueNumber(spots, pick) {
  const sorted = [...spots].sort((a, b) => (a.featureDate < b.featureDate ? -1 : 1));
  return sorted.indexOf(pick) + 1;
}

// Spotted League Table. Starting points: 3 for each 2026 top prize (the tally has
// only just begun). Then agencies score when their work is the Spotted ad: usually
// 1 point a pick, 2 or 3 for something super special. In-house teams are left out.
export function streetCred(league, spots, today) {
  const table = new Map();
  const row = (key, fallback) => {
    const a = league.agencies[key];
    if (!key || (a && a.inHouse)) return null;
    if (!table.has(key)) table.set(key, { key, name: a ? a.name : fallback, prizes: 0, features: 0, cred: 0, last: '' });
    return table.get(key);
  };
  for (const w of league.wins || []) {
    const r = row(w.agencyKey, w.agencyKey);
    if (!r) continue;
    r.prizes += 1;
    r.cred += (league.points && league.points.startingPrize) || 3;
  }
  for (const s of pastPicks(spots, today)) {
    const r = row(s.agencyKey, s.agency);
    if (!r) continue;
    r.features += 1;
    r.cred += Number(s.points) || 1;
    if (s.featureDate > r.last) r.last = s.featureDate;
  }
  // Ties go to whoever was spotted most recently.
  return [...table.values()].sort((x, y) => y.cred - x.cred || (x.last < y.last ? 1 : x.last > y.last ? -1 : 0) || x.name.localeCompare(y.name));
}

// Only ever link out to https addresses.
export function safeUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url.href : null;
  } catch (_) {
    return null;
  }
}
