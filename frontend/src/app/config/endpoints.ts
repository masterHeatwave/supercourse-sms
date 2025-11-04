export const API_BASE_URL =
  process.env['NODE_ENV'] === 'production' ? 'https://api-sms.supercourse.dd.softwebpages.com/v1' : 'http://localhost:3193/v1';
export const SOCKET_BASE_URL =
  process.env['NODE_ENV'] === 'production' ? 'https://api-sms.supercourse.dd.softwebpages.com/v1' : 'http://localhost:3193/v1';
export const API_ASSET_URL =
  process.env['NODE_ENV'] === 'production' ? 'https://api-sms.supercourse.dd.softwebpages.com/public' : 'http://localhost:3193/public';
export const API_SCHEMA_URL =
  process.env['NODE_ENV'] === 'production' ? 'https://api-sms.supercourse.dd.softwebpages.com/schema' : 'http://localhost:3193/schema';
export const SOCKET_URL =
  process.env['NODE_ENV'] === 'production' ? 'https://api-sms.supercourse.dd.softwebpages.com' : 'http://localhost:3193';

export const ENDPOINTS = {
  // Auth endpoints
  AUTHENTICATE: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  // Authenticate As
  AUTH_AS_LIST: `${API_BASE_URL}/auth/authenticate-as/list`,
  AUTH_AS: (distributorId: string) => `${API_BASE_URL}/auth/authenticate-as/${distributorId}`,

  // Users endpoints
  USERS: `${API_BASE_URL}/users`,
  USER: (id: string) => `${API_BASE_URL}/users/${id}`,
  USER_ARCHIVE_ACTION: `${API_BASE_URL}/users/archive`,
  USER_MAKE_PRIMARY_CONTACT: `${API_BASE_URL}/users/make-primary-contact`,
  USER_RESEND_PASSWORD_EMAIL: (id: string) => `${API_BASE_URL}/users/resend-password-email/${id}`,

  // Staff endpoints (prefixed with USER_STAFF_)
  USER_STAFF_ALL: `${API_BASE_URL}/users/staff`,
  USER_STAFF_SEARCH: `${API_BASE_URL}/users/staff/search`,
  USER_STAFF_SINGLE: (id: string) => `${API_BASE_URL}/users/staff/${id}`,

  // Student endpoints (prefixed with USER_STUDENT_)
  USER_STUDENT_ALL: `${API_BASE_URL}/users/students`,
  USER_STUDENT_SINGLE: (id: string) => `${API_BASE_URL}/users/students/${id}`,

  // Academic years
  ACADEMIC_YEARS: `${API_BASE_URL}/academic-years`,
  ACADEMIC_YEAR: (id: string) => `${API_BASE_URL}/academic-years/${id}`,
  CURRENT_ACADEMIC_YEAR: `${API_BASE_URL}/academic-years/current`,

  // Academic periods
  ACADEMIC_PERIODS: `${API_BASE_URL}/academic-periods`,
  ACADEMIC_PERIOD: (id: string) => `${API_BASE_URL}/academic-periods/${id}`,
  CURRENT_ACADEMIC_PERIOD: `${API_BASE_URL}/academic-periods/current`,

  // Academic subperiods
  ACADEMIC_SUBPERIODS: `${API_BASE_URL}/academic-subperiods`,
  ACADEMIC_SUBPERIOD: (id: string) => `${API_BASE_URL}/academic-subperiods/${id}`,
  CURRENT_ACADEMIC_SUBPERIOD: `${API_BASE_URL}/academic-subperiods/current`,

  // Taxis
  TAXIS: `${API_BASE_URL}/taxis`,
  TAXI: (id: string) => `${API_BASE_URL}/taxis/${id}`,
  TAXI_ADD_USER: `${API_BASE_URL}/taxis/add-user`,
  TAXI_REMOVE_USER: `${API_BASE_URL}/taxis/remove-user`,

  // Classrooms
  CLASSROOMS: `${API_BASE_URL}/classrooms`,
  CLASSROOM: (id: string) => `${API_BASE_URL}/classrooms/${id}`,

  // Sessions
  SESSIONS: `${API_BASE_URL}/sessions`,
  SESSION: (id: string) => `${API_BASE_URL}/sessions/${id}`,
  SESSION_ADD_STUDENT: `${API_BASE_URL}/sessions/add-student`,
  SESSION_REMOVE_STUDENT: `${API_BASE_URL}/sessions/remove-student`,
  SESSION_ADD_TEACHER: `${API_BASE_URL}/sessions/add-teacher`,
  SESSION_REMOVE_TEACHER: `${API_BASE_URL}/sessions/remove-teacher`,

  // Inventory
  INVENTORY: `${API_BASE_URL}/inventory`,
  INVENTORY_ITEM: (id: string) => `${API_BASE_URL}/inventory/${id}`,
  INVENTORY_MARK_RETURNED: (id: string) => `${API_BASE_URL}/inventory/${id}/mark-returned`,

  // Posts
  POSTS: `${API_BASE_URL}/posts`,
  POST: (id: string) => `${API_BASE_URL}/posts/${id}`,
  POST_ADD_TAG: `${API_BASE_URL}/posts/add-tag`,
  POST_REMOVE_TAG: `${API_BASE_URL}/posts/remove-tag`,
  POST_PUBLISH: (id: string) => `${API_BASE_URL}/posts/${id}/publish`,
  POST_ARCHIVE: (id: string) => `${API_BASE_URL}/posts/${id}/archive`,

  // Roles
  ROLES: `${API_BASE_URL}/roles`,
  ROLE: (id: string) => `${API_BASE_URL}/roles/${id}`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,

  // Dashboard data
  DASHBOARD_DATA: `${API_BASE_URL}/dashboard`,

  // Media upload
  MEDIA_UPLOAD: `${API_BASE_URL}/media/upload`,

  // Customers
  CUSTOMERS: `${API_BASE_URL}/customers`,
  CUSTOMER: (id: string) => `${API_BASE_URL}/customers/${id}`,
  CUSTOMERS_CREATE: `${API_BASE_URL}/customers`,
  CUSTOMERS_UPDATE: (id: string) => `${API_BASE_URL}/customers/${id}`,
  CUSTOMERS_ARCHIVE: (id: string) => `${API_BASE_URL}/customers/${id}/archive`,
  CUSTOMERS_QUERY_ALL: `${API_BASE_URL}/customers`,
  CUSTOMERS_QUERY_SINGLE: (id: string) => `${API_BASE_URL}/customers/${id}`,

  // Products
  PRODUCTS: `${API_BASE_URL}/products`,
  PRODUCT: (id: string) => `${API_BASE_URL}/products/${id}`,
  PRODUCTS_CREATE: `${API_BASE_URL}/products`,
  PRODUCTS_UPDATE: (id: string) => `${API_BASE_URL}/products/${id}`,
  PRODUCTS_ARCHIVE: (id: string) => `${API_BASE_URL}/products/${id}/archive`,
  PRODUCTS_QUERY_ALL: `${API_BASE_URL}/products`,
  PRODUCTS_QUERY_SINGLE: (id: string) => `${API_BASE_URL}/products/${id}`,

  // Notes
  USERS_NOTES: `${API_BASE_URL}/users/notes`,
  USERS_CREATE_NOTE: `${API_BASE_URL}/users/notes`,
  USERS_UPDATE_NOTE: (id: string) => `${API_BASE_URL}/users/notes/${id}`,
  USERS_DELETE_NOTE: (id: string) => `${API_BASE_URL}/users/notes/${id}`,

  // Dashboard data
  DASHBOARD_DATA_QUERY_ALL: `${API_BASE_URL}/dashboard/data`,
  NOTIFICATIONS_QUERY_ALL: `${API_BASE_URL}/notifications`
};
