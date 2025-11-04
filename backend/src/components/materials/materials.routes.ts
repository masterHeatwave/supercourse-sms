import express from 'express';
import { MaterialsController } from './materials.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const materialsController = new MaterialsController();

router.get('/assigned', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), materialsController.getAssignedMaterials);

export default router;
