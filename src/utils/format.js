// פונקציות תצוגה: תאריכים, שעות, ימים ומחירים בעברית

const DAY_NAMES = {
  Sunday: 'ראשון',
  Monday: 'שני',
  Tuesday: 'שלישי',
  Wednesday: 'רביעי',
  Thursday: 'חמישי',
  Friday: 'שישי',
  Saturday: 'שבת'
};

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function dayName(day) {
  return DAY_NAMES[day] ?? day;
}

/** "2026-11-01" (DateOnly מהשרת) ← תאריך מקומי, בלי הזזה של אזור זמן */
export function parseDateOnly(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** תאריך מקומי ← "2026-11-01", לשליחה לשרת */
export function toDateOnly(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const longDate = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

/** DateOnly ← "1 בנובמבר 2026" */
export function formatDate(value) {
  const date = parseDateOnly(value);
  return date ? longDate.format(date) : '';
}

/** DateOnly ← "01.11.2026" (לטבלאות) */
export function formatShortDate(value) {
  const date = parseDateOnly(value);
  return date ? shortDate.format(date) : '';
}

/** DateTime ב-UTC מהשרת ← תאריך ושעה מקומיים */
export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : '';
}

/** "16:30:00" ← "16:30" */
export function formatTime(value) {
  return value ? value.slice(0, 5) : '';
}

/** שעת סיום: שעת התחלה ועוד משך בדקות */
export function endTime(startTime, durationMinutes) {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + Number(durationMinutes || 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

const price = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });

export function formatPrice(value) {
  return price.format(value ?? 0);
}

/** גיל בתאריך מסוים – אותו חישוב כמו בשרת */
export function ageAt(birthDate, onDate = new Date()) {
  const birth = parseDateOnly(birthDate);
  if (!birth) return null;
  let age = onDate.getFullYear() - birth.getFullYear();
  const hadBirthday =
    onDate.getMonth() > birth.getMonth() ||
    (onDate.getMonth() === birth.getMonth() && onDate.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age;
}

/** תאריך הסיום ויום השבוע – אותו חישוב כמו CourseGroupSchedule בשרת (לתצוגה מקדימה בטופס) */
export function previewSchedule(startDate, sessionsCount) {
  const start = parseDateOnly(startDate);
  if (!start || !sessionsCount || sessionsCount < 1) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + (Number(sessionsCount) - 1) * 7);
  const dayKeys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return { day: dayKeys[start.getDay()], endDate: toDateOnly(end) };
}

export function plural(count, one, many) {
  return count === 1 ? one : `${count} ${many}`;
}
