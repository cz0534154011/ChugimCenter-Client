import { NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';

const ITEMS = [
  { to: '/admin', label: 'סקירה', icon: 'home', end: true },
  { to: '/admin/groups', label: 'קבוצות', icon: 'grid' },
  { to: '/admin/enrollments', label: 'רישומים ותשלומים', icon: 'coin' },
  { to: '/admin/categories', label: 'תחומים', icon: 'tag' },
  { to: '/admin/users', label: 'משתמשות ומדריכות', icon: 'badge' }
];

/** תפריט משני לדפי הניהול */
export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="תפריט ניהול">
      <ul>
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon name={item.icon} size={18} /> {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
