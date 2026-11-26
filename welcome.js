// Opens once, on install: set up the midday alert, test it, pin the gull.
import { store, loadData, pastPicks, todayISO, alertMessage, alertTitle } from './lib/data.js';
import { setNewDot } from './lib/newdot.js';
import { FEEDBACK_URL } from './lib/config.js';

if (FEEDBACK_URL) { document.getElementById('feedback-link').href = FEEDBACK_URL; document.getElementById('feedback').hidden = false; }

const $ = (id) => document.getElementById(id);
const hasExt = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);

const platform = navigator.userAgentData?.platform || navigator.platform || '';
const isMac = /Mac/i.test(platform);
const isWin = /Win/i.test(platform);

const SETUP = isMac ? [
  'Click the button above. It opens <b>Google Chrome Helper (Alerts)</b> in your Mac\'s settings. (If you land on the full list instead, scroll down and click it.) This is the one the midday alert comes through.',
  'Turn on <b>Allow notifications</b> and pick <b>Alerts</b>, so it stays on screen until you click it.',
  'Make sure <b>Focus</b> (Do Not Disturb) is off at midday.',
] : isWin ? [
  'Click the button above (or open <b>Settings</b>, then <b>System</b>, then <b>Notifications</b>).',
  'Turn notifications on, and turn on <b>Google Chrome</b>.',
  'Make sure <b>Do not disturb</b> is off at midday.',
] : [
  'Open your computer\'s notification settings.',
  'Allow notifications from <b>Google Chrome</b>.',
  'Make sure Do Not Disturb is off at midday.',
];
// Jump straight to the right settings page (the computer asks "Open System Settings?" first).
// On a Mac, straight to "Google Chrome Helper (Alerts)": the midday alert stays on screen,
// and macOS sends those through that helper, not through "Google Chrome" itself.
const MAC_ALERTS = 'x-apple.systempreferences:com.apple.Notifications-Settings.extension?id=com.google.Chrome.framework.AlertNotificationService';
const SETTINGS = isMac ? MAC_ALERTS : isWin ? 'ms-settings:notifications' : null;
if (SETTINGS) { $('open-settings').href = SETTINGS; $('open-settings').hidden = false; }

$('setup-steps').innerHTML = SETUP.map((s) => `<li>${s}</li>`).join('');

function show(id) {
  for (const x of ['did-it', 'sorted', 'fix']) $(x).hidden = x !== id;
}

// Sent exactly like the real midday alert (stays on screen until clicked). On a Mac those
// go through "Google Chrome Helper (Alerts)", so the test only passes if that's allowed too.
async function notify(message, title = 'Spotted.') {
  await chrome.notifications.clear('spotted-test');
  await chrome.notifications.create('spotted-test', {
    type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 2, requireInteraction: true,
  });
}

// The test looks exactly like a real midday alert, using the latest pick.
async function testAlert() {
  try {
    const data = await loadData();
    const pick = pastPicks(data.spotlights.spotlights, todayISO())[0];
    if (pick) return [alertMessage(pick), alertTitle(pick)];
  } catch (_) { /* fall back below */ }
  return ["You'll get one of these at 12:00 every weekday.", 'Spotted.'];
}

async function sendTest() {
  if (!hasExt) return show('did-it'); // page opened outside the extension (preview)
  if ((await chrome.notifications.getPermissionLevel()) === 'denied') {
    $('fix-text').innerHTML = '<b>Chrome has blocked Spotted\'s alerts.</b> Go to chrome://extensions, open Spotted, and allow notifications.';
    return show('fix');
  }
  await notify(...(await testAlert()));
  setNewDot(true).catch(() => {}); // and the blue "1" on the gull; opening the popup clears it
  setTimeout(() => show('did-it'), 1200);
}

$('send-test').addEventListener('click', sendTest);
$('try-again').addEventListener('click', sendTest);
$('yes').addEventListener('click', async () => {
  await store.set('alertsChecked', true);
  show('sorted');
  $('send-test').textContent = 'Send another test';
});
$('no').addEventListener('click', () => {
  show('fix');
  $('step-setup').scrollIntoView({ behavior: 'smooth' });
  $('step-setup').classList.add('flash');
});

// Say hello straight away. On a computer that's never asked about Chrome alerts,
// this is what makes the "Allow notifications?" box appear right now.
if (hasExt) notify("You're in. This is what the midday alert looks like.").catch(() => {});
