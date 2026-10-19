// בדיקות בצד הלקוח – לנוחות ולמשוב מהיר בלבד. הכללים זהים לשרת, והשרת הוא הבודק הקובע

// כמו ב-AccountRequestDto: @ אחד, נקודה אחרי ה-@, בלי רווחים בתוך הכתובת
const EMAIL = /^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/;
// כמו בשרת: 05X-XXXXXXX, ‏0X-XXXXXXX, עם מקף או בלי
const PHONE = /^0\d{1,2}-?\d{7}$/;

export function required(value, message) {
  return String(value ?? '').trim() ? null : message;
}

export function validateEmail(value) {
  if (!String(value ?? '').trim()) return 'יש להזין אימייל';
  if (!EMAIL.test(value)) return 'כתובת האימייל אינה תקינה';
  if (value.trim().length > 100) return 'האימייל יכול להכיל עד 100 תווים';
  return null;
}

export function validatePassword(value) {
  if (!value) return 'יש להזין סיסמה';
  if (value.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים';
  if (value.length > 64) return 'הסיסמה יכולה להכיל עד 64 תווים';
  return null;
}

export function validatePhone(value, emptyMessage = 'יש להזין מספר טלפון') {
  if (!String(value ?? '').trim()) return emptyMessage;
  return PHONE.test(value.trim()) ? null : 'מספר הטלפון אינו תקין (לדוגמה: 050-1234567)';
}

export function validateName(value, emptyMessage, max = 60) {
  if (!String(value ?? '').trim()) return emptyMessage;
  return value.trim().length > max ? `אפשר עד ${max} תווים` : null;
}
