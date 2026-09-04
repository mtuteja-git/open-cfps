#!/usr/bin/env python3
"""Checks data/cfps.json before it is committed. Exit code 1 on any problem."""
import json, re, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
path = ROOT / "data" / "cfps.json"
raw = path.read_text(encoding="utf-8")
problems = []
if "\u2014" in raw:
    problems.append("contains an em dash (U+2014)")
data = json.loads(raw)
today = datetime.date.today().isoformat()
topics = set(data["topics"])
seen = set()
for r in data["cfps"]:
    tag = r.get("name", "?")
    for k in ("id", "name", "topics", "city", "country", "start", "end", "close", "url", "added"):
        if k not in r:
            problems.append(f"{tag}: missing {k}")
    if r["id"] in seen:
        problems.append(f"{tag}: duplicate id {r['id']}")
    seen.add(r["id"])
    if not re.fullmatch(r"[a-z0-9-]{3,40}", r["id"]):
        problems.append(f"{tag}: bad id {r['id']}")
    for k in ("start", "end", "close", "added"):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r[k]):
            problems.append(f"{tag}: {k} is not YYYY-MM-DD")
    if r["close"] < today:
        problems.append(f"{tag}: CFP already closed ({r['close']})")
    if r["close"] > r["start"]:
        problems.append(f"{tag}: CFP closes after the event starts, data is wrong")
    if r["end"] < r["start"]:
        problems.append(f"{tag}: event ends before it starts")
    if not set(r["topics"]) <= topics or not r["topics"]:
        problems.append(f"{tag}: unknown or empty topics {r['topics']}")
    if not r["url"].startswith("https://"):
        problems.append(f"{tag}: url must be https")
    if re.search(r"novelticsconferences|averconferences|waset\.org|conferenceindex", r["url"]):
        problems.append(f"{tag}: predatory venue")
if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", data.get("updated", "")):
    problems.append("updated is not YYYY-MM-DD")
if problems:
    print("\n".join("FAIL " + p for p in problems))
    sys.exit(1)
print(f"ok: {len(data['cfps'])} open CFPs, updated {data['updated']}")
