# Spotted. on Instagram and LinkedIn

One post every weekday: the day's Spotted ad. Nothing else, apart from the odd **Guru says** quote or **Spotted League Table**.

## Every post looks the same

**The image:** a 1080x1350 card in the Spotted. style (`post.html`). The same size works on Instagram and LinkedIn. It's our own card, not a still from the ad, so we never post anyone else's footage.

**The caption:** one line, then the call to action, then the tags. Nothing more.

```
Spotted ad: Tesco by BBH London. “The Wrong Address”

Follow for more dope daily ads. Get the Chrome plugin: link in bio.

@tesco @bbhlondon
```

- **Throwbacks:** `Throwback Tuesday: KitKat by VML UK & Burson. “The KitKat Heist”. Grand Prix, PR, Cannes Lions 2026`
- **Stunts, activations and collabs:** `Spotted stunt: …`, `Spotted gaming collab: …`
- **Guru says:** `Guru says: David Ogilvy.`
- **League:** `Spotted League Table. Who's winning all the shiny things? Nobody cares. But we care.`
- **On LinkedIn,** the CTA ends "link on our page", because company pages don't have a bio.

## Make a post

```
python3 social/make_post.py 2026-11-24            # the day's Spotted ad
python3 social/make_post.py 2026-11-24 guru       # Guru says
python3 social/make_post.py 2026-11-27 league     # the league table
```

The image and captions land in `social/out/`. That folder isn't saved in the repo.

## Tagging the brand and the agency

- Handles live in [`handles.json`](handles.json). Brands are listed by name and agencies by `agencyKey`.
- **Only add a handle after checking it's the official account.** Look for a verified tick, or a link from the company's own website. Tagging the wrong account is worse than not tagging.
- **Instagram:** the handles go in the caption, and also as tags on the image itself.
- **LinkedIn:** typing `@` and choosing the company page from the list is what makes a real tag. Plain `@text` pasted in doesn't link to anything.

## Posting: manual first, automatic later

1. **Weeks 1 to 2: post by hand.** Run the script, then upload. This shows what gets engagement before anything is automated.
2. **Then a scheduler.** Load a week of posts every Sunday, after the weekly picks are merged, and schedule them for midday UK. Buffer, Later and Metricool all handle both networks.
3. **Fully automatic (optional).**
   - Instagram's API needs a professional (Business or Creator) account linked to a Facebook Page.
   - LinkedIn's posting API for company pages needs an approved developer app.
   - API tokens go in GitHub secrets, never in this repo.
