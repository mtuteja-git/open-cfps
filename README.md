# Open CFPs

A board of open calls for papers in: open source, cloud native, databases, Linux and systems, AI infrastructure, agents and MCP, SRE and observability, developer tooling. 

Automations run by my bestie, Claude Code <3 

Live at https://cfps.manvikatuteja.com.

## How it works

- `data/cfps.json` is the only source of truth. Every deadline in it was checked on the organiser's own CFP page, not an aggregator.
- `index.html` renders that file with filters by topic, country and days left.
- `api/cal.js` serves the same data as a calendar feed at `/cal.ics`. Add `?pick=id1,id2` for chosen CFPs, `?topic=ai,ag` for a topic, `?country=France` for a country. Calendar apps re-fetch the feed on their own, so deadlines stay current.
- `scripts/validate.py` refuses data with closed deadlines, deadlines after the event start, duplicate ids or unknown topics.
- `scripts/monday_post.py` drafts the Monday LinkedIn post into `posts/`.

The data is refreshed every Monday at 7am Pacific. A push to `main` deploys.

## Suggest a CFP

Open an issue with the "Suggest a CFP" template, or send a pull request that adds a row to `data/cfps.json`.

## Row format

```json
{
  "id": "kcd-budapest",
  "name": "KCD Budapest",
  "topics": ["cn"],
  "city": "Budapest",
  "country": "Hungary",
  "start": "2026-10-30",
  "end": "2026-10-30",
  "close": "2026-09-11",
  "url": "https://sessionize.com/kcd-budapest-2026",
  "added": "2026-09-02"
}
```

Topic keys: `ai` AI infra, `ag` Agents & MCP, `cn` Cloud native, `db` Databases, `sre` SRE & observability, `sys` Linux & systems, `oss` Open source, `dev` Developer tooling.
