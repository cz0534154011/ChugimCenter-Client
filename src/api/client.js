import axios from 'axios';
import { API_URL } from '../config';

// מפתחות האחסון בדפדפן. ה-token נשמר ב-sessionStorage: ההתחברות נשארת אחרי רענון,
// וכל לשונית מחוברת בנפרד – כך אפשר להדגים 409 עם שתי משתתפות בשתי לשוניות
export const TOKEN_KEY = 'orot.token';
export const USER_KEY = 'orot.user';

/** מופע Axios אחד לכל האתר. כל הבקשות עוברות דרכו, ולכן ה-token מצורף במקום אחד */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000
});

// לפני כל בקשה: מצרפים את ה-token לכותרת Authorization (לא לכתובת ולא לגוף הבקשה)
api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// אחרי כל תשובה: 401 בבקשה מחוברת פירושו שה-token פג או לא תקף – מתנתקים ושולחים להתחברות
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && readToken()) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(toApiError(error));
  }
);

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * כל שגיאה הופכת לאובייקט אחיד: status, ‏message, ‏fieldErrors, ‏correlationId.
 * השרת מחזיר תמיד ErrorResponse באותו מבנה, ולכן כל המסכים מציגים שגיאות באותה דרך.
 */
export function toApiError(error) {
  if (error?.isApiError) return error;

  const response = error?.response;
  if (!response) {
    return {
      isApiError: true,
      status: 0,
      message: 'אין חיבור לשרת. בדקי את החיבור לאינטרנט ונסי שוב.',
      fieldErrors: {},
      correlationId: null
    };
  }

  const data = response.data ?? {};
  const fieldErrors = {};
  for (const [key, messages] of Object.entries(data.errors ?? {})) {
    // השרת מחזיר את שם השדה כמו ב-C# (Email). שומרים באותיות קטנות להתאמה לשדות הטופס
    const field = key.replace(/^\$\./, '').split('.').pop().toLowerCase();
    fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
  }

  return {
    isApiError: true,
    status: response.status,
    message: data.message || defaultMessage(response.status),
    fieldErrors,
    correlationId: data.correlationId ?? null
  };
}

function defaultMessage(status) {
  switch (status) {
    case 400: return 'הנתונים שנשלחו אינם תקינים';
    case 401: return 'יש להתחבר למערכת';
    case 403: return 'אין לך הרשאה לפעולה זו';
    case 404: return 'המידע המבוקש לא נמצא';
    case 409: return 'הפעולה מתנגשת עם מצב הנתונים. רענני ונסי שוב.';
    default: return 'אירעה שגיאה. נסי שוב בעוד רגע.';
  }
}

/** מסיר פרמטרים ריקים, כדי שלא יישלחו לשרת ערכים כמו CategoryId= */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
  );
}

export default api;
