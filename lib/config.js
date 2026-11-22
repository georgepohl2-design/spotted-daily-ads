// Where the extension looks for fresh picks.
// This is the public GitHub Pages copy of the /data folder in the repo.
// If it can't be reached, the copy bundled inside the extension is used instead.
export const REMOTE_BASE = 'https://georgepohl2-design.github.io/spotted-daily-ads/data/';

// A pick is never shown once its campaign is older than this many days.
export const MAX_AGE_DAYS = 28;
