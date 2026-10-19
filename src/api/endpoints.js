import api, { cleanParams } from './client';

// כל הפניות לשרת במקום אחד. כל פונקציה מחזירה את הנתונים עצמם (response.data).
// בכתובת – רק מזהים, סינון ועמודים. סיסמאות ופרטים אישיים – רק בגוף הבקשה.

const data = (promise) => promise.then((response) => response.data);

export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  register: (body) => data(api.post('/auth/register', body))
};

export const usersApi = {
  me: () => data(api.get('/users/me')),
  myEnrollments: (query) => data(api.get('/users/me/enrollments', { params: cleanParams(query) })),
  myCourseGroups: () => data(api.get('/users/me/course-groups')),
  list: (query) => data(api.get('/users', { params: cleanParams(query) })),
  get: (id) => data(api.get(`/users/${id}`)),
  createInstructor: (body) => data(api.post('/instructors', body))
};

export const categoriesApi = {
  list: () => data(api.get('/categories')),
  create: (body) => data(api.post('/categories', body)),
  update: (id, body) => data(api.put(`/categories/${id}`, body)),
  setActive: (id, isActive) => data(api.patch(`/categories/${id}`, { isActive })),
  remove: (id) => data(api.delete(`/categories/${id}`))
};

export const courseGroupsApi = {
  list: (query) => data(api.get('/course-groups', { params: cleanParams(query) })),
  get: (id) => data(api.get(`/course-groups/${id}`)),
  create: (body) => data(api.post('/course-groups', body)),
  update: (id, body) => data(api.put(`/course-groups/${id}`, body)),
  setActive: (id, isActive) => data(api.patch(`/course-groups/${id}`, { isActive })),
  remove: (id) => data(api.delete(`/course-groups/${id}`)),
  students: (id) => data(api.get(`/course-groups/${id}/students`))
};

export const enrollmentsApi = {
  enroll: (courseGroupId) => data(api.post('/enrollments', { courseGroupId })),
  cancel: (id) => data(api.delete(`/enrollments/${id}`)),
  list: (query) => data(api.get('/enrollments', { params: cleanParams(query) })),
  setPayment: (id, isPaid) => data(api.put(`/enrollments/${id}/payment`, { isPaid }))
};
