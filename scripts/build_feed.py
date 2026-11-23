#!/usr/bin/env python3
"""Builds feed.xml: an RSS feed of the Spotted ads that have already run.

Email tools (beehiiv, Kit, Mailchimp and others) can turn this feed into an
automatic weekly email, and anyone can follow it in a feed reader. Only picks
whose day has come (in UK time) are included, so nothing is spoiled early.

    python3 scripts/build_feed.py              # uses today's date
    python3 scripts/build_feed.py 2026-11-27   # pretend it's that day
"""
import json
import sys
from datetime import date, datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://georgepohl2-design.github.io/spotted-daily-ads/"
REPO = "https://github.com/georgepohl2-design/spotted-daily-ads"
UK = ZoneInfo("Europe/London")
MAX_ITEMS = 30


def midday_uk(iso):
    d = date.fromisoformat(iso)
    return datetime(d.year, d.month, d.day, 12, 0, tzinfo=UK)


def weekday(iso):
    return date.fromisoformat(iso).strftime("%A")


def item(s):
    label = f"Throwback {weekday(s['featureDate'])}: " if s.get("throwback") else ""
    title = f"{label}{s['brand']} by {s['agency']}: “{s['campaign']}”"
    award = s.get("award")
    award_line = f"<p><b>{escape(award['prize'])} · {escape(award['show'])}</b></p>" if award else ""
    body = (
        f"<p><b>{escape(s['brand'])}</b> by {escape(s['agency'])}</p>"
        f"<p>Campaign: “{escape(s['campaign'])}”</p>"
        f"{award_line}"
        f"<p>{escape(s['blurb'])}</p>"
        f"<p><a href=\"{escape(s['source']['url'])}\">Read more on {escape(s['source']['name'])}</a></p>"
    )
    return (
        "    <item>\n"
        f"      <title>{escape(title)}</title>\n"
        f"      <link>{escape(s['source']['url'])}</link>\n"
        f"      <guid isPermaLink=\"false\">spotted-{s['featureDate']}</guid>\n"
        f"      <pubDate>{format_datetime(midday_uk(s['featureDate']))}</pubDate>\n"
        f"      <description><![CDATA[{body}]]></description>\n"
        "    </item>\n"
    )


def main():
    today = sys.argv[1] if len(sys.argv) > 1 else datetime.now(UK).date().isoformat()
    spots = json.loads((ROOT / "data/spotlights.json").read_text())["spotlights"]
    run = sorted((s for s in spots if s["featureDate"] <= today), key=lambda s: s["featureDate"], reverse=True)[:MAX_ITEMS]
    latest = format_datetime(midday_uk(run[0]["featureDate"])) if run else format_datetime(datetime.now(timezone.utc))
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        "  <channel>\n"
        "    <title>Spotted. Dope Daily Ad Campaigns</title>\n"
        f"    <link>{REPO}</link>\n"
        f'    <atom:link href="{SITE}feed.xml" rel="self" type="application/rss+xml"/>\n'
        "    <description>A dope new ad campaign revealed every weekday at midday. Who made it and why it's good.</description>\n"
        "    <language>en-gb</language>\n"
        f"    <lastBuildDate>{latest}</lastBuildDate>\n"
        + "".join(item(s) for s in run)
        + "  </channel>\n</rss>\n"
    )
    out = ROOT / "feed.xml"
    if out.exists() and out.read_text() == xml:
        print("feed.xml is already up to date")
        return
    out.write_text(xml)
    print(f"feed.xml written: {len(run)} picks, latest {run[0]['featureDate'] if run else 'none'}")


if __name__ == "__main__":
    main()
