import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireRole from './auth/RequireRole';
import { ROLES } from './config';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import { ForbiddenPage, NotFoundPage } from './pages/StatusPages';
import MyEnrollmentsPage from './pages/member/MyEnrollmentsPage';
import MyGroupsPage from './pages/instructor/MyGroupsPage';
import StudentsPage from './pages/instructor/StudentsPage';
import DashboardPage from './pages/admin/DashboardPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import GroupsPage from './pages/admin/GroupsPage';
import GroupFormPage from './pages/admin/GroupFormPage';
import UsersPage from './pages/admin/UsersPage';
import EnrollmentsPage from './pages/admin/EnrollmentsPage';

const { Admin, Instructor, Member } = ROLES;

/** כל הכתובות באתר. כתובות מוגנות עטופות ב-RequireRole עם התפקידים המורשים */
export default function App() {
  return (
    <Layout>
      <Routes>
        {/* ציבורי */}
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* כל משתמשת מחוברת */}
        <Route path="/profile" element={<RequireRole><ProfilePage /></RequireRole>} />

        {/* משתתפת */}
        <Route path="/my/enrollments" element={<RequireRole roles={[Member]}><MyEnrollmentsPage /></RequireRole>} />

        {/* מדריכה ומנהלת */}
        <Route path="/my/groups" element={<RequireRole roles={[Instructor]}><MyGroupsPage /></RequireRole>} />
        <Route path="/courses/:id/students" element={<RequireRole roles={[Instructor, Admin]}><StudentsPage /></RequireRole>} />

        {/* מנהלת */}
        <Route path="/admin" element={<RequireRole roles={[Admin]}><DashboardPage /></RequireRole>} />
        <Route path="/admin/categories" element={<RequireRole roles={[Admin]}><CategoriesPage /></RequireRole>} />
        <Route path="/admin/groups" element={<RequireRole roles={[Admin]}><GroupsPage /></RequireRole>} />
        <Route path="/admin/groups/new" element={<RequireRole roles={[Admin]}><GroupFormPage /></RequireRole>} />
        <Route path="/admin/groups/:id/edit" element={<RequireRole roles={[Admin]}><GroupFormPage /></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole roles={[Admin]}><UsersPage /></RequireRole>} />
        <Route path="/admin/enrollments" element={<RequireRole roles={[Admin]}><EnrollmentsPage /></RequireRole>} />

        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
