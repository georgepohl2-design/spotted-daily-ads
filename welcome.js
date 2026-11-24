// Opens once, on install: test the midday alert and fix it if the computer hides it.
import { store } from './lib/data.js';

const $ = (id) => document.getElementById(id);
const hasExt = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);

const isMac = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform || '');
const isWin = /Win/i.test(navigator.userAgentData?.platform || navigator.platform || '');

const FIX = isMac ? [
  'Open <b>System Settings</b>, then <b>Notifications</b>.',
  'Click <b>Google Chrome</b>. Turn on <b>Allow notifications</b> and pick <b>Alerts</b> (they stay until you click).',
  'If you see <b>Google Chrome Helper (Alerts)</b>, do the same there.',
  'Check <b>Focus</b> or Do Not Disturb is off.',
] : isWin ? [
  'Open <b>Settings</b>, then <b>System</b>, then <b>Notifications</b>.',
  'Turn on notifications, and turn on <b>Google Chrome</b>.',
  'Check <b>Do not disturb</b> is off.',
] : [
  'Open your computer\'s notification settings.',
  'Allow notifications from <b>Google Chrome</b>.',
  'Check Do Not Disturb is off.',
];

function show(id) {
  for (const x of ['did-it', 'sorted', 'fix']) $(x).hidden = x !== id;
}

async function sendTest() {
  if (!hasExt) return show('did-it'); // page opened outside the extension (preview)
  const level = await chrome.notifications.getPermissionLevel();
  if (level === 'denied') {
    $('fix-steps').innerHTML = '<li>Chrome has blocked Spotted\'s alerts. Go to <b>chrome://extensions</b>, open Spotted, and allow notifications.</li>';
    return show('fix');
  }
  await chrome.notifications.clear('spotted-test');
  await chrome.notifications.create('spotted-test', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Spotted.',
    message: "Test alert. You'll get one of these at 12:00 every weekday.",
    priority: 2,
  });
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
  $('fix-steps').innerHTML = FIX.map((s) => `<li>${s}</li>`).join('');
  show('fix');
});
