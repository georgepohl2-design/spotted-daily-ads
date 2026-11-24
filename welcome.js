// Opens once, on install: set up the midday alert, test it, pin the gull.
import { store, loadData, pastPicks, todayISO, alertMessage, alertTitle } from './lib/data.js';
import { setNewDot } from './lib/newdot.js';

const $ = (id) => document.getElementById(id);
const hasExt = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);

const platform = navigator.userAgentData?.platform || navigator.platform || '';
const isMac = /Mac/i.test(platform);
const isWin = /Win/i.test(platform);

const SETUP = isMac ? [
  'Click the button above (or open <b>System Settings</b>, then <b>Notifications</b>).',
  'Click <b>Google Chrome</b>. Turn on <b>Allow notifications</b> and pick <b>Alerts</b>, so it stays until you click it.',
  'If you see <b>Google Chrome Helper (Alerts)</b>, do the same there.',
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
const SETTINGS = isMac ? 'x-apple.systempreferences:com.apple.preference.notifications' : isWin ? 'ms-settings:notifications' : null;
if (SETTINGS) { $('open-settings').href = SETTINGS; $('open-settings').hidden = false; }

$('setup-steps').innerHTML = SETUP.map((s) => `<li>${s}</li>`).join('');

function show(id) {
  for (const x of ['did-it', 'sorted', 'fix']) $(x).hidden = x !== id;
}

async function notify(message, title = 'Spotted.') {
  await chrome.notifications.clear('spotted-test');
  await chrome.notifications.create('spotted-test', {
    type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 2,
  });
}

// The test looks exactly like a real midday alert, using the latest pick.
async function testAlert() {
  try {
    const data = await loadData();
    const pick = pastPicks(data.spotlights.spotlights, todayISO())[0];
    if (pick) return [alertMessage(pick), alertTitle(pick, true)];
  } catch (_) { /* fall back below */ }
  return ["You'll get one of these at 12:00 every weekday.", 'Spotted. Test alert'];
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
  await store.set('alertsOk', true);
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
