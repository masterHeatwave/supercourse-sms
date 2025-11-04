import express from 'express';
import { CustomActivityController } from './customActivity.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
import fileUpload from 'express-fileupload';
import path from 'path';
const router = express.Router();
const customActivityController = new CustomActivityController();

const fileUploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'temp'),
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), customActivityController.getActivities)
  .post(authorize([Role.TEACHER, Role.STUDENT, Role.ADMIN, Role.MANAGER]), customActivityController.saveActivity);

router
  .route('/saveImage')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), fileUploadMiddleware, customActivityController.saveImage);

router
  .route('/deleteImage')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.deleteImage);

router
  .route('/uploadFromURL')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.uploadFromURL);

router
  .route('/generateFromAI')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.generateFromAI);

router
  .route('/findOnPexels')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.findOnPexels);

router
  .route('/:activityId')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), customActivityController.getActivityById)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), customActivityController.updateActivity)
  .delete(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.deleteActivityById
  );

router
  .route('/user/:userId/')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.getCustomActivitiesByUserID
  );

router
  .route('/public-activities/:userId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.getPublicActivitiesExcludingUserId
  );

router
  .route('/duplicate/:activityId')
  .post(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.duplicateActivityById
  );

router
  .route('/duplicate-public/:activityId/user/:userId')
  .post(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.duplicatePublicActivityById
  );

router
  .route('/student-activities/user/:userId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.getStudentActivities
  );

//videos

export default router;
