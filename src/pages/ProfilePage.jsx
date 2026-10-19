import { Link } from 'react-router-dom';
import { ApiErrorAlert, Loading, PageHeader } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { usePageTitle } from '../hooks/usePageTitle';
import { usersApi } from '../api/endpoints';
import { ROLE_LABELS, ROLES } from '../config';
import { ageAt, formatDate, formatDateTime } from '../utils/format';

/** הפרטים שלי – נטען מהשרת (GET /api/users/me), כדי להציג את המידע העדכני */
export default function ProfilePage() {
  usePageTitle('הפרטים שלי');
  const me = useFetch(() => usersApi.me(), []);

  if (me.loading && !me.data) return <Loading />;
  if (me.error) return <ApiErrorAlert error={me.error} onRetry={me.reload} />;

  const u = me.data;
  return (
    <>
      <PageHeader title="הפרטים שלי" subtitle={`${ROLE_LABELS[u.role]} באתר`} />
      <section className="card profile-card" aria-label="פרטי החשבון">
        <dl className="facts facts-two">
          <Row label="שם מלא">{u.fullName}</Row>
          <Row label="אימייל"><span dir="ltr">{u.email}</span></Row>
          <Row label="תפקיד">{ROLE_LABELS[u.role]}</Row>
          {u.phone && <Row label="טלפון"><span dir="ltr">{u.phone}</span></Row>}
          {u.birthDate && <Row label="תאריך לידה">{formatDate(u.birthDate)} (גיל {ageAt(u.birthDate)})</Row>}
          {u.parentName && <Row label="שם ההורה">{u.parentName}</Row>}
          {u.parentPhone && <Row label="טלפון ההורה"><span dir="ltr">{u.parentPhone}</span></Row>}
          <Row label="הצטרפות לאתר">{formatDateTime(u.createdAt)}</Row>
        </dl>
        <p className="muted small">לשינוי פרטים יש לפנות למזכירות המתנ״ס.</p>
        {u.role === ROLES.Member && <Link to="/my/enrollments" className="btn btn-secondary">לחוגים שלי</Link>}
      </section>
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
