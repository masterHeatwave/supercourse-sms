import express from 'express';
import { BookmarkController } from './bookmark.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const bookmarkController = new BookmarkController();

//Returns an array with all user's bookmarks for the specified appId
router.get(
  '/:appId',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  bookmarkController.getBookmarks
);

//Update user's bookmarks for the specified appId or create if not exists
router.put(
  '/:appId',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  bookmarkController.updateBookmarks
);

export default router;
