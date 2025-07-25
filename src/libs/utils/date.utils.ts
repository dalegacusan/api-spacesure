export function getAllDatesBetween(
  startDateStr: string,
  endDateStr: string,
): string[] {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function formatUtcTo12HourTime(isoString: string): string {
  // Get the time part only: "17:00:00"
  const time = isoString.split('T')[1]?.replace('Z', '');
  if (!time) return '';

  // Prepend arbitrary date and format in UTC
  const fakeDate = `1970-01-01T${time}Z`;
  return new Date(fakeDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Prevents timezone shift
  });
}

export function formatDateToLong(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00Z'); // force UTC
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
