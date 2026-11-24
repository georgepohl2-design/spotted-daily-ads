# Chrome Web Store listing: copy and paste

## Store listing tab

- **Name** (from the manifest): Spotted. Beta: Dope Daily Ad Campaigns
- **Summary** (from the manifest): Beta. A dope new ad campaign revealed every weekday at midday. Who made it (agency or in-house) and why it's good.
- **Category:** Fun (or the closest match the dashboard offers, e.g. Lifestyle)
- **Language:** English (UK)
- **Store icon:** `icons/icon128.png`
- **Small promo tile** (440x280): `docs/store/promo-tile.png` (made from `promo.html`)
- **Screenshots** (1280x800, up to 5, in this order): `1-today.png` (the big gull), `2-throwback.png`, `3-league.png`, `4-guru.png`, `5-weekend.png`
- **Global promo video:** leave empty. We don't have one.
- **Marquee promo tile** (1400x560): `docs/store/marquee-tile.png`. Only used if Google features Spotted. on the store's front page.
- **Official URL:** leave empty. It needs a website domain you own and have verified with Google.
- **Homepage URL:** https://georgepohl2-design.github.io/spotted-daily-ads/
- **Support URL:** https://docs.google.com/forms/d/e/1FAIpQLSfLlMF6IJ3-YZ69MpcW8G3UamnhCpErtVRmsgW77TWPg_F0Qg/viewform (the feedback form)
- **Description:**

```
BETA: Spotted. is brand new and we're still testing it. Picks, alerts and the league table might change as we go.

Spotted. puts one great ad campaign in your browser every weekday at midday.

Click the gull and you get:
• The brand, and who made it: the agency, or the in-house team
• Why it's good, in two blunt lines
• A link to read more on a free-to-read trade site
• An award badge if it's won something big (Cannes Lions, D&AD, Effies, IPA)

Every week:
• Monday, Wednesday, Friday: something fresh, launched in the last few weeks
• Throwback Tuesday and Throwback Thursday: big award winners from the last year. Not new. Still slaps.
• Weekends off. Open it on a Saturday and the gull will tell you to go outside.

Also inside:
• Guru says: your daily dose of wisdom, one quote a day from ad legends, CMOs, founders and pretty famous dead people. Ogilvy, Hegarty, Cialdini, Jobs and friends. Every quote checked against a source.
• The Spotted League Table: which agencies are winning all the shiny things. Nobody cares. But we care.
• Archive: every past pick, searchable by brand or agency.

Never miss it:
• A midday alert on weekdays, with the brand, the agency and the campaign
• A blue "1" on the gull when there's a new one you haven't opened
• A quick setup page when you install, to check the alert actually shows up on your computer

It's a beta, so tell us what to fix: there's a feedback link at the bottom of the popup.

No accounts. No tracking. No ads. It reads a public list of picks and that's it.

Made for marketers, creatives, strategists and anyone who likes a good ad.
```

## Privacy practices tab

- **Single purpose:** Shows one recent advertising campaign each weekday, with who made it and why it's good.
- **Permission: storage:** Remembers, on your computer only, whether you've seen today's pick (for the blue "1"), whether the test alert worked, and keeps an offline copy of the picks.
- **Permission: alarms:** Wakes the extension at midday to check for the new pick, and hourly to update the blue "1" (and send the midday alert late if the computer was asleep at noon).
- **Permission: notifications:** Shows one midday notification on weekdays with the brand, agency and campaign of the new pick, plus a test alert on the setup page when you ask for one.
- **Remote code:** No. All code is inside the extension. It only downloads a JSON data file.
- **Data usage:** tick nothing. Spotted. collects no user data. Tick the three certification boxes.
- **Privacy policy URL:** https://github.com/georgepohl2-design/spotted-daily-ads/blob/main/PRIVACY.md

## Distribution tab

- **Visibility:** Public. It's labelled Beta in the name, the summary, the description and the popup.
  - Want a quieter start? Pick **Unlisted**: only people with the link can find it. Switch to Public later.
- **Regions:** All regions
- **Price:** Free
