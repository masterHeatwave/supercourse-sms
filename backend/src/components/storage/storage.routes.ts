import express from 'express';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
import { StorageController } from '@components/storage/storage.controller';
import { storageUpload } from '@middleware/storageUpload';

const router = express.Router();
const storageController = new StorageController();

router.get('/files/*', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), storageController.listFiles);

router.get('/size', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]), storageController.getSizeInfo);

router.get(
  '/getFile/*',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  storageController.getFile
);

router.post(
  '/upload',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  storageUpload,
  storageController.uploadFile
);

router.post(
  '/create-folder',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  storageController.createFolder
);

router.post(
  '/delete',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  storageController.deleteObject
);

export default router;
