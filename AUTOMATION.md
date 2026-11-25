# Automation plan

How Spotted. gets a fresh pick every weekday, without putting an API key inside the extension.

## The short version

A **scheduled Claude routine** runs in the cloud every **Sunday morning** and lines up the whole week: Monday, Wednesday and Friday fresh picks, plus the Tuesday and Thursday throwbacks. You get **one email with all five** and approve them in one click.

```mermaid
flowchart LR
    A[Sunday 07:00 UK: Claude routine wakes up] --> B[Finds 3 fresh campaigns and 2 award-winning throwbacks]
    B --> C[Checks brand, agency, date and link for each]
    C --> D[Writes two blunt lines each, adds them to data/spotlights.json]
    D --> E[Checker runs automatically]
    E -->|passes| F[Opens one pull request: 'Spotted: week of 30 Nov']
    E -->|fails| X[Swaps out the bad pick, or leaves that day empty]
    F --> G[You get one email with all 5, approve in one click]
    G --> H[Mon-Fri 12:00: everyone's gull pings]
```

**Later, fully automatic:** once you trust the picks, the routine publishes the week straight away and the email becomes a heads-up you can ignore. That's one setting in the prompt (step 9).

## Why this setup

- **No key in the extension.** Extensions are public code, so anything inside one can be read by anyone. The routine runs on Claude's side, so there's nothing to leak.
- **Your laptop can be off.** The routine runs in the cloud on a schedule.
- **One review a week, not five.** All five picks arrive together. Approve them, or ask Claude to swap one.
- **It's checked twice.** Claude checks the facts against the source, then [`scripts/validate.py`](scripts/validate.py) runs before anything is published. It blocks missing fields, two picks on one day, weekend picks, non-throwbacks on Tuesdays and Thursdays, weeks with more than three normal video or TV ads, non-https links, minor awards, and anything more than four weeks old.
- **Still fresh.** Friday's pick is found on Sunday, so it's at most a few days older than a same-day pick. The 4-week rule still holds.

## Setup

**Now (done).** Researched and verified picks up to 14 Dec 2026, bundled in the extension and served from GitHub Pages.

**Next: the weekly routine** (`/schedule` in Claude Code, or claude.ai/code → Routines):
- **Schedule:** every Sunday at 07:00 UK time.
- **Repo:** `georgepohl2-design/spotted-daily-ads`, with Claude's GitHub access limited to this one repo.
- **Prompt:** the routine prompt below.
- **Your review:** the routine opens a pull request called `Spotted: week of {Monday's date}`, listing all five picks with their links. GitHub emails you. Press **Merge** if they're fine. If not, comment on the one to swap and Claude fixes it. Merge by Monday 11:00 so Monday's pick goes out at midday.
- **If you don't get round to it:** nothing goes out that week until you merge. Once you switch to automatic, this stops being a risk.

**Award reference list:** `data/league.json` → `wins` lists official 2026 top prizes. It is not scored (the league is scored only from Spotted ad picks), but it helps find throwbacks. Add to it from official results pages only.

## The routine prompt (draft)

