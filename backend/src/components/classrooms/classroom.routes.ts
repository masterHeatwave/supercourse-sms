import express from 'express';
import { ClassroomController } from './classroom.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const classroomController = new ClassroomController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), classroomController.getAllClassrooms)
  .post(authorize([Role.ADMIN, Role.MANAGER]), classroomController.createClassroom);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), classroomController.getClassroomById)
  .put(authorize([Role.ADMIN, Role.MANAGER]), classroomController.updateClassroom)
  .delete(authorize([Role.ADMIN]), classroomController.deleteClassroom);

export default router;
