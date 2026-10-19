import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, ApiErrorAlert, Badge, Loading, Occupancy } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/Toast';
import { courseGroupsApi, enrollmentsApi, usersApi } from '../api/endpoints';
import { toApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../config';
import { categoryTone } from '../utils/categoryTone';
import {
  ageAt, dayName, endTime, formatDate, formatPrice, formatTime, parseDateOnly
} from '../utils/format';

/** דף קבוצה: כל הפרטים, והפעולה המתאימה לכל תפקיד – רישום, רשימת תלמידות או עריכה */
export default function CourseDetailsPage() {
  const { id } = useParams();
  const group = useFetch(() => courseGroupsApi.get(id), [id]);
  usePageTitle(group.data?.name ?? 'פרטי חוג');

  if (group.loading && !group.data) return <Loading label="טוען את פרטי החוג…" />;
  if (group.error && !group.data) {
    return (
      <>
        <BackLink />
        <ApiErrorAlert error={group.error} onRetry={group.error.status === 404 ? undefined : group.reload} />
      </>
    );
  }

  const g = group.data;
  return (
    <>
      <BackLink />
      <article className={`course-details tone-${categoryTone(g.categoryId)}`}>
        <header className="course-details-header">
          <div>
            <span className="category-chip">{g.categoryName}</span>
            {!g.isActive && <Badge tone="muted">קבוצה מושבתת</Badge>}
            <h1>{g.name}</h1>
            <p className="page-subtitle">עם המדריכה {g.instructorName}</p>
          </div>
          <div className="price-box">
            <span className="price">{formatPrice(g.price)}</span>
            <span className="muted small">לחודש</span>
          </div>
        </header>

        <div className="details-grid">
          <section className="card details-card" aria-labelledby="schedule-title">
            <h2 id="schedule-title">מתי ואיפה</h2>
            <dl className="facts">
              <Fact icon="calendar" label="יום בשבוע">יום {dayName(g.dayOfWeek)}</Fact>
              <Fact icon="clock" label="שעות">{formatTime(g.startTime)}–{endTime(g.startTime, g.durationMinutes)} ({g.durationMinutes} דקות)</Fact>
              <Fact icon="sun" label="תקופה">{formatDate(g.startDate)} – {formatDate(g.endDate)}</Fact>
              <Fact icon="list" label="מספר מפגשים">{g.sessionsCount} מפגשים, מפגש אחד בשבוע</Fact>
              <Fact icon="steps" label="גילאים">{g.minAge}–{g.maxAge}</Fact>
            </dl>
          </section>

          <section className="card details-card enroll-card" aria-labelledby="enroll-title">
            <h2 id="enroll-title">מקומות בקבוצה</h2>
            <Occupancy enrolled={g.enrolledCount} capacity={g.capacity} />
            <ActionPanel group={g} onGroupChanged={() => group.reload({ silent: true })} />
          </section>
        </div>
      </article>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/courses" className="back-link">
      <Icon name="chevronRight" size={18} /> לכל החוגים
    </Link>
  );
}

function Fact({ icon, label, children }) {
  return (
    <div className="fact">
      <dt><Icon name={icon} size={18} /> {label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** הפעולות בדף, לפי מי שמחוברת */
function ActionPanel({ group, onGroupChanged }) {
  const { isLoggedIn, role, user } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <div className="enroll-guest">
        <p>כדי להירשם לחוג צריך להתחבר לאתר.</p>
        <div className="btn-row">
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">התחברות והרשמה לחוג</Link>
          <Link to="/register" state={{ from: location.pathname }} className="btn btn-ghost">עוד אין לך חשבון?</Link>
        </div>
      </div>
    );
  }

  if (role === ROLES.Member) return <EnrollPanel group={group} user={user} onGroupChanged={onGroupChanged} />;

  const canSeeStudents = role === ROLES.Admin || group.instructorId === user.id;
  return (
    <div className="btn-row">
      {canSeeStudents && (
        <Link to={`/courses/${group.id}/students`} className="btn btn-primary">
          <Icon name="roster" size={18} /> רשימת התלמידות
        </Link>
      )}
      {role === ROLES.Admin && (
        <Link to={`/admin/groups/${group.id}/edit`} className="btn btn-secondary">
          <Icon name="edit" size={18} /> עריכת הקבוצה
        </Link>
      )}
      {!canSeeStudents && <p className="muted">הרישום לחוגים פתוח למשתתפות בלבד.</p>}
    </div>
  );
}

/**
 * הרישום לחוג – המשאב המוגבל.
 * אם השרת מחזיר 409 (המקום נתפס, הקבוצה מלאה, חפיפה בזמן) – מוצגת הודעה ברורה וכפתור "נסי שוב",
 * שמרענן את מספר המקומות מהשרת ומנסה שוב רק אם עדיין יש מקום.
 */
function EnrollPanel({ group, user, onGroupChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(null);

  // האם כבר רשומה לקבוצה הזו? (רישום פעיל בלבד)
  const mine = useFetch(
    () => usersApi.myEnrollments({ courseGroupId: group.id, pageSize: 1 }),
    [group.id]
  );
  const existing = enrolled ?? mine.data?.items?.[0];

  const age = user.birthDate ? ageAt(user.birthDate, parseDateOnly(group.startDate)) : null;
  const ageMismatch = age !== null && (age < group.minAge || age > group.maxAge);
  const isFull = group.availableSpots === 0;

  const enroll = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await enrollmentsApi.enroll(group.id);
      setEnrolled(result);
      toast(`נרשמת בהצלחה לחוג "${group.name}"`);
      onGroupChanged();
    } catch (err) {
      setError(toApiError(err));
      onGroupChanged();
    } finally {
      setBusy(false);
    }
  };

  // "נסי שוב": קודם מרעננים מהשרת, ורק אם עדיין יש מקום – שולחים שוב
  const retry = async () => {
    setBusy(true);
    try {
      const fresh = await courseGroupsApi.get(group.id);
      onGroupChanged();
      if (fresh.availableSpots > 0) {
        setBusy(false);
        await enroll();
        return;
      }
      setError({ status: 409, message: 'בדקנו שוב – הקבוצה מלאה כעת. אפשר לבחור קבוצה אחרת.' });
    } catch (err) {
      setError(toApiError(err));
    }
    setBusy(false);
  };

  if (mine.loading && !mine.data) return <Loading label="בודק רישום קיים…" />;

  if (existing) {
    return (
      <Alert type="success" title="את רשומה לחוג הזה">
        <p>
          {enrolled ? 'הרישום נשמר. ' : ''}
          התשלום מתבצע במזכירות המתנ״ס. אפשר לראות ולבטל את הרישום בדף{' '}
          <Link to="/my/enrollments">החוגים שלי</Link>.
        </p>
      </Alert>
    );
  }

  return (
    <div className="enroll-panel">
      {ageMismatch && (
        <Alert type="info" title="שימי לב לגיל">
          הקבוצה מיועדת לגילאי {group.minAge}–{group.maxAge}, ובתחילת החוג הגיל שלך יהיה {age}.
        </Alert>
      )}

      {error && (
        <ApiErrorAlert
          error={error}
          title={error.status === 409 ? 'הרישום לא הושלם' : undefined}
          onRetry={error.status === 409 && !isFull ? retry : undefined}
        />
      )}

      {isFull && !error ? (
        <Alert type="warning" title="הקבוצה מלאה">אין כרגע מקומות פנויים. אפשר לבחור קבוצה אחרת באותו תחום.</Alert>
      ) : null}

      {!(error?.status === 409 && !isFull) && <button
        type="button"
        className="btn btn-primary btn-lg btn-block"
        onClick={enroll}
        disabled={busy || isFull}
        aria-busy={busy}
      >
        {busy ? 'שומרת את המקום…' : isFull ? 'אין מקומות פנויים' : 'הרשמה לחוג'}
      </button>}
      <p className="muted small center">התשלום ({formatPrice(group.price)} לחודש) מתבצע במזכירות.</p>
    </div>
  );
}
