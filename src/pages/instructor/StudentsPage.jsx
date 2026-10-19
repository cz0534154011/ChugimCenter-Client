import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { ApiErrorAlert, EmptyState, Loading, Occupancy, PageHeader } from '../../components/Feedback';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { courseGroupsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../config';
import { ageAt, dayName, formatDateTime, formatShortDate, formatTime, parseDateOnly } from '../../utils/format';

/**
 * רשימת התלמידות בקבוצה – למדריכה של הקבוצה ולמנהלת.
 * מדריכה של קבוצה אחרת מקבלת מהשרת 403, והדף מציג את ההודעה.
 */
export default function StudentsPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const group = useFetch(() => courseGroupsApi.get(id), [id]);
  const students = useFetch(() => courseGroupsApi.students(id), [id]);
  usePageTitle(group.data ? `תלמידות – ${group.data.name}` : 'רשימת תלמידות');

  const back = role === ROLES.Admin ? '/admin/groups' : '/my/groups';
  const g = group.data;

  return (
    <>
      <Link to={back} className="back-link no-print">
        <Icon name="chevronRight" size={18} /> {role === ROLES.Admin ? 'לניהול הקבוצות' : 'לקבוצות שלי'}
      </Link>

      <PageHeader
        eyebrow="רשימת תלמידות"
        title={g?.name ?? 'קבוצה'}
        subtitle={g && `יום ${dayName(g.dayOfWeek)}, ${formatTime(g.startTime)} · המדריכה ${g.instructorName}`}
        actions={students.data?.length > 0 && (
          <button type="button" className="btn btn-secondary no-print" onClick={() => window.print()}>
            הדפסת הרשימה
          </button>
        )}
      />

      {g && <div className="card occupancy-card"><Occupancy enrolled={g.enrolledCount} capacity={g.capacity} /></div>}

      <ApiErrorAlert error={students.error} onRetry={students.error?.status === 403 ? undefined : students.reload} />
      {students.loading && !students.data && <Loading />}

      {students.data && students.data.length === 0 && (
        <EmptyState icon="roster" title="עוד אין תלמידות רשומות בקבוצה" />
      )}

      {students.data && students.data.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <caption className="sr-only">התלמידות הרשומות לקבוצה (רישומים פעילים בלבד)</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">שם התלמידה</th>
                <th scope="col">גיל בתחילת החוג</th>
                <th scope="col">שם ההורה</th>
                <th scope="col">טלפון ההורה</th>
                <th scope="col">תאריך רישום</th>
              </tr>
            </thead>
            <tbody>
              {students.data.map((s, index) => (
                <tr key={s.enrollmentId}>
                  <td className="muted">{index + 1}</td>
                  <th scope="row">{s.fullName}</th>
                  <td>{g && s.birthDate ? ageAt(s.birthDate, parseDateOnly(g.startDate)) : '–'} <span className="muted small">({formatShortDate(s.birthDate)})</span></td>
                  <td>{s.parentName}</td>
                  <td><a href={`tel:${s.parentPhone}`} dir="ltr">{s.parentPhone}</a></td>
                  <td>{formatDateTime(s.enrolledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
