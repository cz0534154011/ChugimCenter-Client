import { Link } from 'react-router-dom';
import { SITE } from '../config';

/** הלוגו: שמש עדינה מעל קו אופק – "אורות". בלי דמויות */
export function LogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className="logo-mark">
      <rect width="64" height="64" rx="18" fill="var(--color-primary)" />
      <circle cx="32" cy="36" r="9" fill="var(--color-gold)" />
      <g fill="var(--color-gold)">
        {[-90, -45, 0, 45, 90].map((angle) => (
          <rect key={angle} x="30.4" y="12" width="3.2" height="9" rx="1.6" transform={`rotate(${angle} 32 36)`} />
        ))}
      </g>
      <rect x="12" y="46" width="40" height="3.2" rx="1.6" fill="var(--color-cream)" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${SITE.fullName} – לעמוד הבית`}>
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name">{SITE.name}</span>
        <span className="logo-tagline">{SITE.tagline}</span>
      </span>
    </Link>
  );
}
