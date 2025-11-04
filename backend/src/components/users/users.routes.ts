import express from 'express';
import { authorize } from '@middleware/authorize';
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

userRouter.route('/students').get(authorize('STUDENT_QUERY_ALL'), usersController.getAllStudents);
userRouter.route('/students').post(authorize('STUDENT_CREATE'), usersController.createStudent);

userRouter.route('/students/:id').get(authorize('STUDENT_QUERY_SINGLE'), usersController.getStudentById);
userRouter.route('/students/:id').put(authorize('STUDENT_UPDATE'), usersController.updateStudent);
userRouter.route('/students/:id').delete(authorize('STUDENT_DELETE'), usersController.deleteStudent);

// Parents: list children (students linked via contacts.email)
userRouter.route('/children').get(authorize(['ADMIN', 'MANAGER', 'PARENT']), usersController.getChildren);

export default userRouter;
