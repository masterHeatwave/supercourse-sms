import express from 'express';
import { AssignmentStudentController } from './assignment-student.controller';

import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const assignmentStudentController = new AssignmentStudentController();

router.route('/').get(authorize([Role.STUDENT]), assignmentStudentController.getAllAssignments);

router.route('/:id').get(authorize([Role.STUDENT]), assignmentStudentController.getAssignmentByID);

// router
//   .route('/:id/task/:task-id')
//   .patch(authorize([Role.STUDENT]), assignmentStudentController.updateTask);

// router
//   .route('/:id/status/:status-id')
//   .patch(authorize([Role.STUDENT]), assignmentStudentController.updateAssignmentStatus);

export default router;
