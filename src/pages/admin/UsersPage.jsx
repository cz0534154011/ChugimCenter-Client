import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import AdminNav from './AdminNav';
import Pagination from '../../components/Pagination';
import FormField from '../../components/FormField';
import { Dialog } from '../../components/Dialog';
import { ApiErrorAlert, Badge, EmptyState, Loading, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { usersApi } from '../../api/endpoints';
import { ROLE_LABELS } from '../../config';
import { ageAt, formatShortDate } from '../../utils/format';
import { validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validation';

const ROLE_TONES = { Admin: 'primary', Instructor: 'info', Member: 'neutral' };

/** משתמשות: סינון לפי תפקיד, עמודים, ויצירת מדריכה חדשה (רק המנהלת יוצרת מדריכות) */
export default function UsersPage() {
  usePageTitle('משתמשות ומדריכות');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [creating, setCreating] = useState(false);

  const users = useFetch(() => usersApi.list({ role, page, pageSize: 10 }), [role, page]);

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="משתמשות ומדריכות"
        subtitle="משתתפות נרשמות בעצמן. מדריכות נוספות רק כאן."
        actions={<button type="button" className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={18} /> מדריכה חדשה</button>}
      />
      <AdminNav />

      <div className="segmented" role="group" aria-label="סינון לפי תפקיד">
        {[['', 'כולן'], ['Member', 'משתתפות'], ['Instructor', 'מדריכות'], ['Admin', 'מנהלות']].map(([value, label]) => (
          <button
            key={value || 'all'}
            type="button"
            className={`segment ${role === value ? 'is-active' : ''}`}
            aria-pressed={role === value}
            onClick={() => setParams(value ? { role: value } : {})}
          >
            {label}
          </button>
        ))}
      </div>

      <ApiErrorAlert error={users.error} onRetry={users.reload} />
      {users.loading && !users.data && <Loading />}
      {users.data?.items.length === 0 && <EmptyState icon="badge" title="אין משתמשות להצגה" />}

      {users.data?.items.length > 0 && (
        <div className={`table-wrap card ${users.loading ? 'is-refreshing' : ''}`}>
          <table className="table">
            <caption className="sr-only">רשימת המשתמשות</caption>
            <thead>
              <tr>
                <th scope="col">שם</th>
                <th scope="col">תפקיד</th>
                <th scope="col">אימייל</th>
                <th scope="col">טלפון</th>
                <th scope="col">פרטים נוספים</th>
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((u) => (
                <tr key={u.id}>
                  <th scope="row">{u.fullName}</th>
                  <td><Badge tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td dir="ltr" className="cell-ltr">{u.email}</td>
                  <td dir="ltr" className="cell-ltr">{u.phone ?? u.parentPhone ?? '–'}</td>
                  <td className="muted small">
                    {u.birthDate ? `גיל ${ageAt(u.birthDate)} (${formatShortDate(u.birthDate)}) · הורה: ${u.parentName}` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.data && (
        <Pagination
          page={users.data.page}
          totalPages={users.data.totalPages}
          totalCount={users.data.totalCount}
          onChange={(p) => setParams({ ...(role ? { role } : {}), ...(p > 1 ? { page: p } : {}) })}
        />
      )}

      <Dialog open={creating} title="מדריכה חדשה" onClose={() => setCreating(false)}>
        {creating && (
          <InstructorForm
            onCancel={() => setCreating(false)}
            onCreated={(user) => {
              setCreating(false);
              toast(`המדריכה ${user.fullName} נוספה`);
              if (role === 'Instructor') users.reload({ silent: true });
              else setParams({ role: 'Instructor' });
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function InstructorForm({ onCancel, onCreated }) {
  const form = useForm({ fullName: '', email: '', phone: '', password: '' }, (v) => ({
    fullName: validateName(v.fullName, 'יש להזין שם מלא'),
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
    password: validatePassword(v.password)
  }));
  const generalError = form.formError && !Object.keys(form.formError.fieldErrors).length ? form.formError : null;

  const submit = form.handleSubmit(async (v) => {
    const user = await usersApi.createInstructor({
      fullName: v.fullName.trim(), email: v.email.trim(), phone: v.phone.trim(), password: v.password
    });
    onCreated(user);
  });

  return (
    <form onSubmit={submit} noValidate className="form">
      <ApiErrorAlert error={generalError} />
      <FormField label="שם מלא" required maxLength={60} autoFocus error={form.errors.fullName} {...form.bind('fullName')} />
      <FormField label="אימייל" type="email" dir="ltr" required autoComplete="off" error={form.errors.email} {...form.bind('email')} />
      <div className="form-grid">
        <FormField label="טלפון" type="tel" dir="ltr" required placeholder="050-1234567" error={form.errors.phone} {...form.bind('phone')} />
        <FormField label="סיסמה ראשונית" type="password" dir="ltr" required autoComplete="new-password" hint="לפחות 8 תווים. יש למסור אותה למדריכה" error={form.errors.password} {...form.bind('password')} />
      </div>
      <div className="btn-row btn-row-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>
        <button type="submit" className="btn btn-primary" disabled={form.submitting} aria-busy={form.submitting}>
          {form.submitting ? 'יוצרת…' : 'יצירת מדריכה'}
        </button>
      </div>
    </form>
  );
}
