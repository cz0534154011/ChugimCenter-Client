import { useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import FormField, { Checkbox } from '../components/FormField';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { ApiErrorAlert, EmptyState, Loading, PageHeader } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { usePageTitle } from '../hooks/usePageTitle';
import { categoriesApi, courseGroupsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { DAYS_OF_WEEK, dayName } from '../utils/format';
import { ROLES } from '../config';

const PAGE_SIZE = 9;

// אפשרויות המיון: SortBy ו-Descending, כמו ב-CourseGroupQueryDto בשרת
const SORT_OPTIONS = [
  { value: 'StartDate', label: 'תאריך התחלה' },
  { value: 'Name', label: 'שם החוג (א–ת)' },
  { value: 'Price', label: 'מחיר: מהנמוך' },
  { value: 'Price-desc', label: 'מחיר: מהגבוה' }
];

/**
 * רשימת החוגים: סינון, מיון ועמודים מול השרת.
 * כל הבחירות נשמרות בכתובת הדף, כך שאפשר לחזור אחורה או לשתף קישור לחיפוש.
 */
export default function CoursesPage() {
  usePageTitle('כל החוגים');
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();

  const filters = {
    categoryId: params.get('categoryId') ?? '',
    age: params.get('age') ?? '',
    dayOfWeek: params.get('dayOfWeek') ?? '',
    onlyAvailable: params.get('onlyAvailable') === 'true',
    includeEnded: params.get('includeEnded') === 'true',
    sort: params.get('sort') ?? 'StartDate',
    page: Number(params.get('page') ?? 1)
  };

  const categories = useFetch(() => categoriesApi.list(), []);
  const query = params.toString();
  const groups = useFetch(() => {
    const [sortBy, direction] = filters.sort.split('-');
    return courseGroupsApi.list({
      categoryId: filters.categoryId,
      // גיל מחוץ לטווח 3–18 לא נשלח (השרת היה מחזיר 400)
      age: Number(filters.age) >= 3 && Number(filters.age) <= 18 ? filters.age : '',
      dayOfWeek: filters.dayOfWeek,
      onlyAvailable: filters.onlyAvailable,
      includeEnded: filters.includeEnded,
      sortBy,
      descending: direction === 'desc',
      page: filters.page,
      pageSize: PAGE_SIZE
    });
  }, [query]);

  /** עדכון סינון: חוזרים לעמוד 1, ומוחקים מהכתובת ערכים ריקים */
  const update = (changes, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === false || value === null) next.delete(key);
      else next.set(key, String(value));
    });
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const hasFilters = ['categoryId', 'age', 'dayOfWeek', 'onlyAvailable', 'includeEnded'].some((k) => params.has(k));
  const data = groups.data;

  return (
    <>
      <PageHeader
        title="כל החוגים"
        subtitle="בחרי תחום, גיל ויום – ומצאי את הקבוצה המתאימה."
      />

      <div className="courses-layout">
        <aside className="filters card" aria-labelledby="filters-title">
          <h2 id="filters-title" className="filters-title"><Icon name="filter" size={18} /> סינון ומיון</h2>
          <form onSubmit={(e) => e.preventDefault()} className="filters-form">
            <FormField
              as="select"
              label="תחום"
              value={filters.categoryId}
              onChange={(e) => update({ categoryId: e.target.value })}
            >
              <option value="">כל התחומים</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (מושבת)'}</option>
              ))}
            </FormField>

            <FormField
              label="גיל הבת"
              type="number"
              inputMode="numeric"
              min={3}
              max={18}
              placeholder="לדוגמה: 9"
              value={filters.age}
              onChange={(e) => update({ age: e.target.value })}
              hint="יוצגו רק קבוצות שמתאימות לגיל"
            />

            <FormField
              as="select"
              label="יום בשבוע"
              value={filters.dayOfWeek}
              onChange={(e) => update({ dayOfWeek: e.target.value })}
            >
              <option value="">כל הימים</option>
              {DAYS_OF_WEEK.map((day) => <option key={day} value={day}>יום {dayName(day)}</option>)}
            </FormField>

            <FormField
              as="select"
              label="מיון לפי"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value === 'StartDate' ? '' : e.target.value })}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FormField>

            <Checkbox
              label="רק קבוצות עם מקום פנוי"
              checked={filters.onlyAvailable}
              onChange={(e) => update({ onlyAvailable: e.target.checked })}
            />
            {role === ROLES.Admin && (
              <Checkbox
                label="להציג גם חוגים שהסתיימו"
                checked={filters.includeEnded}
                onChange={(e) => update({ includeEnded: e.target.checked })}
              />
            )}

            {hasFilters && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams(new URLSearchParams())}>
                <Icon name="x" size={16} /> ניקוי הסינון
              </button>
            )}
          </form>
        </aside>

        <section className="courses-results" aria-labelledby="results-title">
          <h2 id="results-title" className="sr-only">תוצאות</h2>
          <p className="results-count" aria-live="polite">
            {data && !groups.loading && (data.totalCount === 0 ? 'לא נמצאו קבוצות' : `נמצאו ${data.totalCount} קבוצות`)}
          </p>

          <ApiErrorAlert error={groups.error} onRetry={groups.reload} />
          {groups.loading && !data && <Loading label="טוען חוגים…" />}

          {data && data.items.length === 0 && (
            <EmptyState icon="search" title="לא מצאנו קבוצות שמתאימות לחיפוש">
              נסי להרחיב את הסינון, למשל לבחור יום אחר או לבטל את הסינון לפי גיל.
            </EmptyState>
          )}

          {data && data.items.length > 0 && (
            <div className={`card-grid ${groups.loading ? 'is-refreshing' : ''}`} aria-busy={groups.loading}>
              {data.items.map((group) => <CourseCard key={group.id} group={group} />)}
            </div>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              onChange={(page) => update({ page: page === 1 ? '' : page }, true)}
            />
          )}
        </section>
      </div>
    </>
  );
}
