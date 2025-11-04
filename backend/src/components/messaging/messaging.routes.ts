// src/components/messaging/messaging.routes.ts
import { Router } from 'express';
import { ChatController } from './controllers/chat.controller';
import { MessageController } from './controllers/message.controller';
import { ChatNotificationController } from './controllers/chat-notification.controller';
import { AttachmentController } from './controllers/attachment.controller';
import { ReactionController } from './controllers/reactions.controller';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { AttachmentService } from './services/attachment.service';
import { ReactionService } from './services/reactions.service';
import { authorize } from '@middleware/authorize'; 

const router = Router();

// Initialize services
const chatService = new ChatService();
const messageService = new MessageService();
const notificationService = new ChatNotificationService();
const attachmentService = new AttachmentService();
const reactionService = new ReactionService();

// Initialize controllers
const chatController = new ChatController(chatService);
const messageController = new MessageController(messageService);
const notificationController = new ChatNotificationController(notificationService);
const attachmentController = new AttachmentController(attachmentService);
const reactionController = new ReactionController(reactionService);

// Socket.IO setup function
export const setupMessagingSocket = (io: any) => {
  chatService.setSocketIO(io);
  messageService.setSocketIO(io);
  notificationService.setSocketIO(io);
  attachmentService.setSocketIO(io);
  reactionService.setSocketIO(io);
};

// ==================== CHAT ROUTES ====================
router.post('/chats', authorize(), chatController.createChat);
router.get('/chats', authorize(), chatController.listChats);
router.get('/chats/participants/:userId', authorize(), chatController.getChatsByUserId);
router.get('/chats/:chatId', authorize(), chatController.getChatById);
router.post('/chats/:chatId/reset-unread', authorize(), chatController.resetUnreadCount);
router.patch('/chats/:chatId', authorize(), chatController.updateChatSettings);
router.delete('/chats/:chatId', authorize(), chatController.deleteChatById);

// ==================== MESSAGE ROUTES ====================
router.post('/messages', authorize(), messageController.sendMessage);
router.get('/messages', authorize(), messageController.getMessages);
router.get('/chats/:chatId/messages', authorize(), messageController.getMessagesByChatId);
router.patch('/messages/:id/read', authorize(), messageController.markRead);
router.post('/chats/:chatId/read', authorize(), messageController.markChatAsRead);
router.post('/messages/:messageId/delivered', authorize(), messageController.markAsDelivered);
router.patch('/messages/:messageId/read', authorize(), messageController.updateReadStatus);
router.delete('/messages/:messageId', authorize(), messageController.deleteMessage);
router.get('/incoming/:userId', authorize(), messageController.getIncomingMessages);
router.get('/sent/:userId', authorize(), messageController.getSentMessages);

// ==================== REACTION ROUTES ====================
router.post('/messages/:id/reactions', authorize(), reactionController.addReaction);
router.delete('/messages/:id/reactions', authorize(), reactionController.removeReaction);

// ==================== NOTIFICATION ROUTES ====================
// ✅ ADDED authorize() middleware to ALL notification routes
router.get('/notifications', authorize(), notificationController.getUserNotifications);
router.get('/notifications/unread/count', authorize(), notificationController.getUnreadNotificationCount);
router.patch('/notifications/:id/read', authorize(), notificationController.markNotificationAsRead);
router.post('/notifications/read/all', authorize(), notificationController.markAllNotificationsAsRead);
router.delete('/notifications/:id', authorize(), notificationController.deleteNotification);
router.post('/notifications/clear', authorize(), notificationController.clearAllNotifications);
router.get('/notifications/type/:type', authorize(), notificationController.getNotificationsByType);
router.post('/notifications/system', authorize(['ADMIN']), notificationController.createSystemNotification);
router.post('/notifications/welcome', authorize(), notificationController.createWelcomeNotification);

// ==================== ATTACHMENT ROUTES ====================
router.post('/attachments/upload', authorize(), attachmentController.uploadAttachments);
router.get('/attachments/chat/:chatId', authorize(), attachmentController.getChatAttachments);
router.get('/attachments/message/:messageId', authorize(), attachmentController.getMessageAttachments);
router.get('/attachments/:id', authorize(), attachmentController.getAttachmentById);
router.get('/attachments/:id/download', authorize(), attachmentController.downloadAttachment);
router.delete('/attachments/:id', authorize(), attachmentController.deleteAttachment);
router.post('/attachments/status', authorize(), attachmentController.getUploadStatus);

export default router;