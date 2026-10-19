import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import AdminNav from './AdminNav';
import Pagination from '../../components/Pagination';
import FormField, { Checkbox } from '../../components/FormField';
import { ConfirmDialog } from '../../components/Dialog';
import { ApiErrorAlert, Badge, EmptyState, Loading, Occupancy, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { categoriesApi, courseGroupsApi } from '../../api/endpoints';
import { toApiError } from '../../api/client';
import { dayName, formatShortDate, formatTime } from '../../utils/format';

/** ניהול קבוצות: טבלה עם סינון ועמודים, הפעלה/השבתה, מחיקה ועריכה */
export default function GroupsPage() {
  usePageTitle('ניהול קבוצות');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('categoryId') ?? '';
  const includeEnded = params.get('includeEnded') === 'true';
  const page = Number(params.get('page') ?? 1);
  const [toDelete, setToDelete] = useState(null);
  const [rowError, setRowError] = useState(null);

  const categories = useFetch(() => categoriesApi.list(), []);
  const groups = useFetch(
    () => courseGroupsApi.list({ categoryId, includeEnded, page, pageSize: 10, sortBy: 'StartDate' }),
    [categoryId, includeEnded, page]
  );

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v === false ? next.delete(k) : next.set(k, String(v))));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const toggle = async (g) => {
    setRowError(null);
    try {
      await courseGroupsApi.setActive(g.id, !g.isActive);
      toast(g.isActive ? `הקבוצה "${g.name}" הושבתה` : `הקבוצה "${g.name}" הופעלה`);
      groups.reload({ silent: true });
    } catch (err) {
      setRowError(toApiError(err));
    }
  };

  const remove = async () => {
    await courseGroupsApi.remove(toDelete.id);
    toast(`הקבוצה "${toDelete.name}" נמחקה`);
    groups.reload({ silent: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="קבוצות"
        subtitle="כל קבוצות החוגים, כולל קבוצות מושבתות."
        actions={<Link to="/admin/groups/new" className="btn btn-primary"><Icon name="plus" size={18} /> קבוצה חדשה</Link>}
      />
      <AdminNav />

      <div className="toolbar card">
        <FormField as="select" label="תחום" value={categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
          <option value="">כל התחומים</option>
          {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FormField>
        <Checkbox label="להציג גם קבוצות שהסתיימו" checked={includeEnded} onChange={(e) => update({ includeEnded: e.target.checked })} />
      </div>

      <ApiErrorAlert error={groups.error} onRetry={groups.reload} />
      <ApiErrorAlert error={rowError} />
      {groups.loading && !groups.data && <Loading />}
      {groups.data?.items.length === 0 && (
        <EmptyState icon="grid" title="אין קבוצות להצגה" action={<Link to="/admin/groups/new" className="btn btn-primary">פתיחת קבוצה</Link>} />
      )}

      {groups.data?.items.length > 0 && (
        <div className={`table-wrap card ${groups.loading ? 'is-refreshing' : ''}`}>
          <table className="table">
            <caption className="sr-only">רשימת הקבוצות</caption>
            <thead>
              <tr>
                <th scope="col">קבוצה</th>
                <th scope="col">מדריכה</th>
                <th scope="col">מועד</th>
                <th scope="col">תקופה</th>
                <th scope="col">תפוסה</th>
                <th scope="col">מצב</th>
                <th scope="col"><span className="sr-only">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {groups.data.items.map((g) => (
                <tr key={g.id} className={g.isActive ? '' : 'is-muted'}>
                  <th scope="row" className="cell-name">
                    <Link to={`/courses/${g.id}`} className="strong-link">{g.name}</Link>
                    <span className="cell-sub">{g.categoryName} · גילאי {g.minAge}–{g.maxAge}</span>
                  </th>
                  <td>{g.instructorName}</td>
                  <td>יום {dayName(g.dayOfWeek)}<span className="cell-sub">{formatTime(g.startTime)} · {g.durationMinutes} דק׳</span></td>
                  <td>{formatShortDate(g.startDate)}<span className="cell-sub">עד {formatShortDate(g.endDate)}</span></td>
                  <td className="cell-occupancy"><Occupancy enrolled={g.enrolledCount} capacity={g.capacity} compact /></td>
                  <td>{g.isActive ? <Badge tone="success">פעילה</Badge> : <Badge tone="muted">מושבתת</Badge>}</td>
                  <td className="cell-actions"><div className="row-actions">
                    <Link to={`/courses/${g.id}/students`} className="btn btn-ghost btn-icon" aria-label={`תלמידות בקבוצה ${g.name}`} title="רשימת תלמידות"><Icon name="roster" size={18} /></Link>
                    <Link to={`/admin/groups/${g.id}/edit`} className="btn btn-ghost btn-icon" aria-label={`עריכת הקבוצה ${g.name}`} title="עריכה"><Icon name="edit" size={18} /></Link>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => toggle(g)} aria-label={`${g.isActive ? 'השבתת' : 'הפעלת'} הקבוצה ${g.name}`} title={g.isActive ? 'השבתה' : 'הפעלה'}>
                      <Icon name="power" size={18} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon btn-danger-text" onClick={() => setToDelete(g)} aria-label={`מחיקת הקבוצה ${g.name}`} title="מחיקה">
                      <Icon name="trash" size={18} />
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {groups.data && (
        <Pagination page={groups.data.page} totalPages={groups.data.totalPages} totalCount={groups.data.totalCount} onChange={(p) => update({ page: p === 1 ? '' : p })} />
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="מחיקת קבוצה" confirmLabel="מחיקה" danger onConfirm={remove} onClose={() => setToDelete(null)}>
        <p>למחוק את הקבוצה <strong>{toDelete?.name}</strong>?</p>
        <p className="muted small">אפשר למחוק רק קבוצה שלא היו בה רישומים כלל. אחרת עדיף להשבית אותה.</p>
      </ConfirmDialog>
    </>
  );
}
