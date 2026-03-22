// --- DATE UTILITIES ---

export const generateDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) =>
  new Date(year, month, 1).getDay();

// Returns the Monday of the current week (used for free tier locking)
export const getStartOfCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Returns the Sunday of a given week (used for weekly calendar view)
export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};
