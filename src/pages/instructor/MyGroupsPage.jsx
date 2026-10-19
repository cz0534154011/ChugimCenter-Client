import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { ApiErrorAlert, Badge, EmptyState, Loading, Occupancy, PageHeader } from '../../components/Feedback';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { usersApi } from '../../api/endpoints';
import { dayName, endTime, formatDate, formatTime } from '../../utils/format';
import { categoryTone } from '../../utils/categoryTone';

/** "הקבוצות שלי" של המדריכה המחוברת, עם תפוסה וקישור לרשימת התלמידות */
export default function MyGroupsPage() {
  usePageTitle('הקבוצות שלי');
  const groups = useFetch(() => usersApi.myCourseGroups(), []);

  return (
    <>
      <PageHeader title="הקבוצות שלי" subtitle="הקבוצות שאת מדריכה, לפי ימי השבוע." />
      <ApiErrorAlert error={groups.error} onRetry={groups.reload} />
      {groups.loading && !groups.data && <Loading />}
      {groups.data && groups.data.length === 0 && (
        <EmptyState icon="roster" title="עוד לא שובצת לקבוצות">המנהלת משבצת מדריכות לקבוצות.</EmptyState>
      )}
      {groups.data && groups.data.length > 0 && (
        <ul className="group-list">
          {groups.data.map((g) => (
            <li key={g.id} className={`group-item card tone-${categoryTone(g.categoryId)}`}>
              <div className="group-item-main">
                <div className="group-item-head">
                  <span className="category-chip">{g.categoryName}</span>
                  {!g.isActive && <Badge tone="muted">מושבתת</Badge>}
                </div>
                <h2 className="group-item-title"><Link to={`/courses/${g.id}`}>{g.name}</Link></h2>
                <p className="enrollment-meta">
                  <Icon name="calendar" size={16} /> יום {dayName(g.dayOfWeek)} · <Icon name="clock" size={16} />{' '}
                  {formatTime(g.startTime)}–{endTime(g.startTime, g.durationMinutes)}
                </p>
                <p className="muted small">{formatDate(g.startDate)} – {formatDate(g.endDate)} · גילאי {g.minAge}–{g.maxAge}</p>
              </div>
              <div className="group-item-side">
                <Occupancy enrolled={g.enrolledCount} capacity={g.capacity} compact />
                <Link to={`/courses/${g.id}/students`} className="btn btn-primary btn-sm">
                  <Icon name="roster" size={16} /> רשימת התלמידות
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
