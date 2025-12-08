import express from 'express';
import { AcademicYearController } from './academic-years.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const academicYearController = new AcademicYearController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicYearController.getAllAcademicYears)
  .post(authorize([Role.ADMIN]), academicYearController.createAcademicYear);

// Current routes must be defined before :id route to avoid conflicts
router.get(
  '/current',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
  academicYearController.getCurrentAcademicYear
);

router.get(
  '/selected',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  academicYearController.getCurrentlySelectedAcademicYear
);

router.get(
  '/status/dual',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
  academicYearController.getAcademicYearStatus
);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), academicYearController.getAcademicYearById)
  .put(authorize([Role.ADMIN]), academicYearController.updateAcademicYear)
  .delete(authorize([Role.ADMIN]), academicYearController.deleteAcademicYear);

export default router;
