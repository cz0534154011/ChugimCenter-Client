import { useState } from 'react';
import Icon from '../../components/Icon';
import AdminNav from './AdminNav';
import FormField from '../../components/FormField';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { ApiErrorAlert, Badge, EmptyState, Loading, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { categoriesApi } from '../../api/endpoints';
import { toApiError } from '../../api/client';
import { validateName } from '../../utils/validation';

/**
 * ניהול תחומים: הוספה, שינוי שם, השבתה ומחיקה.
 * מחיקה של תחום שיש לו קבוצות נחסמת בשרת (409), וההודעה מציעה להשבית במקום.
 */
export default function CategoriesPage() {
  usePageTitle('ניהול תחומים');
  const toast = useToast();
  const categories = useFetch(() => categoriesApi.list(), []);
  const [editing, setEditing] = useState(null); // null – סגור; {} – חדש; תחום – עריכה
  const [toDelete, setToDelete] = useState(null);
  const [rowError, setRowError] = useState(null);

  const toggle = async (category) => {
    setRowError(null);
    try {
      await categoriesApi.setActive(category.id, !category.isActive);
      toast(category.isActive ? `התחום "${category.name}" הושבת` : `התחום "${category.name}" הופעל`);
      categories.reload({ silent: true });
    } catch (err) {
      setRowError(toApiError(err));
    }
  };

  const remove = async () => {
    await categoriesApi.remove(toDelete.id);
    toast(`התחום "${toDelete.name}" נמחק`);
    categories.reload({ silent: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="ניהול"
        title="תחומים"
        subtitle="סוגי החוגים באתר. תחום מושבת לא מוצג למשתתפות, ואי אפשר לפתוח בו קבוצות."
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={18} /> תחום חדש</button>}
      />
      <AdminNav />

      <ApiErrorAlert error={categories.error} onRetry={categories.reload} />
      <ApiErrorAlert error={rowError} />
      {categories.loading && !categories.data && <Loading />}
      {categories.data?.length === 0 && <EmptyState icon="tag" title="עוד אין תחומים" />}

      {categories.data?.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <caption className="sr-only">רשימת התחומים</caption>
            <thead>
              <tr>
                <th scope="col">שם התחום</th>
                <th scope="col">מצב</th>
                <th scope="col"><span className="sr-only">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {categories.data.map((c) => (
                <tr key={c.id} className={c.isActive ? '' : 'is-muted'}>
                  <th scope="row">{c.name}</th>
                  <td>{c.isActive ? <Badge tone="success">פעיל</Badge> : <Badge tone="muted">מושבת</Badge>}</td>
                  <td className="cell-actions"><div className="row-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(c)} aria-label={`שינוי שם לתחום ${c.name}`}>
                      <Icon name="edit" size={16} /> שינוי שם
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(c)} aria-label={`${c.isActive ? 'השבתת' : 'הפעלת'} התחום ${c.name}`}>
                      <Icon name="power" size={16} /> {c.isActive ? 'השבתה' : 'הפעלה'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={() => setToDelete(c)} aria-label={`מחיקת התחום ${c.name}`}>
                      <Icon name="trash" size={16} /> מחיקה
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryDialog
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          toast(isNew ? `התחום "${saved.name}" נוסף` : `השם עודכן ל"${saved.name}"`);
          setEditing(null);
          categories.reload({ silent: true });
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="מחיקת תחום"
        confirmLabel="מחיקה"
        danger
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      >
        <p>למחוק את התחום <strong>{toDelete?.name}</strong>?</p>
        <p className="muted small">אפשר למחוק רק תחום שאין בו קבוצות. אחרת עדיף להשבית אותו.</p>
      </ConfirmDialog>
    </>
  );
}

function CategoryDialog({ category, onClose, onSaved }) {
  const isNew = category && !category.id;
  return (
    <Dialog open={Boolean(category)} title={isNew ? 'תחום חדש' : 'שינוי שם התחום'} onClose={onClose} size="sm">
      {category && <CategoryForm key={category.id ?? 'new'} category={category} isNew={isNew} onCancel={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function CategoryForm({ category, isNew, onCancel, onSaved }) {
  const form = useForm({ name: category.name ?? '' }, (v) => ({ name: validateName(v.name, 'יש להזין שם לתחום', 50) }));
  const generalError = form.formError && !Object.keys(form.formError.fieldErrors).length ? form.formError : null;

  const submit = form.handleSubmit(async (v) => {
    const body = { name: v.name.trim() };
    const saved = isNew ? await categoriesApi.create(body) : await categoriesApi.update(category.id, body);
    onSaved(saved, isNew);
  });

  return (
    <form onSubmit={submit} noValidate className="form">
      <ApiErrorAlert error={generalError} />
      <FormField label="שם התחום" required maxLength={50} autoFocus error={form.errors.name} {...form.bind('name')} />
      <div className="btn-row btn-row-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>
        <button type="submit" className="btn btn-primary" disabled={form.submitting} aria-busy={form.submitting}>
          {form.submitting ? 'שומרת…' : 'שמירה'}
        </button>
      </div>
    </form>
  );
}
