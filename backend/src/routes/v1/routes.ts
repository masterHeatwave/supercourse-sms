import express from 'express';
import { authRouter } from '@components/auth/auth.routes';
import { userRouter } from '@components/users/users.routes';
import { errorRouter } from '@components/error/error.routes';
import { roleRouter } from '@components/roles/role.routes';
import { notificationRouter } from '@components/notifications/notifications.routes';
import customerRouter from '@components/customers/customer.routes';
import academicYearRouter from '@components/academic/academic-years.routes';
import academicPeriodRouter from '@components/academic/academic-periods.routes';
import academicSubperiodRouter from '@components/academic/academic-subperiods.routes';
import academicOverviewRouter from '@components/academic/overview.routes';
import taxiRouter from '@components/taxi/taxi.routes';
import classroomRouter from '@components/classrooms/classroom.routes';
import sessionRouter from '@components/sessions/session.routes';
import inventoryRouter from '@components/inventory/inventory.routes';
import postRouter from '@components/posts/post.routes';
import internalRouter from '@components/users/internal.routes';
import dashboardRouter from '@components/dashboard/dashboard.routes';
import { mediaRouter } from '@components/media/media.routes';
import absenceRouter from '@components/absences/absence.routes';
import activityRouter from '@components/activity/activity.routes';
import materialsRouter from '@components/materials/materials.routes';
import messagingRouter from '@components/messaging/messaging.routes';
import assignmentStaffRouter from '@components/assignments/assignment-staff.routes';
import assignmentStudentRouter from '@components/assignments/assignment-student.routes';
import moodRouter from '@components/wellness-center/mood.routes';
import ebooksBookmarkRouter from '@components/bookmarks/bookmark.routes';
import customActivitiesRouter from '@components/custom-activities/customActivity.routes';

export const mainRouter = express.Router();

// Public API endpoints
mainRouter.use('/auth', authRouter);
mainRouter.use('/users', userRouter);
mainRouter.use('/errors', errorRouter);
mainRouter.use('/roles', roleRouter);
mainRouter.use('/notifications', notificationRouter);
mainRouter.use('/customers', customerRouter);

// Academic endpoints
mainRouter.use('/academic-years', academicYearRouter);
mainRouter.use('/academic-periods', academicPeriodRouter);
mainRouter.use('/academic-subperiods', academicSubperiodRouter);
mainRouter.use('/academic-overview', academicOverviewRouter);

// School operations endpoints
mainRouter.use('/taxis', taxiRouter);
mainRouter.use('/classrooms', classroomRouter);
mainRouter.use('/sessions', sessionRouter);
mainRouter.use('/absences', absenceRouter);

// Inventory and content management
mainRouter.use('/inventory', inventoryRouter);
// Temporary alias for legacy Assets endpoints – route to Inventory
mainRouter.use('/assets', inventoryRouter);
mainRouter.use('/posts', postRouter);
mainRouter.use('/materials', materialsRouter);

mainRouter.use('/dashboard', dashboardRouter);

// Internal API endpoints (protected by API key)
mainRouter.use('/internal', internalRouter);

// Media upload endpoint
mainRouter.use('/media', mediaRouter);

// Activity tracking endpoint
mainRouter.use('/activity', activityRouter);

// Messaging endpoints
mainRouter.use('/messaging', messagingRouter);

// Assignment endpoints for staff members
mainRouter.use('/assignments/staff', assignmentStaffRouter);

// Assignment endpoints for students
mainRouter.use('/assignments/student', assignmentStudentRouter);

// Wellness and mood management endpoints
mainRouter.use('/moods', moodRouter);

// Ebook endpoints
mainRouter.use('/bookmarks', ebooksBookmarkRouter);

//custom activities endpoints
mainRouter.use('/custom-activities', customActivitiesRouter);
