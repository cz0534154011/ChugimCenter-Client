import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { ApiErrorAlert } from '../components/Feedback';
import { LogoMark } from '../components/Logo';
import { useForm } from '../hooks/useForm';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';
import { toDateOnly } from '../utils/format';
import { validateEmail, validateName, validatePassword, validatePhone } from '../utils/validation';
import { homeForRole } from './LoginPage';

const today = toDateOnly(new Date());

/** הרשמה עצמית של משתתפת. החשבון הוא של הבת, עם פרטי ההורה */
export default function RegisterPage() {
  usePageTitle('הרשמה');
  const { register, isLoggedIn, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from;

  const form = useForm(
    { fullName: '', birthDate: '', email: '', password: '', confirmPassword: '', parentName: '', parentPhone: '' },
    (v) => ({
      fullName: validateName(v.fullName, 'יש להזין את שם הבת'),
      birthDate: !v.birthDate ? 'יש להזין תאריך לידה' : v.birthDate > today ? 'תאריך הלידה לא יכול להיות בעתיד' : null,
      email: validateEmail(v.email),
      password: validatePassword(v.password),
      confirmPassword: v.confirmPassword !== v.password ? 'הסיסמאות אינן זהות' : null,
      parentName: validateName(v.parentName, 'יש להזין את שם ההורה'),
      parentPhone: validatePhone(v.parentPhone, 'יש להזין טלפון של ההורה')
    })
  );

  useEffect(() => {
    if (isLoggedIn) navigate(from ?? homeForRole(role), { replace: true });
  }, [isLoggedIn, role, from, navigate]);

  const submit = form.handleSubmit(async (v) => {
    const user = await register({
      fullName: v.fullName.trim(),
      birthDate: v.birthDate,
      email: v.email.trim(),
      password: v.password,
      parentName: v.parentName.trim(),
      parentPhone: v.parentPhone.trim()
    });
    toast(`ברוכה הבאה, ${user.fullName}! החשבון נוצר.`);
  });

  const generalError = form.formError && !Object.keys(form.formError.fieldErrors).length ? form.formError : null;

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide card">
        <div className="auth-head">
          <LogoMark size={52} />
          <h1>הרשמה לאתר</h1>
          <p className="muted">החשבון הוא של הבת המשתתפת בחוג. בסיום אפשר להירשם לחוגים מיד.</p>
        </div>

        <ApiErrorAlert error={generalError} title={generalError?.status === 409 ? 'לא ניתן להירשם' : undefined} />

        <form onSubmit={submit} noValidate className="form">
          <fieldset className="fieldset">
            <legend>פרטי הבת</legend>
            <div className="form-grid">
              <FormField label="שם מלא" autoComplete="name" required maxLength={60} error={form.errors.fullName} {...form.bind('fullName')} />
              <FormField label="תאריך לידה" type="date" max={today} required error={form.errors.birthDate} {...form.bind('birthDate')} />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>פרטי התחברות</legend>
            <FormField label="אימייל" type="email" autoComplete="email" dir="ltr" required maxLength={100} error={form.errors.email} {...form.bind('email')} />
            <div className="form-grid">
              <FormField label="סיסמה" type="password" autoComplete="new-password" dir="ltr" required hint="לפחות 8 תווים" error={form.errors.password} {...form.bind('password')} />
              <FormField label="אימות סיסמה" type="password" autoComplete="new-password" dir="ltr" required error={form.errors.confirmPassword} {...form.bind('confirmPassword')} />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>פרטי ההורה</legend>
            <div className="form-grid">
              <FormField label="שם ההורה" required maxLength={60} error={form.errors.parentName} {...form.bind('parentName')} />
              <FormField label="טלפון ההורה" type="tel" autoComplete="tel" dir="ltr" required placeholder="050-1234567" hint="יוצג למדריכה ברשימת התלמידות" error={form.errors.parentPhone} {...form.bind('parentPhone')} />
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={form.submitting} aria-busy={form.submitting}>
            {form.submitting ? 'יוצרת חשבון…' : 'יצירת חשבון'}
          </button>
        </form>

        <p className="auth-switch">
          כבר יש לך חשבון? <Link to="/login" state={{ from }}>להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
