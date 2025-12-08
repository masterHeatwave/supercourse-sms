import express from 'express';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
import usersController from '@components/users/users.controller';

export const userRouter = express.Router();

userRouter.route('/').get(authorize('USER_QUERY_ALL'), usersController.queryAll);
userRouter.route('/').post(authorize('USER_CREATE'), usersController.create);

userRouter.route('/single/:id').get(authorize('USER_QUERY_SINGLE'), usersController.querySingle);
userRouter.route('/single/:id').put(authorize('USER_UPDATE'), usersController.update);

userRouter.route('/archive').patch(authorize('USER_ARCHIVE'), usersController.archive);

userRouter
  .route('/make-primary-contact')
  .post(authorize('USER_MAKE_PRIMARY_CONTACT'), usersController.makePrimaryContact);

userRouter.route('/resend-password-email/:id').post(authorize('USER_UPDATE'), usersController.resendPasswordEmail);

userRouter.route('/staff').post(authorize('STAFF_CREATE'), usersController.createStaff);
userRouter.route('/staff').get(authorize('STAFF_QUERY_ALL'), usersController.getAllStaff);

userRouter.route('/staff/search').get(authorize('STAFF_QUERY_ALL'), usersController.searchStaff);

userRouter.route('/staff/:id').get(authorize('STAFF_QUERY_SINGLE'), usersController.getStaffById);
userRouter.route('/staff/:id').put(authorize('STAFF_UPDATE'), usersController.updateStaff);
userRouter.route('/staff/:id').delete(authorize('STAFF_DELETE'), usersController.deleteStaff);

userRouter
  .route('/students')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.PARENT_GUARDIAN]), usersController.getAllStudents);
userRouter.route('/students').post(authorize([Role.ADMIN, Role.MANAGER]), usersController.createStudent);

userRouter.route('/teachers/me/students').get(authorize([Role.TEACHER]), usersController.getMyStudents);

userRouter
  .route('/teachers/:teacherId/students')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), usersController.getTeacherStudents);

userRouter
  .route('/students/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.PARENT_GUARDIAN]), usersController.getStudentById);
userRouter.route('/students/:id').put(authorize([Role.ADMIN, Role.MANAGER]), usersController.updateStudent);
userRouter.route('/students/:id').delete(authorize([Role.ADMIN, Role.MANAGER]), usersController.deleteStudent);

// Parents: list children (students linked via contacts.email)
userRouter
  .route('/children')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.PARENT_GUARDIAN]), usersController.getChildren);

export default userRouter;
