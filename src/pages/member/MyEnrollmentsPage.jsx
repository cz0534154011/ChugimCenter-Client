import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import { ConfirmDialog } from '../../components/Dialog';
import { ApiErrorAlert, Badge, EmptyState, Loading, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { enrollmentsApi, usersApi } from '../../api/endpoints';
import { dayName, formatDateTime, formatTime } from '../../utils/format';

const TABS = [
  { key: 'Active', label: 'רישומים פעילים' },
  { key: 'Cancelled', label: 'רישומים שבוטלו' }
];

/**
 * "החוגים שלי". כברירת מחדל השרת מחזיר רק רישומים פעילים;
 * בלשונית "שבוטלו" נשלח Status=Cancelled.
 */
export default function MyEnrollmentsPage() {
  usePageTitle('החוגים שלי');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') === 'Cancelled' ? 'Cancelled' : 'Active';
  const page = Number(params.get('page') ?? 1);
  const [toCancel, setToCancel] = useState(null);

  const list = useFetch(
    () => usersApi.myEnrollments({ status: status === 'Cancelled' ? 'Cancelled' : '', page, pageSize: 10 }),
    [status, page]
  );

  const selectTab = (key) => setParams(key === 'Active' ? {} : { status: key });

  const cancel = async () => {
    await enrollmentsApi.cancel(toCancel.id);
    toast(`הרישום ל"${toCancel.courseGroupName}" בוטל`);
    list.reload({ silent: true });
  };

  return (
    <>
      <PageHeader
        title="החוגים שלי"
        subtitle="כל החוגים שאת רשומה אליהם. התשלום מתבצע במזכירות."
        actions={<Link to="/courses" className="btn btn-primary"><Icon name="plus" size={18} /> הרשמה לחוג נוסף</Link>}
      />

      <div className="tabs" role="tablist" aria-label="סוג הרישומים">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={status === tab.key}
            aria-controls="enrollments-panel"
            className={`tab ${status === tab.key ? 'is-active' : ''}`}
            onClick={() => selectTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section id="enrollments-panel" role="tabpanel" aria-labelledby={`tab-${status}`}>
        <ApiErrorAlert error={list.error} onRetry={list.reload} />
        {list.loading && !list.data && <Loading />}

        {list.data && list.data.items.length === 0 && (
          status === 'Active' ? (
            <EmptyState icon="sparkle" title="עוד לא נרשמת לחוגים" action={<Link to="/courses" className="btn btn-primary">לבחירת חוג</Link>}>
              כל החוגים מחכים לך ברשימה.
            </EmptyState>
          ) : (
            <EmptyState icon="list" title="אין רישומים שבוטלו" />
          )
        )}

        {list.data && list.data.items.length > 0 && (
          <ul className="enrollment-list">
            {list.data.items.map((e) => (
              <li key={e.id} className="enrollment-item card">
                <div className="enrollment-main">
                  <span className="category-chip">{e.categoryName}</span>
                  <h2 className="enrollment-title">
                    <Link to={`/courses/${e.courseGroupId}`}>{e.courseGroupName}</Link>
                  </h2>
                  <p className="enrollment-meta">
                    <Icon name="calendar" size={16} /> יום {dayName(e.dayOfWeek)} · <Icon name="clock" size={16} /> {formatTime(e.startTime)}
                  </p>
                  <p className="muted small">
                    נרשמת ב-{formatDateTime(e.enrolledAt)}
                    {e.cancelledAt && ` · בוטל ב-${formatDateTime(e.cancelledAt)}`}
                  </p>
                </div>
                <div className="enrollment-side">
                  {e.isPaid ? <Badge tone="success">שולם</Badge> : <Badge tone="warning">ממתין לתשלום</Badge>}
                  {status === 'Active' && (
                    e.isPaid ? (
                      <p className="muted small">רישום ששולם מבטלים דרך המזכירות</p>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={() => setToCancel(e)}>
                        <Icon name="x" size={16} /> ביטול רישום
                      </button>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {list.data && (
          <Pagination
            page={list.data.page}
            totalPages={list.data.totalPages}
            totalCount={list.data.totalCount}
            onChange={(p) => setParams({ ...(status === 'Cancelled' ? { status } : {}), ...(p > 1 ? { page: p } : {}) })}
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="ביטול רישום"
        confirmLabel="כן, לבטל את הרישום"
        danger
        onConfirm={cancel}
        onClose={() => setToCancel(null)}
      >
        <p>לבטל את הרישום לחוג <strong>{toCancel?.courseGroupName}</strong>?</p>
        <p className="muted small">המקום יתפנה לבנות אחרות. אפשר להירשם שוב בהמשך, אם יישאר מקום.</p>
      </ConfirmDialog>
    </>
  );
}
