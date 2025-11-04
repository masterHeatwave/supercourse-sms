import express from 'express';
import { AssignmentStaffController } from './assignment-staff.controller';

import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const assignmentStaffController = new AssignmentStaffController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.getAllAssignments)
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.createAssignment);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.getAssignmentByID)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.updateAssignment);

router
  .route('/draft/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.draftAssignment);

router
  .route('/undraft/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.undraftAssignment);

router
  .route('/delete-for-me/:id')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStaffController.deleteAssignmentTemporarilyForMe
  )
  .delete(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStaffController.deleteAssignmentPermanentlyForMe
  );

router
  .route('/restore-for-me/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.restoreAssignmentForMe);

router
  .route('/delete-for-everyone/:id')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStaffController.deleteAssignmentTemporarilyForEveryone
  )
  .delete(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    assignmentStaffController.deleteAssignmentPermanentlyForEveryone
  );

router
  .route('/restore-for-everyone/:id')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), assignmentStaffController.restoreAssignmentForEveryone);

export default router;
