// Serves the CFP deadlines as a calendar feed.
//   /cal.ics                         every deadline
//   /cal.ics?pick=id1,id2            only the picked CFPs
//   /cal.ics?topic=ai,ag             only CFPs tagged with any of these topics
//   /cal.ics?country=United%20States only CFPs in that country
// Calendar apps re-fetch the URL on their own, so the feed stays current as data/cfps.json changes.
const data = require('../data/cfps.json');

const fold = (line) => {
  // RFC 5545: lines longer than 75 octets are folded with CRLF + space.
  const out = [];
  let s = line;
  while (Buffer.byteLength(s) > 74) {
    let cut = 74;
    while (Buffer.byteLength(s.slice(0, cut)) > 74) cut -= 1;
    out.push(s.slice(0, cut));
    s = ' ' + s.slice(cut);
  }
  out.push(s);
  return out.join('\r\n');
};
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const ymd = (s) => s.replace(/-/g, '');
const plusOne = (s) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const fmt = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

module.exports = (req, res) => {
  const q = req.query || {};
  const list = (v) => (v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : null);
  const pick = list(q.pick), topic = list(q.topic), country = list(q.country);

  const today = new Date().toISOString().slice(0, 10);
  let rows = data.cfps.filter((r) => r.close >= today);
  if (pick) rows = rows.filter((r) => pick.includes(r.id));
  if (topic) rows = rows.filter((r) => r.topics.some((t) => topic.includes(t)));
  if (country) rows = rows.filter((r) => country.includes(r.country));

  const name = pick ? 'CFP deadlines (picked)' : topic ? 'CFP deadlines (' + topic.map((t) => data.topics[t] || t).join(', ') + ')' : 'CFP deadlines';
  const stamp = ymd(data.updated) + 'T070000Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Open CFPs//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + esc(name), 'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D',
  ];
  for (const r of rows) {
    const when = r.start === r.end ? fmt(r.start) : fmt(r.start) + ' to ' + fmt(r.end);
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + r.id + '@open-cfps',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + ymd(r.close),
      'DTEND;VALUE=DATE:' + ymd(plusOne(r.close)),
      'SUMMARY:' + esc('CFP closes: ' + r.name),
      'DESCRIPTION:' + esc('Event ' + when + ', ' + r.city + ', ' + r.country + '. Submit: ' + r.url),
      'LOCATION:' + esc(r.city + ', ' + r.country),
      'URL:' + r.url,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-P3D', 'DESCRIPTION:' + esc('CFP closes in 3 days: ' + r.name), 'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="cfp-deadlines.ics"');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(lines.map(fold).join('\r\n') + '\r\n');
};
