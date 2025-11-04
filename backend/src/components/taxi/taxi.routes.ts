// taxi.routes.ts - Fixed route order (specific routes before parameterized routes)
import express from 'express';
import { TaxiController } from './taxi.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const taxiController = new TaxiController();

const allRoles = [Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT];

// Specific routes MUST come BEFORE parameterized routes like /:id
// Otherwise Express will match '/with-users' and '/messaging' as IDs

// Get all taxis with populated user details (heavy)
router.get('/with-users', authorize(allRoles), taxiController.getAllTaxisWithUsers);

// Get taxis for messaging (lightweight)
router.get('/messaging', authorize(allRoles), taxiController.getTaxisForMessaging);

// Get taxis by user ID
router.get('/user/:userId', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), taxiController.getTaxisByUserId);

// Add/remove user endpoints
router.post('/add-user', authorize([Role.ADMIN, Role.MANAGER]), taxiController.addUser);
router.post('/remove-user', authorize([Role.ADMIN, Role.MANAGER]), taxiController.removeUser);

// Base CRUD routes for taxis
router
  .route('/')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), taxiController.getAllTaxis)
  .post(authorize([Role.ADMIN, Role.MANAGER]), taxiController.createTaxi);

// Get taxi attendance (must be before /:id to avoid matching as ID)
router.get('/:id/attendance', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), taxiController.getTaxiAttendance);

// Get single taxi with users (must be before /:id)
router.get('/:id/with-users', authorize(allRoles), taxiController.getTaxiByIdWithUsers);

// ✅ Parameterized /:id routes come LAST
router
  .route('/:id')
  .get(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), taxiController.getTaxiById)
  .put(authorize([Role.ADMIN, Role.MANAGER]), taxiController.updateTaxi)
  .delete(authorize([Role.ADMIN]), taxiController.deleteTaxi);

export default router;