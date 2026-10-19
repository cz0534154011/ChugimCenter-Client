import { Link } from 'react-router-dom';
import Icon from './Icon';
import { Badge, Occupancy } from './Feedback';
import { dayName, endTime, formatDate, formatPrice, formatTime } from '../utils/format';
import { categoryTone } from '../utils/categoryTone';

/** כרטיס של קבוצת חוג ברשימה. כל הכרטיס הוא קישור אחד לדף הקבוצה */
export default function CourseCard({ group, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  const full = group.availableSpots === 0;

  return (
    <article className={`course-card tone-${categoryTone(group.categoryId)}`}>
      <div className="course-card-top">
        <span className="category-chip">{group.categoryName}</span>
        <div className="card-badges">
          {!group.isActive && <Badge tone="muted">מושבתת</Badge>}
          {full && <Badge tone="danger">מלא</Badge>}
        </div>
      </div>

      <Heading className="course-card-title">
        <Link to={`/courses/${group.id}`} className="stretched-link">{group.name}</Link>
      </Heading>

      <ul className="course-meta">
        <li><Icon name="calendar" size={16} /> יום {dayName(group.dayOfWeek)}, מ-{formatDate(group.startDate)}</li>
        <li><Icon name="clock" size={16} /> {formatTime(group.startTime)}–{endTime(group.startTime, group.durationMinutes)}</li>
        <li><Icon name="steps" size={16} /> גילאי {group.minAge}–{group.maxAge}</li>
        <li><Icon name="badge" size={16} /> המדריכה {group.instructorName}</li>
      </ul>

      <Occupancy enrolled={group.enrolledCount} capacity={group.capacity} compact />

      <div className="course-card-footer">
        <span className="price">{formatPrice(group.price)}<span className="price-unit"> לחודש</span></span>
        <span className="card-cta" aria-hidden="true">לפרטים <Icon name="arrowLeft" size={16} /></span>
      </div>
    </article>
  );
}
