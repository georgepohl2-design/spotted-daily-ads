// The "new pick" marker: a blue "1" on the gull in the toolbar, like an unread message.
// It uses Chrome's own badge, which Chrome draws itself, so it looks the same on every
// computer. (We used to paint the dot onto the icon, but on some Macs the colours came
// out wrong and it showed as a yellow blob.) Blue, because the icon is already red.

export const DOT_COLOUR = '#1A73E8';
const ICONS = Object.fromEntries([16, 32, 48, 128].map((s) => [s, `icons/icon${s}.png`]));

// Show or hide the blue "1" on the toolbar icon.
export async function setNewDot(on) {
  // Always put the plain gull back first, wiping any icon an older version painted.
  await chrome.action.setIcon({ path: ICONS });
  await chrome.action.setBadgeBackgroundColor({ color: DOT_COLOUR });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  await chrome.action.setBadgeText({ text: on ? '1' : '' });
}
