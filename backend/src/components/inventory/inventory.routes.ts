import express from 'express';
import { InventoryController } from './inventory.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const inventoryController = new InventoryController();

router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), inventoryController.getAllInventoryItems)
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), inventoryController.createInventoryItem);

router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), inventoryController.getInventoryItemById)
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), inventoryController.updateInventoryItem)
  .delete(authorize([Role.ADMIN, Role.MANAGER]), inventoryController.deleteInventoryItem);

router.patch(
  '/:id/mark-returned',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]),
  inventoryController.markAsReturned
);

export default router;
