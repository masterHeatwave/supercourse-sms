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
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.getActivities)
  .post(authorize([Role.TEACHER, Role.ADMIN, Role.MANAGER]), customActivityController.saveActivity);

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
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.getActivityById)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.updateActivity)
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.updateActivityPlays)
  .delete(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.deleteActivityById);

router
  .route('/user/:userId/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.getCustomActivitiesByUserID);

router
  .route('/user/:userId/tag/:tag')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    customActivityController.getSinglePlayerActivitiesByUserIdTag
  );

router
  .route('/public-activities/:userId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    customActivityController.getPublicActivitiesExcludingUserId
  );

router
  .route('/duplicate/:activityId')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.duplicateActivityById);

router
  .route('/duplicate-public/:activityId/user/:userId')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.duplicatePublicActivityById);

router
  .route('/student-activities/user/:userId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.getStudentActivities
  );

router
  .route('/student-activity/user/:userId/activity/:activityId')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), customActivityController.getStudentActivity);

router
  .route('/assigned-activities')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.getAssignedActivities);

router
  .route('/assigned-activities/create/activity/:activityId')
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.createAssignedActivity);

router
  .route('/assigned-activities/update-status/:activityId/:studentId')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.updateAssignedActivityStatus
  );

router
  .route('/assigned-activities-add-students/activity/:activityId')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), customActivityController.addStudentsToAssignedActivity);

router
  .route('/assigned-activities-remove-students/activity/:activityId')
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
    customActivityController.removeStudentsFromAssignedActivity
  );

router
  .route('/task-answers/:assignmentId/:studentId/:customActivityId')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.getAssignedTaskAnswers
  )
  .patch(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
    customActivityController.updateAssignedTaskAnswers
  );

export default router;
