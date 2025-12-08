import express from 'express';
import { ChatbotController } from './chatbot.controller';
import { authorize } from '@middleware/authorize';
import { Role } from '@middleware/constants/role';
const router = express.Router();
const chatbotController = new ChatbotController();

router
  .route('/')
  .post(
    authorize([Role.TEACHER, Role.STUDENT, Role.ADMIN, Role.MANAGER, Role.PARENT]),
    chatbotController.getChatbotMessage
  );

export default router;
