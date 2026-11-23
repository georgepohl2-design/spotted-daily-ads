# Spotted. — design decisions

Agreed on 21 Nov 2026, through several rounds of wireframes.

## Name and look
- **Name:** Spotted. (Chrome Web Store listing adds a plain description after it, e.g. "Spotted. One great ad campaign, every day".)
- **Style:** red-top tabloid. Red masthead (#E24B4A) on white, a condensed headline face (Anton, falling back to Impact, which ships with Mac and Windows, so nothing is downloaded) and the system font for body text, a yellow sticker (#FAC775) for the award badge.
- **Mascot:** a seagull standing upright, beak out, in a plain all-black top hat (no band, so it reads as one clean shape on the red tile; awards-night dress). He holds nothing. Plain eyes (black dot with a white glint, no yellow), a small brow, and a red spot on the beak. Needs bold outlines so he still reads at 16px. Sits in the masthead, the app icon and the empty state ("The gull's on a break"). The "new pick" dot on the toolbar icon is yellow.
- **Voice (everywhere):** chill, blunt, to the point, a bit "can't be bothered". Short sentences. Example: "People want to steal KitKats. We get it. They made an ad about it. Fair." Facts stay straight; the attitude lives in the words around them. Joke about the awards circus, never about named agencies' work or people.

## Popup (about 360px wide), four tabs
1. **Spotted ad** (renamed from "Spotlight" on 23 Nov: it matches the name of the thing)
   - small red label: "SPOTTED AD:", then the brand (big), then "by {agency}" (bold, 18px, linked), then labelled "Campaign" and "Why it's good" rows split by thin lines
   - **Brand name**: the biggest thing on the card
   - by **Agency name** (smaller, links to the agency's website)
   - **"Campaign title"**: big, the headline
   - yellow award badge, straight (not tilted), only for a major award ("Gold · Cannes Lions 2026"); nothing at all otherwise
   - two blunt, slightly weird lines in our own words on why it's cool (e.g. "People want to steal KitKats. We get it.")
   - "Read more on {Source} ↗" button
   - "Released {date}": the campaign's release or coverage date, not today's date
   - no "Guru says" button on this card
2. **Guru says:** quote, person's name, a link about the person (Wikipedia for now; LinkedIn profiles can't be verified automatically). Nothing else. Every quote is still checked against a real source behind the scenes (stored in the data, not shown).
3. **Ad League** (header shows "2K26 season"): "Who's winning all the shiny things. Silly, but we care." Agencies linked to their websites, ranked by **Street cred**.
   - "How we score? I bet you'd like to know." plus one line: we count awards actually won, plus work we reckon is dope.
   - Street cred = points for top prizes from official results pages, plus points each time an agency's work is featured in Spotted. No invented or predicted wins.
   - The full method lives in the README, not the popup.
4. **Archive:** search by brand, agency, award or keyword, tap a row to open its card. Placeholder: "Brand, agency, award, whatever". (Quick filters were dropped to keep it simple.)

## Behaviour
- Midday (12:00 local) Chrome notification ("Spotted." / "{Brand} by {Agency}"), which can be switched off at the bottom of the popup, plus a yellow dot on the icon until opened.
- **The gull (23 Nov):** hover the masthead gull and it doubles in size (the "Spotted." title slides right to make room), turns its head and glares (half-closed eye, angry brow). Click it and it squawks (a short synthesised sound, no audio file) with a random annoyed line in a speech bubble: "What do you want?", "I'm on my break.", "Have you got chips?". Weekend lines tell you to go outside.
- **Guru says:** one quote per day (same for everyone, changes at midnight), with "Your daily dose of wisdom. A new one tomorrow." under the name.
- **League (23 Nov):** tab "League", header "Spotted League Table". Agencies only (in-house teams left out), no links on names. Top 3, biggest first: 🏆 "King of all agencies", 🥈 "First loser", 🥄 "Wooden spoon", on tinted rows that shrink from 1st to 3rd (3rd still bigger than the rest). Ties go to whoever was spotted most recently, so positions are unique and there's always one winner, one second and one spoon. Scored only from Spotted ad picks: 1 point a pick, 2 or 3 for something super special (top Grand Prix or effectiveness winners, or genuinely super dope work with lots of credit). The popup explains the scoring but doesn't list the 2-3 point criteria. Starting points: 3 per 2026 top prize (Cannes GP/Titanium, D&AD Black Pencil, IPA Effectiveness GP, UK Grand Effie), with a "tally has only just begun" note.
- **Not just ads (23 Nov):** picks can be stunts, activations, out-of-home, brand collabs or gaming collabs. An optional `format` field changes the label ("Spotted stunt:", "Spotted gaming collab:"); on throwbacks it shows as a small tag. `source.video: true` makes the button say "Watch it on …" instead of "Read more on …". At most three films a week. Sources added: Ad Age, Marketing Brew and the Brands in Play podcast (gaming).
- **Guru says sources:** mainly CMOs, agency leaders, ad/psychology/design authors (Ogilvy, Cialdini, Kahneman, Norman...) and big marketing voices, plus YC founders and tech CEOs. Every quote needs a checked source.
- **New-pick dot:** bright yellow (#FFD500). Chrome draws it small in the bottom-right corner of the icon.
- **Email (23 Nov):** wanted. The plan is a weekly round-up sent by an email tool from feed.xml, with sign-up on the email tool's page, so the extension still collects nothing.
- **Hover states:** tabs grow slightly and turn pink-red on hover; buttons grow a touch.
- **Weekly rhythm:** Mon/Wed/Fri fresh, Tue/Thu throwbacks (major-award winners from the last year, label "Throwback Tuesday/Thursday: still slaps", footer "Not new. Won stuff. Deal with it."). No picks or notifications at weekends. Saturday: "Why are you looking at me? It's Saturday. You shouldn't be working, you absolute loser. Go outside." Sunday: "On the seventh day, we rest." Both have a "Fine. Show me Friday's" button.
- Never shows a campaign more than 4 weeks past its release or coverage date. If there's no fresh pick: "Nothing today. The gull's on a break. Nothing fresh in the last four weeks." with a "Have a look at old stuff" button.
- Data: `spotlights.json` fetched from the GitHub Pages site, with a bundled copy as the fallback. No API keys in the extension.
- Daily updates later via a scheduled Claude routine that writes the next pick (one weekly batch of five, approved by the owner).

## Money (agreed 21 Nov, nothing built)
- **Free for now.** The goal is an audience and Chrome Web Store reviews. No payments code until users actually ask to pay.
- **Growth:** get it in front of ad-industry creators and newsletters.
- **Later options:** a paid archive and search of past spotlights (about £1 a month or £10 a year; annual is better at low prices because card fees take roughly 20p a payment), or a sponsor.
- **Rule of thumb:** about 2% of free users pay; 3 to 5% is excellent.

## Open
- "Les Burnett" in the guru list: Les Binet or Leo Burnett? (Leo Burnett is in; Les Binet still to add once a quote is verified.)
- Quotes from Peter Field, James Hurman and Orlando Wood are still to come: no exact, sourced wording found yet.
- **Renamed (21 Nov):** "gong" is British slang that confused people, so the leaderboard is now the **Ad League** (like the Premier League, but for ads). "2K26 season" only shows in the header once you open the tab.
- **Store name (21 Nov):** "Spotted. Dope Daily Ad Campaigns". Description: "A dope new ad campaign every day at midday. Who made it (agency or in-house), why it's good, and who's winning the shiny things." The toolbar still says "Spotted."
- **Nudge switch removed (21 Nov):** the "Midday nudge: on" link at the bottom of the popup is gone. The midday notification is always on.
