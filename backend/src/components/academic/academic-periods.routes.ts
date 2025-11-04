import express from 'express';
import { AcademicPeriodController } from './academic-periods.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const academicPeriodController = new AcademicPeriodController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicPeriodController.getAllAcademicPeriods)
  .post(authorize([Role.ADMIN, Role.MANAGER]), academicPeriodController.createAcademicPeriod);

// Current route must be defined before :id route to avoid conflicts
router.get(
  '/current',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  academicPeriodController.getCurrentAcademicPeriod
);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicPeriodController.getAcademicPeriodById)
  .put(authorize([Role.ADMIN, Role.MANAGER]), academicPeriodController.updateAcademicPeriod)
  .delete(authorize([Role.ADMIN]), academicPeriodController.deleteAcademicPeriod);

export default router;
