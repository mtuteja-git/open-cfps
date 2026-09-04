#!/usr/bin/env python3
"""Drafts the Monday LinkedIn post from data/cfps.json into posts/YYYY-MM-DD.md.

Selection rule, in order: deadlines within 14 days (soonest first), then CFPs added this
week, then the rest by deadline. Five rows. Plain text only: no emoji, no Unicode bold,
no em dashes. The board link goes in the first comment, since LinkedIn downranks posts
whose body carries an external link.
"""
import json, datetime, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOARD = "https://cfps.manvikatuteja.com"
data = json.loads((ROOT / "data" / "cfps.json").read_text(encoding="utf-8"))
today = datetime.date.today()
iso = today.isoformat()

def d(s): return datetime.date.fromisoformat(s)
def days(r): return (d(r["close"]) - today).days
def fmt(s): x = d(s); return x.strftime("%b ") + str(x.day)

rows = [r for r in data["cfps"] if days(r) >= 0]
rows.sort(key=lambda r: (0 if days(r) <= 14 else 1 if r["added"] == data["updated"] else 2, days(r)))
top = rows[:5]

lines = ["Open CFPs this week: " + str(len(rows)) + " calls for talks an engineer would actually submit to.", ""]
for r in top:
    n = days(r)
    left = "closes today" if n == 0 else f"{n} day{'s' if n != 1 else ''} left"
    name = r["name"].split(" (")[0]
    where = "" if r["city"].lower() in name.lower() else f", {r['city']}"
    lines.append(f"{name}{where}: {left}, closes {fmt(r['close'])}")
lines += ["", f"The full list, with filters by topic and country and a calendar feed of every deadline, is in the first comment. Updated every Monday.", "", "#CFP #OpenSource #CloudNative #AIEngineering #DevRel"]
post = "\n".join(lines)
comment = f"Full board, filters and calendar feed: {BOARD}"

assert "\u2014" not in post
out = ROOT / "posts" / f"{iso}.md"
out.write_text(f"# LinkedIn post draft, {today.strftime('%B %-d, %Y')}\n\nPost body ({len(post)} characters):\n\n```\n{post}\n```\n\nFirst comment:\n\n```\n{comment}\n```\n", encoding="utf-8")
print(out)
print(post)
