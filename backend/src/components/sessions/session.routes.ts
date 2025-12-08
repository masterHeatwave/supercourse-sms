import express from 'express';
import { SessionController } from './session.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';

const router = express.Router();
const sessionController = new SessionController();

// Validation routes (must come before dynamic routes)
router.post('/validate', authorize([Role.ADMIN, Role.MANAGER]), sessionController.validateSessionOverlaps);
router.get('/preview', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.getSessionPreview);

// Bulk operations routes
router.post('/bulk', authorize([Role.ADMIN, Role.MANAGER]), sessionController.createBulkSessions);
router.put('/bulk', authorize([Role.ADMIN, Role.MANAGER]), sessionController.updateBulkSessions);

// Standard CRUD routes
router
  .route('/')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT_GUARDIAN]),
    sessionController.getAllSessions
  )
  .post(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.createSession);

router
  .route('/:id')
  .get(
    authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT, Role.PARENT_GUARDIAN]),
    sessionController.getSessionById
  )
  .put(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.updateSession)
  .delete(authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.deleteSession);

// Student/Teacher management routes
router.post('/add-student', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.addStudent);
router.post('/remove-student', authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER]), sessionController.removeStudent);
router.post('/add-teacher', authorize([Role.ADMIN, Role.MANAGER]), sessionController.addTeacher);
router.post('/remove-teacher', authorize([Role.ADMIN, Role.MANAGER]), sessionController.removeTeacher);

// Create token for use in online or hybrid session
router.post(
  '/online-session-token',
  authorize([Role.ADMIN, Role.MANAGER, Role.TEACHER, Role.STUDENT]),
  sessionController.createOnlineSessionToken
);
// Scoped endpoints for role-based access
router.get('/me', authorize([Role.TEACHER, Role.STUDENT]), sessionController.getMySessions);
router.get('/children', authorize([Role.PARENT_GUARDIAN]), sessionController.getChildrenSessions);

export default router;
