import express from 'express';
import { DashboardController } from './dashboard.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const dashboardController = new DashboardController();

router.get('/:customer_id', authorize([Role.ADMIN, Role.MANAGER]), dashboardController.getDashboardData);

export default router;
