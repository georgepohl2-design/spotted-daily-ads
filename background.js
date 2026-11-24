// Background worker: the midday nudge and the blue "1" for a new pick.
import { loadData, todayISO, pickToday, store, isWeekend, alertMessage, alertTitle } from './lib/data.js';
import { setNewDot } from './lib/newdot.js';
import { FEEDBACK_URL } from './lib/config.js';

// Uninstalling opens the feedback form, so we can ask why.
if (FEEDBACK_URL) chrome.runtime.setUninstallURL(FEEDBACK_URL);

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
// four weeks, but the blue "1" and the nudge only fire for a brand-new one.
async function todaysPick() {
  const data = await loadData();
  return pickToday(data.spotlights.spotlights, todayISO());
}
// Never at weekends: the gull is off.
const isNew = (pick) => pick && pick.featureDate === todayISO() && !isWeekend(todayISO());

// A small blue "1" on the icon if today's new pick hasn't been opened yet.
async function refreshBadge(pick) {
  const seen = (await store.get('lastSeen')) === todayISO();
  await setNewDot(isNew(pick) && !seen);
}

// If Chrome was closed or the laptop asleep at noon, send it as soon as we're back (until 8pm).
const pastNoon = () => { const h = new Date().getHours(); return h >= 12 && h < 20; };

async function middayNudge() {
  const pick = await todaysPick();
  await refreshBadge(pick);
  if (!isNew(pick)) return;
  const today = todayISO();
  if ((await store.get('lastNotified')) === today) return;
  // Only count it as sent once Chrome has actually shown it.
  await chrome.notifications.create(`spotted-${today}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: alertTitle(pick),
    message: alertMessage(pick),
    priority: 2,
    requireInteraction: true, // stays on screen until clicked, where the computer allows it
  });
  await store.set('lastNotified', today);
}

// Badge, plus a late nudge if noon was missed.
async function check() {
  const seen = (await store.get('lastSeen')) === todayISO();
  if (pastNoon() && !seen) return middayNudge();
  return refreshBadge(await todaysPick());
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await schedule();
  // First install: open the page that tests the alert, so nobody misses midday.
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    return refreshBadge(await todaysPick());
  }
  check();
});

chrome.runtime.onStartup.addListener(async () => {
  await schedule();
  check();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === NOON) return middayNudge();
  if (alarm.name === HOURLY) return check();
});

chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  if (id === 'spotted-test') return;
  try {
    await chrome.action.openPopup();
  } catch (_) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});
