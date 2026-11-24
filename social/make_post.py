#!/usr/bin/env python3
"""Makes one day's Spotted. post for Instagram and LinkedIn: the image plus both captions.

    python3 social/make_post.py 2026-11-24            # the day's Spotted ad
    python3 social/make_post.py 2026-11-24 guru       # that day's Guru says quote
    python3 social/make_post.py 2026-11-27 league     # the league table

Writes to social/out/ (not saved in the repo):
    2026-11-24-pick.png          1080x1350, works on both Instagram and LinkedIn
    2026-11-24-pick.txt          both captions and the accounts to tag
"""
import json
import socket
import subprocess
import sys
import threading
from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "social" / "out"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Same CTA on every post. LinkedIn pages have no bio, so the link lives on the page instead.
CTA = {
    "instagram": "Follow for more dope daily ads. Get the Chrome plugin: link in bio.",
    "linkedin": "Follow for more dope daily ads. Get the Chrome plugin: link on our page.",
}


def load(name):
    return json.loads((ROOT / name).read_text())


def handle(handles, kind, key, network):
    entry = (handles.get(kind) or {}).get(key) or {}
    return entry.get(network)


def weekday(iso):
    return date.fromisoformat(iso).strftime("%A")


def pick_post(day, handles):
    spots = load("data/spotlights.json")["spotlights"]
    s = next((x for x in spots if x["featureDate"] == day), None)
    if not s:
        sys.exit(f"No pick on {day}. Weekends are off, and future weeks may not be lined up yet.")
    label = f"Throwback {weekday(day)}" if s.get("throwback") else f"Spotted {s.get('format') or 'ad'}"
    line = f"{label}: {s['brand']} by {s['agency']}. “{s['campaign']}”"
    if s.get("award"):
        line += f". {s['award']['prize']}, {s['award']['show']}"
    tags, missing = {}, []
    for network in ("instagram", "linkedin"):
        found = [handle(handles, "brands", s["brand"], network), handle(handles, "agencies", s["agencyKey"], network)]
        tags[network] = [h for h in found if h]
        for who, h in zip((s["brand"], s["agency"]), found):
            if not h:
                missing.append(f"{network}: {who}")
    return line, tags, missing


def guru_post(day):
    quotes = load("data/quotes.json")["quotes"]
    i = (date.fromisoformat(day) - date(2026, 1, 1)).days % len(quotes)
    return f"Guru says: {quotes[i]['person']}.", {"instagram": [], "linkedin": []}, []


def league_post(day):
    return "Spotted League Table. Who's winning all the shiny things? Nobody cares. But we care.", {"instagram": [], "linkedin": []}, []


def caption(line, tags, network):
    text = f"{line}\n\n{CTA[network]}"
    if tags[network]:
        text += "\n\n" + " ".join("@" + t.lstrip("@") for t in tags[network])
    return text


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def render(day, kind, png):
    port = free_port()
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        subprocess.run([
            CHROME, "--headless=new", "--hide-scrollbars", "--disable-gpu", "--force-device-scale-factor=1",
            "--window-size=1080,1350", "--virtual-time-budget=4000", f"--screenshot={png}",
            f"http://127.0.0.1:{port}/social/post.html?type={kind}&date={day}",
        ], check=True, capture_output=True, timeout=60)
    finally:
        server.shutdown()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    day = sys.argv[1]
    kind = sys.argv[2] if len(sys.argv) > 2 else "pick"
    handles = load("social/handles.json")
    if kind == "pick":
        line, tags, missing = pick_post(day, handles)
    elif kind == "guru":
        line, tags, missing = guru_post(day)
    elif kind == "league":
        line, tags, missing = league_post(day)
    else:
        sys.exit("Type must be pick, guru or league.")

    OUT.mkdir(parents=True, exist_ok=True)
    png = OUT / f"{day}-{kind}.png"
    render(day, kind, png)
    txt = OUT / f"{day}-{kind}.txt"
    parts = [f"INSTAGRAM\n{caption(line, tags, 'instagram')}", f"LINKEDIN\n{caption(line, tags, 'linkedin')}"]
    if tags["instagram"]:
        parts.append("Also tag these on the Instagram image: " + ", ".join("@" + t for t in tags["instagram"]))
    if missing:
        parts.append("No checked handle yet (add to social/handles.json): " + "; ".join(missing))
    txt.write_text("\n\n".join(parts) + "\n")
    print(f"Made {png.relative_to(ROOT)} and {txt.relative_to(ROOT)}\n")
    print(txt.read_text())


if __name__ == "__main__":
    main()
