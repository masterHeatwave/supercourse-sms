import express from 'express';
import { MoodController } from './mood.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
const router = express.Router();
const moodController = new MoodController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getAllMoods)
  .post(authorize([Role.TEACHER, Role.STUDENT, Role.ADMIN, Role.MANAGER]), moodController.saveMood);

router
  .route('/getBestVideos')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getBestVideos);

router.route('/:id').get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getMoodById);

router
  .route('/user/:userId/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getMoodByUserId);

router
  .route('/user/:userId/class/:classId')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getMoodByUserIdClassId);

//videos

router
  .route('/getVideosByType/:videoType')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getVideosByType);

router
  .route('/getVideoById/:videoId/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.getVideoById);

router
  .route('/registerView/:videoId/')
  .patch(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), moodController.registerView);

export default router;
