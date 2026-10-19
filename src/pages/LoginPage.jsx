import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { Alert, ApiErrorAlert } from '../components/Feedback';
import { LogoMark } from '../components/Logo';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config';
import { validateEmail } from '../utils/validation';

/** אחרי התחברות: חזרה לדף שממנו הגיעה, או לדף הראשי של התפקיד */
export function homeForRole(role) {
  if (role === ROLES.Admin) return '/admin';
  if (role === ROLES.Instructor) return '/my/groups';
  return '/courses';
}

export default function LoginPage() {
  usePageTitle('התחברות');
  const { login, isLoggedIn, role, expired, clearExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const form = useForm({ email: '', password: '' }, (v) => ({
    email: validateEmail(v.email),
    password: v.password ? null : 'יש להזין סיסמה'
  }));

  // מי שכבר מחוברת לא צריכה את הדף הזה
  useEffect(() => {
    if (isLoggedIn) navigate(from ?? homeForRole(role), { replace: true });
  }, [isLoggedIn, role, from, navigate]);

  const submit = form.handleSubmit(async (values) => {
    clearExpired();
    await login({ email: values.email.trim(), password: values.password });
  });

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-head">
          <LogoMark size={52} />
          <h1>התחברות</h1>
          <p className="muted">ברוכה הבאה! הזיני את פרטי החשבון.</p>
        </div>

        {expired && (
          <Alert type="info" title="פג תוקף ההתחברות">מטעמי אבטחה צריך להתחבר שוב.</Alert>
        )}
        {from && !expired && <Alert type="info">כדי להמשיך, צריך להתחבר.</Alert>}
        <ApiErrorAlert
          error={form.formError && !Object.keys(form.formError.fieldErrors).length ? form.formError : null}
          title={form.formError?.status === 401 ? 'ההתחברות נכשלה' : undefined}
        />

        <form onSubmit={submit} noValidate className="form">
          <FormField
            label="אימייל"
            type="email"
            autoComplete="email"
            dir="ltr"
            required
            error={form.errors.email}
            {...form.bind('email')}
          />
          <FormField
            label="סיסמה"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            error={form.errors.password}
            {...form.bind('password')}
          />
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={form.submitting} aria-busy={form.submitting}>
            {form.submitting ? 'מתחברת…' : 'התחברות'}
          </button>
        </form>

        <p className="auth-switch">
          עוד אין לך חשבון? <Link to="/register" state={{ from }}>להרשמה</Link>
        </p>
      </div>
    </div>
  );
}
