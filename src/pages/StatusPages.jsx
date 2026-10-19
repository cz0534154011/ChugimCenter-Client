import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('הדף לא נמצא');
  return (
    <div className="status-page">
      <span className="status-code" aria-hidden="true">404</span>
      <h1>הדף לא נמצא</h1>
      <p className="muted">ייתכן שהקישור שגוי, או שהדף הוסר.</p>
      <Link to="/" className="btn btn-primary"><Icon name="home" size={18} /> לדף הבית</Link>
    </div>
  );
}

export function ForbiddenPage() {
  usePageTitle('אין הרשאה');
  return (
    <div className="status-page">
      <span className="status-code" aria-hidden="true"><Icon name="shield" size={64} strokeWidth={1.4} /></span>
      <h1>אין לך הרשאה לדף הזה</h1>
      <p className="muted">הדף מיועד לתפקיד אחר באתר. אם לדעתך זו טעות, פני למזכירות.</p>
      <Link to="/" className="btn btn-primary"><Icon name="home" size={18} /> לדף הבית</Link>
    </div>
  );
}