> You maintain the Spotted. Chrome extension in this repo. Add next week's five picks (Monday to Friday) to `data/spotlights.json`. Skip any day that already has a pick.
>
> 0. For each day: Monday, Wednesday and Friday are fresh picks (steps 1 to 6). Tuesday and Thursday are throwbacks: so find a major-award winner (Grand Prix, Gold, Silver, Bronze, Pencil, Effie, IPA Effectiveness) from the last 12 months that hasn't run yet, set `throwback: true`, fill in `award` with its `year`, and leave out `campaignDate`. Then skip to step 3.
> **Key source: Breaking & Entering Media** (Geno Schellenberger and Jack Westerkamp). Check them first every week: their newsletter (breakingandentering.beehiiv.com), site (breaking-entering.com), YouTube (@BreakingandEnteringMedia), podcast, and LinkedIn (linkedin.com/company/breaking-entering-media), including their "Top 5 agencies of the week". Treat the work they cover as a strong signal, but still confirm brand, agency, campaign and date in the source itself.
>
> **Also a key source: orenmeetsworld** (YouTube: youtube.com/channel/UC_tSQ6UQy2pROm-I0J7UBoA). He tells the stories behind brands and their odd tactics. Check his latest videos every week. If he's told the story of a pick well, link to his video (`source.video: true`), but only after confirming brand, agency, campaign and date in a trade article. His stories are often about older work: use those as throwback ideas if they won a major award, never as fresh picks.
>
> **Not just ads: the whole creative idea.** Films count, but so do stunts, PR moments, brand activations, out-of-home, brand collabs and gaming collabs (Roblox, Fortnite, EA, Pokémon, Minecraft and the like). Think Walkers putting crisps in sandwiches, Fearless Girl facing down the Wall Street bull, or a B2B brand like Legora hiring Jude Law. **Every week, at least two of the five picks must not be a straight video or TV ad** (throwbacks count). Look hardest for odd tactics, stunts and brand partnerships: those are what make Spotted. different. Set `format` to `stunt`, `activation`, `partnership`, `brand collab`, `gaming collab`, `out of home`, `influencer campaign`, `creator series`, `seeding`, `SMS`, `push notification`, `app`, `audio ad`, `live selling`, `social show`, `clipping` or `odd tactic`, and leave it out for a normal ad. The checker blocks a week with more than three normal ads.
>
> **Every channel, normie to fringe.** TV, YouTube and billboards are fine, but look just as hard at: product seeding, SMS, push notifications, in-app and app ads, TikTok and creator or influencer campaigns, Spotify and podcast ads, live selling, affiliate, clipping, social shows, streaming, X, Snapchat, LinkedIn, tradeshows and creative cold outbound. A weird tactic that worked beats a pretty film.
>
> **Odd companies too.** Not just the usual big consumer brands. Look for unexpected companies doing smart things: fintechs, software, startups, niche brands. Think Ramp teaming up with Tony Hawk.
>
> **B2B: about one every two to three weeks, only if it's genuinely good.** B2B is harder to find, so never force a weak one in. Look at the business arms of big tech (AWS, Adobe, Meta's ad business, Google Cloud, Salesforce, Shopify) and smaller ones like Ramp or Legora. Set `b2b: true`, which puts a small B2B tag on the card.
>
> **Also check:** Ad Age (good for finding work, but mostly paywalled, so link a free source), the Brands in Play podcast (Nic Hill and Albane Prioux, brand activations in gaming), and gaming coverage on The Drum, LBB and Marketing Brew.
>
> 1. Find campaigns launched or first covered in the last 14 days (never more than 28 days before the day it runs) on: The Drum, Adweek, Ad Age, Campaign, LBB, Creative Review, Ads of the World, shots, Contagious, Muse by Clio, Marketing Week, Marketing Dive, Marketing Brew, B&T. Favour UK, US and European work, but pick anything genuinely interesting from anywhere. A clip reposted by a fan or influencer account is a lead, not a source: find who made it in a trade article.
> 2. Skip anything already in `data/spotlights.json`. Don't repeat a brand or agency used in the last 7 days.
> 3. Open the source article and confirm: brand, lead agency, campaign name, and launch or coverage date. If the brand, campaign or date isn't stated, pick something else. Never guess an agency: try hard to find it (trade articles, credits, LinkedIn posts, the agency's own site), but if the work is clearly real and great and no agency is credited anywhere, set `agency` to `No agency found` and `agencyKey` to `none`. Use that rarely.
> 4. Agency link: only add `agencyUrl` if you've loaded the agency's site and it's clearly theirs. Otherwise use `null`. Add the agency to `data/league.json` → `agencies` if it's new.
> 5. Award: `null` unless the work has officially won a major award: Grand Prix, Titanium, Gold, Silver or Bronze at Cannes Lions, a D&AD Pencil, a One Show Pencil, a Clio, an Effie or an IPA Effectiveness Award. Shortlists and finalists don't count. Then use `{ "prize": "Gold", "show": "Cannes Lions 2026" }`, from the official results.
> 5b. Link: `source.url` is a free-to-read article. If the best link is the work itself (the brand's own video on YouTube), use that and set `source.video: true`, so the button says "Watch it on YouTube".
> 6. Blurb: two short lines in our voice: chill, blunt, a bit can't-be-bothered, about why it's cool. Under 200 characters. Your own words, never article text. Joke about the awards circus or the idea, never about people or an agency's work. Example: "People want to steal KitKats. We get it. They made an ad about it. Fair."
> 6b. Points: set `points` to 1. Use 2 or 3 only for something super special: a top Grand Prix or creative effectiveness winner, or work that's genuinely super dope and widely credited. Most weeks have at most one 3.
> 7. Run `python3 scripts/validate.py --links`. Fix anything it flags.
> 8. If a pick fails and you can't fix it, swap it for another. If nothing passes for a day, leave that day empty.
> 9. Open one pull request titled `Spotted: week of {Monday's date}`. In the description, list each day: brand, agency, campaign, source link, and one line on why you picked it. Don't merge it yourself. (Fully automatic later: commit straight to `main` instead and open the same list as an issue, so the owner still gets the email.)

## The feed and the weekly email

- [`scripts/build_feed.py`](scripts/build_feed.py) writes `feed.xml`, an RSS feed of every pick that has already run (never future ones).
- A GitHub Action ([`.github/workflows/feed.yml`](.github/workflows/feed.yml)) rebuilds it just after midday on weekdays and whenever the picks change. It's served at https://georgepohl2-design.github.io/spotted-daily-ads/feed.xml.
- An email tool with RSS-to-email (beehiiv, Kit, Mailchimp and others) can send a weekly round-up from it automatically. The tool holds subscribers' addresses, never this repo or the extension.

## Option B: a GitHub Action instead of a Claude routine

If you'd rather not use a routine, a GitHub Action can run the same steps on a schedule by calling the Claude API.
- The API key lives only as a **GitHub secret** (Settings → Secrets → Actions), never in the code.
- It costs a few pence per run in API usage, billed separately from a Claude subscription.
- It's more setup and more moving parts, so the routine is the better start.

## Things to keep an eye on

- **Paywalls.** Prefer free-to-read sources for "Read more" (The Drum, B&T, Creative Review, Marketing Dive). Ad Age and some Adweek pieces are paywalled.
- **Thin weeks.** Late December is quiet. If nothing fresh passes the checks, the routine should skip the day. The extension then shows the last pick while it's still under four weeks old, and after that "Nothing today. The gull's on a break."
- **Corrections.** If a fact turns out wrong, edit the entry in `data/spotlights.json`. Every extension picks up the fix on the next refresh.
