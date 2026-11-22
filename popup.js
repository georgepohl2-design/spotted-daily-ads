import {
  loadData, todayISO, niceDate, pastPicks, pickToday, issueNumber, streetCred, safeUrl, store, weekday,
} from './lib/data.js';

const $ = (id) => document.getElementById(id);
const hasExt = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);

// For testing: popup.html?date=2026-12-25 pretends it's that day.
const params = new URLSearchParams(location.search);
const TODAY = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : todayISO();

const TITLES = { spotlight: 'Spotted.', guru: 'Guru says', league: 'Ad League', archive: 'Archive' };

let DATA = null;

// Small DOM helper: el('p', {class: 'x'}, 'text', childNode)
function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'onclick') node.addEventListener('click', v);
    else node.setAttribute(k, v);
  }
  for (const kid of kids) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function link(text, url, cls) {
  const href = safeUrl(url);
  if (!href) return el('span', { class: cls }, text);
  return el('a', { href, target: '_blank', rel: 'noopener', class: cls }, text);
}

// Award badge: only shown when the work has won a major award.
function stickerText(award) {
  return [award.prize, award.show].filter(Boolean).join(' · ');
}

function renderCard(s) {
  return el('article', { class: 'card' },
    el('p', { class: 'label' }, s.throwback ? `Throwback ${weekday(s.featureDate)}: still slaps` : 'Spotted ad:'),
    el('h2', { class: 'brand' }, s.brand),
    el('p', { class: 'agency' }, el('span', { class: 'by' }, 'by '), link(`${s.agency}${safeUrl(s.agencyUrl) ? ' ↗' : ''}`, s.agencyUrl)),
    el('div', { class: 'card-row' },
      el('p', { class: 'row-label' }, 'Campaign'),
      el('p', { class: 'campaign' }, `“${s.campaign}”`),
      s.award ? el('span', { class: 'sticker' }, stickerText(s.award)) : null,
    ),
    el('div', { class: 'card-row' },
      el('p', { class: 'row-label' }, "Why it's good"),
      el('p', { class: 'blurb' }, s.blurb),
    ),
    link(`Read more on ${s.source.name} ↗`, s.source.url, 'btn'),
    s.throwback
      ? el('p', { class: 'released' }, 'Not new. Won stuff. Deal with it.')
      : el('p', { class: 'released' }, `Released ${niceDate(s.campaignDate, true)}`),
  );
}

function renderEmpty() {
  return el('div', { class: 'empty' },
    el('img', { src: 'icons/icon128.png', alt: '' }),
    el('h2', {}, 'Nothing today'),
    el('p', {}, "The gull's on a break. Nothing fresh in the last four weeks."),
    el('button', { class: 'btn ghost', onclick: () => showTab('archive') }, 'Have a look at old stuff'),
  );
}

// Weekends: no new ad, just abuse. The button still shows Friday's.
const WEEKEND = {
  Saturday: ['Why are you looking at me?', "It's Saturday. You shouldn't be working, you absolute loser. Go outside. New ad Monday."],
  Sunday: ['On the seventh day, we rest.', 'Even the gull is having a lie-in. New ad tomorrow at midday.'],
};
function renderWeekend(day, pick) {
  const [head, line] = WEEKEND[day];
  const box = $('tab-spotlight');
  return el('div', { class: 'empty' },
    el('img', { src: 'icons/icon128.png', alt: '' }),
    el('h2', {}, head),
    el('p', {}, line),
    pick
      ? el('button', { class: 'btn ghost', onclick: () => box.replaceChildren(renderCard(pick)) }, "Fine. Show me Friday's")
      : null,
  );
}

/* ---------- Spotlight ---------- */
function renderSpotlight() {
  const spots = DATA.spotlights.spotlights;
  const pick = pickToday(spots, TODAY);
  const box = $('tab-spotlight');
  const day = weekday(TODAY);
  if (WEEKEND[day]) box.replaceChildren(renderWeekend(day, pick));
  else box.replaceChildren(pick ? renderCard(pick) : renderEmpty());
  $('mast-meta').dataset.spotlight = WEEKEND[day] ? 'Closed' : pick ? `No. ${String(issueNumber(spots, pick)).padStart(3, '0')}` : '';
}

