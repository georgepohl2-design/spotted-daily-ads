// Background worker: the midday nudge and the yellow "new pick" dot.
import { loadData, todayISO, pickToday, store, weekday, isWeekend } from './lib/data.js';

const NOON = 'midday-nudge';
const HOURLY = 'badge-check';

function nextNoon() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

async function schedule() {
  await chrome.alarms.clear(NOON);
  chrome.alarms.create(NOON, { when: nextNoon(), periodInMinutes: 24 * 60 });
  chrome.alarms.create(HOURLY, { periodInMinutes: 60 });
}

// The pick to show today. The popup keeps showing the latest pick for up to
// four weeks, but the dot and the nudge only fire for a brand-new one.
async function todaysPick() {
  const data = await loadData();
  return pickToday(data.spotlights.spotlights, todayISO());
}
// Never at weekends: the gull is off.
const isNew = (pick) => pick && pick.featureDate === todayISO() && !isWeekend(todayISO());

// Yellow dot on the icon if today's new pick hasn't been opened yet.
async function refreshBadge(pick) {
  const seen = (await store.get('lastSeen')) === todayISO();
  if (isNew(pick) && !seen) {
    await chrome.action.setBadgeBackgroundColor({ color: '#FAC775' });
    await chrome.action.setBadgeText({ text: ' ' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

async function middayNudge() {
  const pick = await todaysPick();
  await refreshBadge(pick);
  if (!isNew(pick)) return;
  const today = todayISO();
  if ((await store.get('lastNotified')) === today) return;
  await store.set('lastNotified', today);
  chrome.notifications.create(`spotted-${today}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Spotted.',
    message: `${pick.throwback ? `Throwback ${weekday(today)}: ` : ''}${pick.brand} by ${pick.agency}`,
    priority: 0,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await schedule();
  refreshBadge(await todaysPick());
});

chrome.runtime.onStartup.addListener(async () => {
  await schedule();
  refreshBadge(await todaysPick());
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === NOON) return middayNudge();
  if (alarm.name === HOURLY) return refreshBadge(await todaysPick());
});

chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  try {
    await chrome.action.openPopup();
  } catch (_) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});
