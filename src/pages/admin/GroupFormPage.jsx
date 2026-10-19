import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import FormField from '../../components/FormField';
import { Alert, ApiErrorAlert, Loading, PageHeader } from '../../components/Feedback';
import { useToast } from '../../components/Toast';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { categoriesApi, courseGroupsApi, usersApi } from '../../api/endpoints';
import { dayName, endTime, formatDate, previewSchedule, toDateOnly } from '../../utils/format';

const EMPTY = {
  name: '', categoryId: '', instructorId: '', startDate: '', sessionsCount: '30', startTime: '16:00',
  durationMinutes: '60', minAge: '6', maxAge: '10', price: '', capacity: '12'
};

/** יצירה ועריכה של קבוצה. היום בשבוע ותאריך הסיום מוצגים אוטומטית לפי תאריך ההתחלה ומספר המפגשים */
export default function GroupFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? 'עריכת קבוצה' : 'קבוצה חדשה');

  const data = useFetch(async () => {
    const [categories, instructors, group] = await Promise.all([
      categoriesApi.list(),
      usersApi.list({ role: 'Instructor', pageSize: 50 }),
      isEdit ? courseGroupsApi.get(id) : Promise.resolve(null)
    ]);
    return { categories, instructors: instructors.items, group };
  }, [id]);

  if (data.loading && !data.data) return <Loading />;
  if (data.error) return <ApiErrorAlert error={data.error} onRetry={data.reload} />;

  return <GroupForm key={id ?? 'new'} isEdit={isEdit} {...data.data} />;
}

