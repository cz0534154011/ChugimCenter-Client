import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import AdminNav from './AdminNav';
import { ApiErrorAlert, Loading, Occupancy, PageHeader } from '../../components/Feedback';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../auth/AuthContext';
import { courseGroupsApi, enrollmentsApi, usersApi } from '../../api/endpoints';
import { dayName, formatTime } from '../../utils/format';

/**
 * סקירה למנהלת: מספרים מרכזיים וקבוצות שמתמלאות.
 * כל מספר מגיע מ-totalCount של בקשה עם PageSize=1 – בלי למשוך את כל הנתונים.
 */
export default function DashboardPage() {
  usePageTitle('ניהול');
  const { user } = useAuth();

  const stats = useFetch(async () => {
    const [groups, active, unpaid, members, instructors] = await Promise.all([
      courseGroupsApi.list({ pageSize: 1 }),
      enrollmentsApi.list({ status: 'Active', pageSize: 1 }),
      enrollmentsApi.list({ status: 'Active', isPaid: 'false', pageSize: 1 }),
      usersApi.list({ role: 'Member', pageSize: 1 }),
      usersApi.list({ role: 'Instructor', pageSize: 1 })
    ]);
    return {
      groups: groups.totalCount,
      active: active.totalCount,
      unpaid: unpaid.totalCount,
      members: members.totalCount,
      instructors: instructors.totalCount
    };
  }, []);

  // הקבוצות הקרובות להתמלא: עם מקום פנוי, ממוינות לפי תאריך התחלה
  const filling = useFetch(() => courseGroupsApi.list({ pageSize: 50 }), []);
  const nearlyFull = (filling.data?.items ?? [])
    .filter((g) => g.isActive && g.capacity > 0)
    .sort((a, b) => a.availableSpots - b.availableSpots)
    .slice(0, 5);

  const s = stats.data;
  return (
    <>
      <PageHeader eyebrow="ניהול המתנ״ס" title={`שלום ${user.fullName.split(' ')[0]}`} subtitle="תמונת מצב של החוגים והרישומים." />
      <AdminNav />

      <ApiErrorAlert error={stats.error} onRetry={stats.reload} />
      {stats.loading && !s && <Loading />}
      {s && (
        <ul className="stat-grid">
          <Stat to="/admin/groups" icon="grid" label="קבוצות שטרם הסתיימו" value={s.groups} />
          <Stat to="/admin/enrollments" icon="list" label="רישומים פעילים" value={s.active} />
          <Stat to="/admin/enrollments?status=Active&isPaid=false" icon="coin" label="ממתינים לתשלום" value={s.unpaid} tone={s.unpaid ? 'warning' : undefined} />
          <Stat to="/admin/users?role=Member" icon="roster" label="משתתפות רשומות" value={s.members} />
          <Stat to="/admin/users?role=Instructor" icon="badge" label="מדריכות" value={s.instructors} />
        </ul>
      )}

      <section className="section" aria-labelledby="filling-title">
        <div className="section-head">
          <h2 id="filling-title">קבוצות שמתמלאות</h2>
          <Link to="/admin/groups/new" className="btn btn-primary btn-sm"><Icon name="plus" size={16} /> קבוצה חדשה</Link>
        </div>
        <ApiErrorAlert error={filling.error} onRetry={filling.reload} />
        {nearlyFull.length > 0 && (
          <ul className="filling-list card">
            {nearlyFull.map((g) => (
              <li key={g.id}>
                <div>
                  <Link to={`/courses/${g.id}`} className="strong-link">{g.name}</Link>
                  <p className="muted small">{g.categoryName} · יום {dayName(g.dayOfWeek)} {formatTime(g.startTime)} · {g.instructorName}</p>
                </div>
                <Occupancy enrolled={g.enrolledCount} capacity={g.capacity} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ to, icon, label, value, tone }) {
  return (
    <li>
      <Link to={to} className={`stat-card ${tone ? `stat-${tone}` : ''}`}>
        <span className="stat-icon"><Icon name={icon} size={22} /></span>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </Link>
    </li>
  );
}
