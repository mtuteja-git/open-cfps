// Google Apps Script. Keeps a calendar you own ("Open CFPs") in sync with the board,
// so it can be shared publicly and added to anyone's Google Calendar in one click.
// Run sync() once by hand to authorise it, then add a daily time-driven trigger for sync.

const DATA_URL = 'https://cfps.manvikatuteja.com/data/cfps.json';
const CAL_NAME = 'Open CFPs';
const TAG = 'cfpId';

function sync() {
  const cal = CalendarApp.getCalendarsByName(CAL_NAME)[0] || CalendarApp.createCalendar(CAL_NAME, {
    summary: 'Open calls for papers, refreshed from cfps.manvikatuteja.com',
    timeZone: 'America/Los_Angeles'
  });
  const data = JSON.parse(UrlFetchApp.fetch(DATA_URL).getContentText());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setFullYear(horizon.getFullYear() + 2);

  // Existing events, keyed by the CFP id stored on each one.
  const existing = {};
  cal.getEvents(today, horizon).forEach(function (ev) {
    const id = ev.getTag(TAG);
    if (id) existing[id] = ev;
  });

  let created = 0, updated = 0, removed = 0;
  data.cfps.forEach(function (r) {
    const close = new Date(r.close + 'T00:00:00');
    if (close < today) return;
    const short = r.name.split(' (')[0];
    const title = 'CFP Deadline - ' + short;
    const when = r.start === r.end ? fmt(r.start) : fmt(r.start) + ' to ' + fmt(r.end);
    const desc = 'Event ' + when + ', ' + r.city + ', ' + r.country + '.\nSubmit: ' + r.url;
    const loc = r.city + ', ' + r.country;
    const ev = existing[r.id];
    if (ev) {
      const sameDay = ev.getAllDayStartDate().getTime() === close.getTime();
      if (!sameDay) ev.setAllDayDate(close);
      if (ev.getTitle() !== title) ev.setTitle(title);
      if (ev.getDescription() !== desc) ev.setDescription(desc);
      if (ev.getLocation() !== loc) ev.setLocation(loc);
      if (!sameDay) updated++;
      delete existing[r.id];
    } else {
      const nev = cal.createAllDayEvent(title, close, { description: desc, location: loc });
      nev.setTag(TAG, r.id);
      nev.removeAllReminders();
      nev.addPopupReminder(3 * 24 * 60);
      created++;
    }
  });
  // Anything left in existing is no longer on the board (closed or removed).
  Object.keys(existing).forEach(function (id) { existing[id].deleteEvent(); removed++; });
  Logger.log('Open CFPs sync: %s created, %s moved, %s removed, %s on the board', created, updated, removed, data.cfps.length);
}

function fmt(s) {
  const d = new Date(s + 'T00:00:00');
  return Utilities.formatDate(d, 'UTC', 'MMM d, yyyy');
}
