import express from 'express';
import { PostController } from './post.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const postController = new PostController();

router
  .route('/')
  .get(postController.getAllPosts)
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), postController.createPost);

router
  .route('/:id')
  .get(postController.getPostById)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), postController.updatePost)
  .delete(authorize([Role.ADMIN, Role.MANAGER]), postController.deletePost);

router.post('/add-tag', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), postController.addTag);

router.post('/remove-tag', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), postController.removeTag);

router.patch('/:id/publish', authorize([Role.ADMIN, Role.MANAGER]), postController.publishPost);

router.patch('/:id/archive', authorize([Role.ADMIN, Role.MANAGER]), postController.archivePost);

router.post(
  '/:id/vote',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  postController.voteOnPoll
);

router.get(
  '/:id/results',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  postController.getPollResults
);

router.patch('/:id/force-publish', authorize([Role.ADMIN, Role.MANAGER]), postController.forcePublishPost);

router.post(
  '/:id/like',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  postController.likePost
);

router.post(
  '/:id/unlike',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  postController.unlikePost
);

export default router;
