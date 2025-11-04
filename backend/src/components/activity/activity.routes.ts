import express from 'express';
import { ActivityController } from './activity.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const activityController = new ActivityController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER]), activityController.getAllActivities)
  .post(authorize([Role.ADMIN]), activityController.createActivity);

router.get('/recent', authorize([Role.ADMIN, Role.MANAGER]), activityController.getRecentActivities);

router.get(
  '/dashboard',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
  activityController.getDashboardActivities
);

router.get('/entity/:entityId', authorize([Role.ADMIN, Role.MANAGER]), activityController.getActivitiesByEntityId);

router.get(
  '/entity/:entityId/:entityType',
  authorize([Role.ADMIN, Role.MANAGER]),
  activityController.getActivitiesByEntityId
);

router.get('/user/:userId', authorize([Role.ADMIN, Role.MANAGER]), activityController.getActivitiesByUser);

router.route('/:id').get(authorize([Role.ADMIN, Role.MANAGER]), activityController.getActivityById);

export default router;
