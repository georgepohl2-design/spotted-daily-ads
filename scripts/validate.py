#!/usr/bin/env python3
"""Checks the Spotted. data files before they go live.

Run it from the repo folder:
    python3 scripts/validate.py            # checks the data
    python3 scripts/validate.py --links    # also checks every link still loads

It stops a bad pick going out: missing fields, a duplicate day, a weekend pick,
a fresh campaign that's more than four weeks old on the day it runs, a
throwback that isn't a major-award winner from the last year, or a link that
isn't https. Tuesdays and Thursdays must be throwbacks.
"""
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_AGE_DAYS = 28
# The award badge only shows for major awards. Shortlists, merits and finalists don't count.
MAJOR_SHOWS = ["Cannes Lions", "D&AD", "The One Show", "Clio", "Effie", "IPA Effectiveness", "Eurobest", "Epica", "LIA"]
MAJOR_PRIZES = ["grand prix", "titanium", "gold", "silver", "bronze", "pencil", "grand effie", "grand clio", "best of show"]
# What kind of idea it is. Not just ads: stunts, activations and gaming collabs count too.
FORMATS = ["ad", "stunt", "activation", "gaming collab", "brand collab", "out of home"]
REQUIRED = ["featureDate", "brand", "agency", "agencyKey", "campaign", "blurb", "source"]
errors = []


def err(msg):
    errors.append(msg)


def d(s, where):
    try:
        return date.fromisoformat(s)
    except Exception:
        err(f"{where}: '{s}' is not a YYYY-MM-DD date")
        return None


def https(url, where, allow_none=False):
    if url is None and allow_none:
        return
    if not isinstance(url, str) or not url.startswith("https://"):
        err(f"{where}: link must start with https:// (got {url!r})")


def check_link(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Spotted. link checker)"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:  # noqa: BLE001
        return str(e)


spots = json.loads((ROOT / "data/spotlights.json").read_text())
quotes = json.loads((ROOT / "data/quotes.json").read_text())
league = json.loads((ROOT / "data/league.json").read_text())
TB_FROM = spots.get("throwbacksFrom", "9999-12-31")

seen_days = set()
for i, s in enumerate(spots["spotlights"]):
    where = f"spotlight #{i + 1} ({s.get('brand', '?')})"
    for f in REQUIRED:
        if not s.get(f):
            err(f"{where}: missing '{f}'")
    tb = bool(s.get("throwback"))
    fd = d(s.get("featureDate", ""), where)
    cd = d(s["campaignDate"], where) if s.get("campaignDate") else None
    if not tb and not cd:
        err(f"{where}: missing 'campaignDate'")
    if fd:
        day = fd.strftime("%A")
        if day in ("Saturday", "Sunday"):
            err(f"{where}: no picks at weekends ({s['featureDate']} is a {day})")
        if tb and day not in ("Tuesday", "Thursday"):
            err(f"{where}: throwbacks only run on Tuesdays and Thursdays ({s['featureDate']} is a {day})")
        if not tb and day in ("Tuesday", "Thursday") and s["featureDate"] >= TB_FROM:
            err(f"{where}: {day}s are throwback days, mark it throwback: true or move it")
    if tb:
        aw = s.get("award") or {}
        if not aw:
            err(f"{where}: a throwback needs a major award")
        elif fd and not (isinstance(aw.get("year"), int) and 0 <= fd.year - aw["year"] <= 1):
            err(f"{where}: a throwback's award needs a 'year' from the last year or so")
    if fd and cd and not tb:
        if (fd - cd).days > MAX_AGE_DAYS:
            err(f"{where}: campaign is {(fd - cd).days} days old on its feature day (max {MAX_AGE_DAYS})")
        if cd > fd:
            err(f"{where}: campaignDate is after featureDate")
    if s.get("featureDate") in seen_days:
        err(f"{where}: two picks on {s['featureDate']}")
    seen_days.add(s.get("featureDate"))
    https(s.get("agencyUrl"), where, allow_none=True)
    src = s.get("source") or {}
    if not src.get("name"):
        err(f"{where}: source needs a name")
    https(src.get("url"), where)
    if len(s.get("blurb", "")) > 200:
        err(f"{where}: blurb is over 200 characters, keep it blunt")
    if s.get("agencyKey") and s["agencyKey"] not in league["agencies"]:
        err(f"{where}: agencyKey '{s['agencyKey']}' isn't listed in league.json agencies")
    if s.get("format") and s["format"] not in FORMATS:
        err(f"{where}: format must be one of {', '.join(FORMATS)} (got {s['format']!r})")
    if "points" in s and s["points"] not in (1, 2, 3):
        err(f"{where}: points must be 1, 2 or 3 (got {s['points']!r})")
    aw = s.get("award")
    if aw:
        show, prize = aw.get("show", ""), aw.get("prize", "")
        if not any(show.startswith(m) for m in MAJOR_SHOWS):
            err(f"{where}: award show '{show}' isn't a major show, leave award as null")
        if not any(p in prize.lower() for p in MAJOR_PRIZES):
            err(f"{where}: prize '{prize}' isn't a major prize (Grand Prix, Gold, Silver, Bronze, Pencil...), leave award as null")

for i, q in enumerate(quotes["quotes"]):
    where = f"quote #{i + 1}"
    for f in ["text", "person", "source"]:
        if not q.get(f):
            err(f"{where}: missing '{f}' (every quote needs a checked source)")
    https(q.get("link"), where, allow_none=True)

for i, w in enumerate(league["wins"]):
    where = f"award win #{i + 1} ({w.get('work', '?')})"
    if w.get("agencyKey") not in league["agencies"]:
        err(f"{where}: unknown agencyKey '{w.get('agencyKey')}'")
    if w.get("show") not in league["showsCounted"]:
        err(f"{where}: show '{w.get('show')}' isn't in showsCounted")

if "--links" in sys.argv:
    urls = [s["source"]["url"] for s in spots["spotlights"]]
    urls += [s["agencyUrl"] for s in spots["spotlights"] if s.get("agencyUrl")]
    urls += [q["link"] for q in quotes["quotes"] if q.get("link")]
    for url in sorted(set(urls)):
        status = check_link(url)
        ok = status == 200
        print(f"{'ok ' if ok else 'BAD'} {status} {url}")
        if status not in (200, 403):  # 403 = site blocks robots but works in a browser
            err(f"link problem ({status}): {url}")

if errors:
    print("\nNope. Fix these first:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
n_tb = sum(1 for s in spots["spotlights"] if s.get("throwback"))
print(f"All good: {len(spots['spotlights'])} picks ({n_tb} throwbacks), {len(quotes['quotes'])} quotes, {len(league['wins'])} awards.")
