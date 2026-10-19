// פרטי האתר במקום אחד: שינוי כאן משנה את השם בכל האתר
export const SITE = {
  name: 'אורות',
  tagline: 'מרכז חוגים לבנות',
  fullName: 'אורות – מרכז חוגים לבנות',
  phone: '02-0000000',
  address: 'רחוב הגפן 12'
};

// כתובת השרת נלקחת ממשתנה סביבה (.env.development בפיתוח, הגדרות Render בענן)
export const API_URL = (import.meta.env.VITE_API_URL ?? 'https://localhost:7200').replace(/\/$/, '');

// תפקידים – בדיוק כמו ב-enum UserRole בשרת
export const ROLES = {
  Admin: 'Admin',
  Instructor: 'Instructor',
  Member: 'Member'
};

export const ROLE_LABELS = {
  Admin: 'מנהלת',
  Instructor: 'מדריכה',
  Member: 'משתתפת'
};
