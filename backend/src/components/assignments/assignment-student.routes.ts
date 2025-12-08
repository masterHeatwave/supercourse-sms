import express from 'express';
import { AssignmentStudentController } from './assignment-student.controller';

import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const assignmentStudentController = new AssignmentStudentController();

router
  .route('/')
  .get(authorize([Role.STUDENT]), assignmentStudentController.getAllAssignments)
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.createAssignment);

router
  .route('/:id')
  .get(authorize([Role.STUDENT]), assignmentStudentController.getAssignmentByID)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.updateAssignment);

router
  .route('/draft/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.draftAssignment);

router
  .route('/undraft/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.undraftAssignment);

router
  .route('delete-for-me/:id')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStudentController.deleteAssignmentTemporarilyForMe
  )
  .delete(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStudentController.deleteAssignmentPermanentlyForMe
  );

router
  .route('/restore-for-me/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.restoreAssignmentForMe);

router
  .route('/delete-for-everyone/:id')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStudentController.deleteAssignmentTemporarilyForEveryone
  )
  .delete(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStudentController.deleteAssignmentPermanentlyForEveryone
  );

router
  .route('/restore-for-everyone/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStudentController.restoreAssignmentForEveryone);

//* eBook
router
  .route('/ebook/:assignmentId/:activityId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    assignmentStudentController.getEbookAssignment
  )
  .patch(authorize([Role.STUDENT]), assignmentStudentController.updateEbookAssignment);
//* eBook

export default router;
