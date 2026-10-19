import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * הגנה על כתובת: מי שלא מחוברת עוברת להתחברות (ואחר כך חוזרת לכאן),
 * ומי שמחוברת בלי התפקיד המתאים עוברת לדף "אין הרשאה".
 * זו נוחות בלבד – השרת בודק כל הרשאה בעצמו ומחזיר 401 או 403.
 */
export default function RequireRole({ roles, children }) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }
  return children;
}
