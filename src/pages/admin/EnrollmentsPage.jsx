import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import AdminNav from './AdminNav';
import Pagination from '../../components/Pagination';
import FormField from '../../components/FormField';
import { ConfirmDialog } from '../../components/Dialog';
import { ApiErrorAlert, Badge, EmptyState, Loading, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { courseGroupsApi, enrollmentsApi } from '../../api/endpoints';
import { toApiError } from '../../api/client';
import { formatDateTime } from '../../utils/format';

/**
 * כל הרישומים: סינון לפי קבוצה, סטטוס ותשלום, סימון "שולם" וביטול.
 * אין סליקה – המנהלת מסמנת "שולם" אחרי תשלום במזכירות.
 */
export default function EnrollmentsPage() {
  usePageTitle('רישומים ותשלומים');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filters = {
    courseGroupId: params.get('courseGroupId') ?? '',
    status: params.get('status') ?? '',
    isPaid: params.get('isPaid') ?? '',
    page: Number(params.get('page') ?? 1)
  };
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [toCancel, setToCancel] = useState(null);

  const groups = useFetch(() => courseGroupsApi.list({ includeEnded: true, pageSize: 50, sortBy: 'Name' }), []);
  const list = useFetch(() => enrollmentsApi.list({ ...filters, pageSize: 15 }), [params.toString()]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' ? next.delete(k) : next.set(k, String(v))));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const togglePaid = async (e) => {
    setBusyId(e.id);
    setRowError(null);
    try {
      await enrollmentsApi.setPayment(e.id, !e.isPaid);
      toast(e.isPaid ? `הסימון "שולם" הוסר (${e.studentName})` : `סומן כשולם: ${e.studentName} – ${e.courseGroupName}`);
      list.reload({ silent: true });
    } catch (err) {
      setRowError(toApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async () => {
    await enrollmentsApi.cancel(toCancel.id);
    toast(`הרישום של ${toCancel.studentName} בוטל`);
    list.reload({ silent: true });
  };

  return (
    <>
      <PageHeader eyebrow="ניהול" title="רישומים ותשלומים" subtitle="סימון תשלום אחרי תשלום במזכירות, וביטול רישומים." />
      <AdminNav />

      <div className="toolbar card">
        <FormField as="select" label="קבוצה" value={filters.courseGroupId} onChange={(e) => update({ courseGroupId: e.target.value })}>
          <option value="">כל הקבוצות</option>
          {(groups.data?.items ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </FormField>
        <FormField as="select" label="סטטוס" value={filters.status} onChange={(e) => update({ status: e.target.value })}>
          <option value="">הכל</option>
          <option value="Active">פעיל</option>
          <option value="Cancelled">מבוטל</option>
        </FormField>
        <FormField as="select" label="תשלום" value={filters.isPaid} onChange={(e) => update({ isPaid: e.target.value })}>
          <option value="">הכל</option>
          <option value="true">שולם</option>
          <option value="false">לא שולם</option>
        </FormField>
      </div>

      <ApiErrorAlert error={list.error} onRetry={list.reload} />
      <ApiErrorAlert error={rowError} />
      {list.loading && !list.data && <Loading />}
      {list.data?.items.length === 0 && <EmptyState icon="list" title="אין רישומים שמתאימים לסינון" />}

      {list.data?.items.length > 0 && (
        <div className={`table-wrap card ${list.loading ? 'is-refreshing' : ''}`}>
          <table className="table">
            <caption className="sr-only">רשימת הרישומים</caption>
            <thead>
              <tr>
                <th scope="col">משתתפת</th>
                <th scope="col">קבוצה</th>
                <th scope="col">נרשמה</th>
                <th scope="col">סטטוס</th>
                <th scope="col">תשלום</th>
                <th scope="col"><span className="sr-only">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((e) => {
                const cancelled = e.status === 'Cancelled';
                return (
                  <tr key={e.id} className={cancelled ? 'is-muted' : ''}>
                    <th scope="row">{e.studentName}</th>
                    <td><Link to={`/courses/${e.courseGroupId}`}>{e.courseGroupName}</Link><span className="cell-sub">{e.categoryName}</span></td>
                    <td>{formatDateTime(e.enrolledAt)}</td>
                    <td>
                      {cancelled ? <Badge tone="muted">בוטל</Badge> : <Badge tone="success">פעיל</Badge>}
                      {e.cancelledAt && <span className="cell-sub">{formatDateTime(e.cancelledAt)}</span>}
                    </td>
                    <td>
                      {e.isPaid ? <Badge tone="success">שולם</Badge> : <Badge tone="warning">לא שולם</Badge>}
                      {e.paidAt && <span className="cell-sub">{formatDateTime(e.paidAt)}</span>}
                    </td>
                    <td className="cell-actions"><div className="row-actions">
                      {(!cancelled || e.isPaid) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => togglePaid(e)}
                          disabled={busyId === e.id}
                          aria-busy={busyId === e.id}
                        >
                          <Icon name={e.isPaid ? 'x' : 'check'} size={16} /> {e.isPaid ? 'ביטול סימון' : 'סימון שולם'}
                        </button>
                      )}
                      {!cancelled && (
                        <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={() => setToCancel(e)}>
                          <Icon name="trash" size={16} /> ביטול רישום
                        </button>
                      )}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {list.data && (
        <Pagination page={list.data.page} totalPages={list.data.totalPages} totalCount={list.data.totalCount} onChange={(p) => update({ page: p === 1 ? '' : p })} />
      )}

      <ConfirmDialog open={Boolean(toCancel)} title="ביטול רישום" confirmLabel="ביטול הרישום" danger onConfirm={cancel} onClose={() => setToCancel(null)}>
        <p>לבטל את הרישום של <strong>{toCancel?.studentName}</strong> לקבוצה <strong>{toCancel?.courseGroupName}</strong>?</p>
        {toCancel?.isPaid && <p className="muted small">הרישום סומן כשולם. ההחזר הכספי מתבצע במזכירות.</p>}
      </ConfirmDialog>
    </>
  );
}
