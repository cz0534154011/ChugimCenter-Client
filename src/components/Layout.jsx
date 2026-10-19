import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, ROLES, SITE } from '../config';

/** מבנה כל דף: קישור דילוג, כותרת עם תפריט לפי תפקיד, תוכן ותחתית */
export default function Layout({ children }) {
  const location = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  // במעבר בין דפים: גלילה למעלה, והמיקוד עובר לתוכן – כך קורא מסך מתחיל מהדף החדש
  useEffect(() => {
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="app">
      <a href="#main" className="skip-link">דילוג לתוכן הראשי</a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const { isLoggedIn, user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const links = [
    { to: '/', label: 'דף הבית', icon: 'home', end: true },
    { to: '/courses', label: 'כל החוגים', icon: 'grid' }
  ];
  if (role === ROLES.Member) links.push({ to: '/my/enrollments', label: 'החוגים שלי', icon: 'list' });
  if (role === ROLES.Instructor) links.push({ to: '/my/groups', label: 'הקבוצות שלי', icon: 'roster' });
  if (role === ROLES.Admin) links.push({ to: '/admin', label: 'ניהול', icon: 'layers' });

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />

        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
          <span className="sr-only">{menuOpen ? 'סגירת התפריט' : 'פתיחת התפריט'}</span>
        </button>

        <div id="site-nav" className={`nav-area ${menuOpen ? 'is-open' : ''}`}>
          <nav aria-label="תפריט ראשי">
            <ul className="nav-links">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                    <Icon name={link.icon} size={18} />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="user-area">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="user-chip" aria-label={`הפרטים שלי: ${user.fullName}, ${ROLE_LABELS[role]}`}>
                  <span className="avatar" aria-hidden="true">{user.fullName?.trim()[0]}</span>
                  <span className="user-chip-text">
                    <span className="user-name">{user.fullName}</span>
                    <span className="user-role">{ROLE_LABELS[role]}</span>
                  </span>
                </Link>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
                  <Icon name="logout" size={18} /> יציאה
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm"><Icon name="login" size={18} /> התחברות</Link>
                <Link to="/register" className="btn btn-primary btn-sm">הרשמה</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-name">{SITE.fullName}</p>
          <p className="muted small">חוגי העשרה לבנות, באווירה נעימה ומכבדת.</p>
        </div>
        <ul className="footer-contact">
          <li><Icon name="pin" size={16} /> {SITE.address}</li>
          <li><Icon name="phone" size={16} /> <span dir="ltr">{SITE.phone}</span> (המזכירות)</li>
        </ul>
      </div>
    </footer>
  );
}
