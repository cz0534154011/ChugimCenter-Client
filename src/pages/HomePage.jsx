import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import CourseCard from '../components/CourseCard';
import { ApiErrorAlert, Loading } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { usePageTitle } from '../hooks/usePageTitle';
import { categoriesApi, courseGroupsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { categoryTone } from '../utils/categoryTone';
import { SITE } from '../config';

export default function HomePage() {
  usePageTitle(null);
  const { isLoggedIn, user } = useAuth();
  const categories = useFetch(() => categoriesApi.list(), []);
  const groups = useFetch(() => courseGroupsApi.list({ pageSize: 3, onlyAvailable: true }), []);

  const activeCategories = (categories.data ?? []).filter((c) => c.isActive);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <p className="eyebrow">{SITE.tagline}</p>
          <h1 id="hero-title">
            {isLoggedIn ? <>שלום {user.fullName.split(' ')[0]},<br /></> : null}
            מקום להאיר בו כישרונות
          </h1>
          <p className="hero-lead">
            חוגי העשרה לבנות – ציור, דרמה, התעמלות, מוזיקה ועוד. מדריכות מקצועיות, קבוצות קטנות
            ואווירה חמה ומכבדת. בוחרים חוג, נרשמים באתר, ומתחילים.
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary btn-lg">
              לכל החוגים <Icon name="arrowLeft" size={18} />
            </Link>
            {!isLoggedIn && <Link to="/register" className="btn btn-secondary btn-lg">הרשמה לאתר</Link>}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HeroArt />
        </div>
      </section>

      <section className="section" aria-labelledby="cats-title">
        <div className="section-head">
          <h2 id="cats-title">תחומי הפעילות</h2>
        </div>
        {categories.loading && <Loading />}
        <ApiErrorAlert error={categories.error} onRetry={categories.reload} />
        <ul className="category-grid">
          {activeCategories.map((category) => (
            <li key={category.id}>
              <Link to={`/courses?categoryId=${category.id}`} className={`category-tile tone-${categoryTone(category.id)}`}>
                <span className="category-tile-dot" aria-hidden="true" />
                <span className="category-tile-name">{category.name}</span>
                <Icon name="arrowLeft" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="open-title">
        <div className="section-head">
          <h2 id="open-title">קבוצות שנפתחות בקרוב</h2>
          <Link to="/courses?onlyAvailable=true" className="link-more">לכל הקבוצות עם מקום פנוי <Icon name="arrowLeft" size={16} /></Link>
        </div>
        {groups.loading && <Loading />}
        <ApiErrorAlert error={groups.error} onRetry={groups.reload} />
        {groups.data && (
          <div className="card-grid">
            {groups.data.items.map((group) => <CourseCard key={group.id} group={group} />)}
          </div>
        )}
      </section>

      <section className="section steps" aria-labelledby="steps-title">
        <h2 id="steps-title">איך נרשמים?</h2>
        <ol className="steps-list">
          <li>
            <span className="step-num" aria-hidden="true">1</span>
            <h3>יוצרים חשבון</h3>
            <p>הרשמה קצרה עם פרטי הבת ופרטי ההורה.</p>
          </li>
          <li>
            <span className="step-num" aria-hidden="true">2</span>
            <h3>בוחרים חוג</h3>
            <p>מסננים לפי תחום, גיל ויום בשבוע, ורואים כמה מקומות נשארו.</p>
          </li>
          <li>
            <span className="step-num" aria-hidden="true">3</span>
            <h3>נרשמים</h3>
            <p>לחיצה אחת, והמקום שמור. התשלום מתבצע במזכירות.</p>
          </li>
        </ol>
      </section>
    </>
  );
}

/** איור רקע: שמש זורחת מעל גבעות, עם קרני אור וכוכבים – בלי דמויות */
function HeroArt() {
  const rays = [-72, -48, -24, 0, 24, 48, 72];
  return (
    <svg viewBox="0 0 420 340" className="hero-svg" focusable="false">
      <defs>
        <radialGradient id="glow" cx="50%" cy="72%" r="60%">
          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hero-clip"><rect width="420" height="340" rx="28" /></clipPath>
      </defs>
      <ellipse cx="210" cy="240" rx="200" ry="150" fill="url(#glow)" />
      <g stroke="var(--color-gold)" strokeWidth="7" strokeLinecap="round" opacity="0.85">
        {rays.map((angle) => (
          <line key={angle} x1="210" y1="160" x2="210" y2="110" transform={`rotate(${angle} 210 240)`} />
        ))}
      </g>
      <circle cx="210" cy="240" r="62" fill="var(--color-gold)" />
      <g clipPath="url(#hero-clip)">
        <path d="M0 262 C70 222 140 222 210 252 C280 282 350 230 420 246 L420 340 L0 340 Z" fill="var(--tone-sage)" opacity="0.9" />
        <path d="M0 292 C90 262 170 276 240 290 C310 304 370 280 420 276 L420 340 L0 340 Z" fill="var(--tone-sky)" opacity="0.95" />
        <path d="M0 318 C120 300 260 312 420 304 L420 340 L0 340 Z" fill="var(--color-primary)" opacity="0.9" />
      </g>
      <g fill="var(--color-gold)">
        <path d="M70 70l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" />
        <path d="M350 60l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" opacity="0.8" />
        <path d="M330 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity="0.7" />
        <path d="M95 160l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity="0.6" />
      </g>
    </svg>
  );
}