function GroupForm({ isEdit, categories, instructors, group }) {
  const navigate = useNavigate();
  const toast = useToast();
  const today = toDateOnly(new Date());

  const initial = group
    ? {
        name: group.name,
        categoryId: String(group.categoryId),
        instructorId: String(group.instructorId),
        startDate: group.startDate,
        sessionsCount: String(group.sessionsCount),
        startTime: group.startTime.slice(0, 5),
        durationMinutes: String(group.durationMinutes),
        minAge: String(group.minAge),
        maxAge: String(group.maxAge),
        price: String(group.price),
        capacity: String(group.capacity)
      }
    : EMPTY;

  const form = useForm(initial, (v) => ({
    name: !v.name.trim() ? 'יש להזין שם לקבוצה' : v.name.length > 100 ? 'אפשר עד 100 תווים' : null,
    categoryId: v.categoryId ? null : 'יש לבחור תחום',
    instructorId: v.instructorId ? null : 'יש לבחור מדריכה',
    startDate: !v.startDate ? 'יש לבחור תאריך התחלה' : !isEdit && v.startDate < today ? 'תאריך ההתחלה לא יכול להיות בעבר' : null,
    sessionsCount: range(v.sessionsCount, 1, 60, 'מספר המפגשים'),
    startTime: v.startTime ? null : 'יש לבחור שעת התחלה',
    durationMinutes: range(v.durationMinutes, 15, 240, 'משך המפגש'),
    minAge: range(v.minAge, 3, 18, 'הגיל המינימלי'),
    maxAge: range(v.maxAge, 3, 18, 'הגיל המקסימלי') ??
      (Number(v.minAge) > Number(v.maxAge) ? 'הגיל המקסימלי לא יכול להיות קטן מהמינימלי' : null),
    price: v.price === '' ? 'יש להזין מחיר' : range(v.price, 0, 10000, 'המחיר'),
    capacity: range(v.capacity, 1, 100, 'מספר המקומות') ??
      (group && Number(v.capacity) < group.enrolledCount ? `כבר רשומות ${group.enrolledCount} בנות – אי אפשר פחות מקומות` : null)
  }));

  const v = form.values;
  const schedule = previewSchedule(v.startDate, Number(v.sessionsCount));

  const submit = form.handleSubmit(async (values) => {
    const body = {
      name: values.name.trim(),
      categoryId: Number(values.categoryId),
      instructorId: Number(values.instructorId),
      startDate: values.startDate,
      sessionsCount: Number(values.sessionsCount),
      startTime: `${values.startTime}:00`,
      durationMinutes: Number(values.durationMinutes),
      minAge: Number(values.minAge),
      maxAge: Number(values.maxAge),
      price: Number(values.price),
      capacity: Number(values.capacity)
    };
    const saved = isEdit ? await courseGroupsApi.update(group.id, body) : await courseGroupsApi.create(body);
    toast(isEdit ? 'השינויים נשמרו' : `הקבוצה "${saved.name}" נפתחה`);
    navigate('/admin/groups');
  });

  const generalError = form.formError && !Object.keys(form.formError.fieldErrors).length ? form.formError : null;
  // תחום מושבת לא מוצע לקבוצה חדשה; בעריכה התחום הנוכחי נשאר ברשימה
  const categoryOptions = categories.filter((c) => c.isActive || c.id === group?.categoryId);

  return (
    <>
      <Link to="/admin/groups" className="back-link"><Icon name="chevronRight" size={18} /> לניהול הקבוצות</Link>
      <PageHeader eyebrow="ניהול" title={isEdit ? `עריכת "${group.name}"` : 'פתיחת קבוצה חדשה'} />

      <form onSubmit={submit} noValidate className="form group-form">
        <ApiErrorAlert error={generalError} title={generalError?.status === 409 ? 'לא ניתן לשמור' : undefined} />

        <div className="group-form-layout">
          <div className="group-form-fields">
            <fieldset className="fieldset card">
              <legend>פרטי הקבוצה</legend>
              <FormField label="שם הקבוצה" required maxLength={100} placeholder="לדוגמה: ציור מתחילות" error={form.errors.name} {...form.bind('name')} />
              <div className="form-grid">
                <FormField as="select" label="תחום" required error={form.errors.categoryId} {...form.bind('categoryId')}>
                  <option value="">בחירת תחום</option>
                  {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (מושבת)'}</option>)}
                </FormField>
                <FormField as="select" label="מדריכה" required error={form.errors.instructorId} {...form.bind('instructorId')}
                  hint="מדריכה לא תשובץ לשתי קבוצות באותו זמן">
                  <option value="">בחירת מדריכה</option>
                  {instructors.map((i) => <option key={i.id} value={i.id}>{i.fullName}</option>)}
                </FormField>
              </div>
            </fieldset>

            <fieldset className="fieldset card">
              <legend>מועדים</legend>
              <div className="form-grid">
                <FormField label="תאריך התחלה" type="date" required min={isEdit ? undefined : today} error={form.errors.startDate} {...form.bind('startDate')} />
                <FormField label="מספר מפגשים" type="number" required min={1} max={60} hint="מפגש אחד בשבוע" error={form.errors.sessionsCount} {...form.bind('sessionsCount')} />
                <FormField label="שעת התחלה" type="time" required step={300} error={form.errors.startTime} {...form.bind('startTime')} />
                <FormField label="משך מפגש (דקות)" type="number" required min={15} max={240} step={5} error={form.errors.durationMinutes} {...form.bind('durationMinutes')} />
              </div>
            </fieldset>

            <fieldset className="fieldset card">
              <legend>משתתפות ומחיר</legend>
              <div className="form-grid form-grid-4">
                <FormField label="גיל מינימלי" type="number" required min={3} max={18} error={form.errors.minAge} {...form.bind('minAge')} />
                <FormField label="גיל מקסימלי" type="number" required min={3} max={18} error={form.errors.maxAge} {...form.bind('maxAge')} />
                <FormField label="מספר מקומות" type="number" required min={1} max={100} error={form.errors.capacity} {...form.bind('capacity')} />
                <FormField label="מחיר לחודש (₪)" type="number" required min={0} max={10000} error={form.errors.price} {...form.bind('price')} />
              </div>
            </fieldset>
          </div>

          <aside className="group-form-preview card" aria-labelledby="preview-title" aria-live="polite">
            <h2 id="preview-title" className="preview-title"><Icon name="sparkle" size={18} /> מחושב אוטומטית</h2>
            {schedule ? (
              <dl className="facts">
                <div className="fact"><dt>יום בשבוע</dt><dd>יום {dayName(schedule.day)}</dd></div>
                <div className="fact"><dt>מפגש אחרון</dt><dd>{formatDate(schedule.endDate)}</dd></div>
                {v.startTime && <div className="fact"><dt>שעות</dt><dd>{v.startTime}–{endTime(`${v.startTime}:00`, v.durationMinutes)}</dd></div>}
              </dl>
            ) : (
              <p className="muted small">בחרי תאריך התחלה ומספר מפגשים, והיום בשבוע ותאריך הסיום יוצגו כאן.</p>
            )}
            {schedule?.day === 'Saturday' && <Alert type="warning">תאריך ההתחלה חל בשבת.</Alert>}
            {isEdit && group && <p className="muted small">רשומות כעת: {group.enrolledCount} מתוך {group.capacity}</p>}
          </aside>
        </div>

        <div className="form-actions">
          <Link to="/admin/groups" className="btn btn-ghost">ביטול</Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={form.submitting} aria-busy={form.submitting}>
            {form.submitting ? 'שומרת…' : isEdit ? 'שמירת השינויים' : 'פתיחת הקבוצה'}
          </button>
        </div>
      </form>
    </>
  );
}

function range(value, min, max, label) {
  if (value === '' || value === null) return `יש להזין ${label}`;
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} חייב להיות מספר`;
  return n < min || n > max ? `${label} חייב להיות בין ${min} ל-${max}` : null;
}
