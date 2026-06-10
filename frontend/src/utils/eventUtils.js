export function formatRemainingTime(targetTime) {
  const now = new Date();
  const diff = new Date(targetTime) - now;

  // Countdown calculation: convert the remaining event time into the required Xd Xh Xm format.
  if (diff <= 0) {
    return 'Started';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `${days}d ${hours}h ${minutes}m`;
}

export function isEventEnded(endTime) {
  // Time comparison logic: an event is ended only after the current time passes end_time.
  return Date.now() > new Date(endTime).getTime();
}

export function buildGoogleCalendarLink(event) {
  const toGoogleDate = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toGoogleDate(event.start_time)}/${toGoogleDate(event.end_time)}`,
  });

  // Calendar link generation: Google Calendar accepts event title and UTC start/end timestamps.
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
