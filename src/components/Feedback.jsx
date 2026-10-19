import Icon from './Icon';

const ALERT_ICONS = { error: 'alert', warning: 'alert', success: 'check', info: 'info' };

/**
 * הודעה בתוך הדף. שגיאה מוכרזת מיד לקורא מסך (role="alert"), ושאר ההודעות בנימוס (status).
 */
export function Alert({ type = 'info', title, children, actions, className = '' }) {
  const isUrgent = type === 'error' || type === 'warning';
  return (
    <div className={`alert alert-${type} ${className}`} role={isUrgent ? 'alert' : 'status'}>
      <Icon name={ALERT_ICONS[type]} className="alert-icon" />
      <div className="alert-body">
        {title && <p className="alert-title">{title}</p>}
        {children && <div className="alert-text">{children}</div>}
        {actions && <div className="alert-actions">{actions}</div>}
      </div>
    </div>
  );
}

/** שגיאה מהשרת, במבנה האחיד. ב-500 מוצג גם מזהה לבירור (CorrelationId) */
export function ApiErrorAlert({ error, title, onRetry, className }) {
  if (!error) return null;
  const isConflict = error.status === 409;
  return (
    <Alert
      type={isConflict ? 'warning' : 'error'}
      title={title ?? (isConflict ? 'לא ניתן להשלים את הפעולה' : 'משהו השתבש')}
      className={className}
      actions={onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={16} /> נסי שוב
        </button>
      )}
    >
      <p>{error.message}</p>
      {error.status >= 500 && error.correlationId && (
        <p className="muted small">מזהה לבירור: <span dir="ltr" className="mono">{error.correlationId}</span></p>
      )}
    </Alert>
  );
}

export function Loading({ label = 'טוען…' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon = 'sparkle', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <p className="empty-title">{title}</p>
      {children && <div className="muted">{children}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** פס תפוסה: כמה מקומות תפוסים מתוך הכל. הטקסט מוקרא, והפס עצמו הוא קישוט */
export function Occupancy({ enrolled, capacity, compact = false }) {
  const percent = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
  const free = Math.max(0, capacity - enrolled);
  const tone = free === 0 ? 'full' : free <= 2 ? 'low' : 'ok';
  return (
    <div className={`occupancy occupancy-${tone} ${compact ? 'occupancy-compact' : ''}`}>
      <div className="occupancy-label">
        <span>{enrolled} מתוך {capacity} תפוסים</span>
        <strong>{free === 0 ? 'אין מקומות' : free === 1 ? 'מקום אחרון!' : `${free} מקומות פנויים`}</strong>
      </div>
      <div className="occupancy-track" aria-hidden="true">
        <div className="occupancy-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
