// The "new pick" marker: a small phone-style "1" in the bottom-right of the gull icon.
// Drawn onto the icon itself (Chrome's own badge is too big and covers the gull).
// Blue, because the icon is red, so a red WhatsApp-style dot would disappear.

export const DOT_COLOUR = '#1A73E8';
const SIZES = [16, 32];
const ICONS = Object.fromEntries([16, 32, 48, 128].map((s) => [s, `icons/icon${s}.png`]));

// Draws the dot on an icon already painted on ctx (s x s pixels).
export function drawDot(ctx, s, colour = DOT_COLOUR, label = '1') {
  const r = s * 0.25;
  const cx = s - r - s * 0.02;
  const cy = s - r - s * 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, r + Math.max(1, s * 0.05), 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF'; // thin white ring so it reads on red
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = colour;
  ctx.fill();
  if (s >= 32 && label) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(r * 1.45)}px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + r * 0.08);
  }
}

async function iconData(s, colour) {
  const blob = await (await fetch(chrome.runtime.getURL(ICONS[s]))).blob();
  const img = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(s, s);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, s, s);
  drawDot(ctx, s, colour);
  return ctx.getImageData(0, 0, s, s);
}

// Show or hide the marker on the toolbar icon.
export async function setNewDot(on) {
  if (chrome.action.setBadgeText) await chrome.action.setBadgeText({ text: '' }); // clear the old yellow badge
  if (!on) return chrome.action.setIcon({ path: ICONS });
  const imageData = {};
  for (const s of SIZES) imageData[s] = await iconData(s, DOT_COLOUR);
  return chrome.action.setIcon({ imageData });
}
