import express from 'express';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
import absenceController from './absence.controller';

const router = express.Router();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.getAbsences)
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.createAbsence);

router.route('/report').get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.getAbsenceReport);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.getAbsence)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.updateAbsence)
  .delete(authorize([Role.ADMIN, Role.MANAGER]), absenceController.deleteAbsence);

router.route('/:id/notify').post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), absenceController.notifyParent);

export default router;
