import express from 'express';
import { AcademicOverviewController } from './overview.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const overviewController = new AcademicOverviewController();

router.get('/', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), overviewController.getOverview);
router.get(
  '/staff/:userId',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
  overviewController.getOverviewForUser
);

export default router;
