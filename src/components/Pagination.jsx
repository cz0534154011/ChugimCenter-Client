import Icon from './Icon';

/**
 * מעבר בין עמודים. הנתונים מגיעים מהשרת עמוד אחר עמוד (Skip ו-Take בשאילתה),
 * ולכן כל לחיצה כאן שולחת בקשה חדשה עם Page אחר.
 */
export default function Pagination({ page, totalPages, totalCount, onChange, label = 'מעבר בין עמודים' }) {
  if (!totalPages || totalPages <= 1) {
    return totalCount ? <p className="pagination-summary muted">סך הכל {totalCount}</p> : null;
  }

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="לעמוד הקודם"
      >
        <Icon name="chevronRight" size={18} />
      </button>
      <ul>
        {pages.map((p, index) =>
          p === '…' ? (
            <li key={`gap-${index}`} className="page-gap" aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`page-btn ${p === page ? 'is-current' : ''}`}
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`עמוד ${p}`}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="לעמוד הבא"
      >
        <Icon name="chevronLeft" size={18} />
      </button>
      <span className="pagination-summary muted">עמוד {page} מתוך {totalPages} · {totalCount} בסך הכל</span>
    </nav>
  );
}

function pageWindow(current, total) {
  const set = new Set([1, total, current, current - 1, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}
