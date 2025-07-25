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