/* ---------- Guru says ---------- */
async function renderGuru() {
  const quotes = DATA.quotes.quotes;
  if (!quotes.length) return;
  const last = await store.get('lastQuote');
  let i = Math.floor(Math.random() * quotes.length);
  if (quotes.length > 1 && i === last) i = (i + 1) % quotes.length;
  const forced = Number(params.get('quote')); // for screenshots: ?quote=3
  if (params.has('quote') && quotes[forced]) i = forced;
  await store.set('lastQuote', i);
  const q = quotes[i];
  $('quote-text').textContent = `“${q.text}”`;
  const a = $('quote-person');
  a.textContent = `${q.person} ↗`;
  const href = safeUrl(q.link);
  if (href) a.href = href; else a.removeAttribute('href');
}

/* ---------- Ad League ---------- */
let showAll = false;
function renderLeague() {
  const rows = streetCred(DATA.league, DATA.spotlights.spotlights, TODAY);
  const list = $('league-list');
  const shown = showAll ? rows : rows.slice(0, 10);
  let rank = 0; let prev = null;
  list.replaceChildren(...shown.map((r, idx) => {
    if (r.cred !== prev) { rank = idx + 1; prev = r.cred; }
    const why = [
      r.prizes ? `${r.prizes} top prize${r.prizes > 1 ? 's' : ''}` : null,
      r.features ? `spotted ${r.features}×` : null,
    ].filter(Boolean).join(', ');
    return el('li', { title: why },
      el('span', {}, el('span', { class: 'rank' }, `${rank}.`), link(`${r.name}${safeUrl(r.url) ? ' ↗' : ''}`, r.url)),
      el('span', { class: 'cred' }, r.cred),
    );
  }));
  const more = $('league-more');
  more.hidden = rows.length <= 10;
  more.textContent = showAll ? 'Just the top 10' : `See the rest (${rows.length - 10} more)`;
  $('league-shows').textContent = `Counted so far: ${DATA.league.showsCounted.join(', ')}. More shows coming.`;
}

/* ---------- Archive ---------- */
function renderArchive() {
  const q = $('archive-search').value.trim().toLowerCase();
  const picks = pastPicks(DATA.spotlights.spotlights, TODAY);
  const hits = picks.filter((s) => {
    if (!q) return true;
    const hay = [s.brand, s.agency, s.campaign, s.blurb, s.source.name,
      s.award ? stickerText(s.award) : '', ...(s.tags || [])].join(' ').toLowerCase();
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
  $('archive-list').replaceChildren(...hits.map((s) => el('li', {},
    el('button', { onclick: () => openArchiveItem(s) },
      el('span', {}, el('b', {}, s.brand), el('span', { class: 'by' }, ` by ${s.agency}`)),
    ),
  )));
  $('archive-empty').hidden = hits.length > 0;
}

function openArchiveItem(s) {
  $('archive-card').replaceChildren(renderCard(s));
  $('archive-list-view').hidden = true;
  $('archive-detail-view').hidden = false;
}

function closeArchiveItem() {
  $('archive-detail-view').hidden = true;
  $('archive-list-view').hidden = false;
}

/* ---------- Tabs ---------- */
function showTab(name) {
  for (const b of document.querySelectorAll('.tabs button')) {
    b.setAttribute('aria-selected', String(b.dataset.tab === name));
  }
  for (const key of Object.keys(TITLES)) $('tab-' + key).hidden = key !== name;
  $('mast-title').textContent = TITLES[name];
  $('mast-meta').textContent = name === 'spotlight' ? ($('mast-meta').dataset.spotlight || '') : name === 'league' ? '2K26 season' : '';
  if (name === 'guru') renderGuru();
  if (name === 'archive') closeArchiveItem();
}

/* ---------- Start ---------- */
async function start() {
  for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => showTab(b.dataset.tab));
  $('archive-search').addEventListener('input', renderArchive);
  $('archive-back').addEventListener('click', closeArchiveItem);
  $('league-more').addEventListener('click', () => { showAll = !showAll; renderLeague(); });

  DATA = await loadData();
  renderSpotlight();
  renderLeague();
  renderArchive();
  const startTab = params.get('tab');
  showTab(TITLES[startTab] ? startTab : 'spotlight');

  // Opening the popup counts as "seen": clear the yellow dot.
  await store.set('lastSeen', TODAY);
  if (hasExt) chrome.action.setBadgeText({ text: '' });
}

start().catch((err) => {
  console.error(err);
  $('tab-spotlight').replaceChildren(el('p', { class: 'muted' }, "Something broke. The gull is looking into it."));
});
