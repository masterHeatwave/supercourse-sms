import express from 'express';
import { AcademicSubperiodController } from './academic-subperiods.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const academicSubperiodController = new AcademicSubperiodController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicSubperiodController.getAllAcademicSubperiods)
  .post(authorize([Role.ADMIN, Role.MANAGER]), academicSubperiodController.createAcademicSubperiod);

// Current route must be defined before :id route to avoid conflicts
router.get(
  '/current',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  academicSubperiodController.getCurrentAcademicSubperiod
);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicSubperiodController.getAcademicSubperiodById)
  .put(authorize([Role.ADMIN, Role.MANAGER]), academicSubperiodController.updateAcademicSubperiod)
  .delete(authorize([Role.ADMIN]), academicSubperiodController.deleteAcademicSubperiod);

export default router;
