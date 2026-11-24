// Where the extension looks for fresh picks.
// This is the public GitHub Pages copy of the /data folder in the repo.
// If it can't be reached, the copy bundled inside the extension is used instead.
export const REMOTE_BASE = 'https://georgepohl2-design.github.io/spotted-daily-ads/data/';

// A pick is never shown once its campaign is older than this many days.
export const MAX_AGE_DAYS = 28;

// The feedback form (a Google Form). Linked at the bottom of the Spotted tab, on the
// setup page, and opened when someone uninstalls. Empty = the links stay hidden.
export const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfLlMF6IJ3-YZ69MpcW8G3UamnhCpErtVRmsgW77TWPg_F0Qg/viewform';
