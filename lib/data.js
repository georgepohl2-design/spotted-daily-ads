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

// Online copy first, then the last online copy we saved, then the bundled copy.
// If the bundled copy is newer than what we got online, the bundled one wins.
export async function loadData() {
  const out = {};
  await Promise.all(FILES.map(async (name) => {
    let data = null;
    if (REMOTE_BASE && hasExt) {
      try {
        data = await fetchJson(REMOTE_BASE + name + '.json');
        await store.set('cache_' + name, data);
      } catch (_) { /* offline or not published yet */ }
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

// Picks that have already run, newest first.
export function pastPicks(spots, today) {
  return spots
    .filter((s) => s.featureDate <= today)
    .sort((a, b) => (a.featureDate < b.featureDate ? 1 : -1));
}

// 'Monday'...'Sunday' for a YYYY-MM-DD date.
export function weekday(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
}
export const isWeekend = (iso) => ['Saturday', 'Sunday'].includes(weekday(iso));

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

// Points for one award win: depends on the level of the prize (up to 10),
// and any prize at a smaller show counts 1.
export function prizePoints(league, w) {
  const pts = league.points;
  if ((league.smallShows || []).some((s) => (w.show || '').startsWith(s))) return pts.smallShow ?? 1;
  const prize = (w.prize || '').toLowerCase();
  for (const [name, value] of Object.entries(pts.prizes || {})) if (prize.includes(name)) return value;
  return pts.topPrize;
}

// Street cred = points for official award wins + times featured in Spotted (so far).
export function streetCred(league, spots, today) {
  const table = new Map();
  const row = (key) => {
    if (!table.has(key)) {
      const a = league.agencies[key] || { name: key, url: null };
      table.set(key, { key, name: a.name, url: a.url, prizes: 0, features: 0, cred: 0 });
    }
    return table.get(key);
  };
  for (const w of league.wins) {
    const r = row(w.agencyKey);
    r.prizes += 1;
    r.cred += prizePoints(league, w);
  }
  for (const s of pastPicks(spots, today)) {
    if (!s.agencyKey) continue;
    const r = row(s.agencyKey);
    r.features += 1;
    r.cred += league.points.spottedFeature;
  }
  return [...table.values()].sort((a, b) => b.cred - a.cred || a.name.localeCompare(b.name));
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
