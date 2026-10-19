import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

/**
 * מצב ההתחברות של כל האתר: המשתמשת המחוברת, התחברות, הרשמה והתנתקות.
 * ה-token והמשתמשת נשמרים ב-sessionStorage (לכל לשונית בנפרד), ונמחקים כשה-token פג.
 * התפקיד כאן משמש רק להצגה (תפריט, כפתורים). ההרשאה האמיתית נבדקת בשרת.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [expired, setExpired] = useState(false);

  const save = useCallback((auth) => {
    const next = { token: auth.token, user: auth.user, expiresAt: auth.expiresAt };
    try {
      sessionStorage.setItem(TOKEN_KEY, auth.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify({ user: auth.user, expiresAt: auth.expiresAt }));
    } catch { /* אחסון חסום – ההתחברות תישאר רק עד רענון */ }
    setExpired(false);
    setSession(next);
    return auth.user;
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch { /* אין מה למחוק */ }
    setSession(null);
  }, []);

  const login = useCallback(async (credentials) => save(await authApi.login(credentials)), [save]);
  const register = useCallback(async (details) => save(await authApi.register(details)), [save]);

  // השרת החזיר 401 לבקשה מחוברת (ה-token פג): מתנתקים ומציגים הודעה בדף ההתחברות
  useEffect(() => {
    const onExpired = () => {
      logout();
      setExpired(true);
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout]);

  // ניתוק אוטומטי ברגע שתוקף ה-token מסתיים
  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    if (ms <= 0) return undefined;
    const timer = setTimeout(() => {
      logout();
      setExpired(true);
    }, Math.min(ms, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    isLoggedIn: Boolean(session),
    role: session?.user?.role ?? null,
    hasRole: (...roles) => Boolean(session) && roles.includes(session.user.role),
    expired,
    clearExpired: () => setExpired(false),
    login,
    register,
    logout,
    updateUser: (user) => setSession((s) => (s ? { ...s, user } : s))
  }), [session, expired, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

function loadSession() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const stored = JSON.parse(sessionStorage.getItem(USER_KEY) ?? 'null');
    if (!token || !stored?.user) return null;
    if (stored.expiresAt && new Date(stored.expiresAt) <= new Date()) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
    return { token, user: stored.user, expiresAt: stored.expiresAt };
  } catch {
    return null;
  }
}
