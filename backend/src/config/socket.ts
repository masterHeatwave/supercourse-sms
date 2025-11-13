// src/config/socket.ts

import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { MessageService } from '@components/messaging/services/message.service';
import { ChatService } from '@components/messaging/services/chat.service';
import mongoose from 'mongoose';
import { config } from '@config/config';
import { ChatNotificationService } from '../components/messaging/services/chat-notification.service';

let io: Server;

// ✅ Store socket-specific data (userId and tenantId)
interface SocketData {
  userId: string;
  tenantId: string;
}

// ✅ Map to store socket data for each connection
const socketDataMap = new Map<string, SocketData>();

/**
 * ✅ Find user in tenant-specific collection
 */
async function findUserInTenant(userId: string, tenantId: string) {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ Database connection is undefined');
      return null;
    }

    const collectionName = `${tenantId}_users`;

    const userDoc = await db.collection(collectionName).findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });

    if (userDoc) {
      return userDoc;
    }

    console.warn(`⚠️ User ${userId} not found in ${collectionName}`);
    return null;
  } catch (error) {
    console.error('❌ Error finding user:', error);
    return null;
  }
}

export const initializeSocket = (httpServer: HttpServer) => {

  io = new Server(httpServer, {
    cors: {
      origin: config.WEB_HOST,
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['*']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true
  });

  console.log('✅ Socket.IO server configured');
  console.log('📡 Allowed origins:', config.WEB_HOST);

  let messageService: MessageService;
  let chatService: ChatService;
  let notificationService: ChatNotificationService;

  messageService = new MessageService();
  messageService.setSocketIO(io);
  
  chatService = new ChatService();
  chatService.setSocketIO(io);
  
  notificationService = new ChatNotificationService();
  notificationService.setSocketIO(io);

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // ========== AUTHENTICATION ==========
    socket.on('authenticate', async (data: { userId: string; tenantId: string } | string) => {
      try {
        // ✅ Handle both old format (string) and new format (object)
        let userId: string;
        let tenantId: string;

        if (typeof data === 'string') {
          // ✅ OLD FORMAT: Just userId as string (backward compatibility)
          console.warn('⚠️ Received old authentication format (userId only)');
          userId = data;
          tenantId = 'supercourse'; // ✅ Fallback to default tenant
        } else {
          // ✅ NEW FORMAT: Object with userId and tenantId
          userId = data.userId;
          tenantId = data.tenantId;
        }

        console.log('🔐 Authentication attempt - userId:', userId, 'tenantId:', tenantId);

        if (!userId || typeof userId !== 'string') {
          console.error('❌ Invalid userId provided:', userId);
          socket.emit('authenticationError', { error: 'Invalid user ID' });
          return;
        }

        if (!tenantId || typeof tenantId !== 'string') {
          console.error('❌ Invalid tenantId provided:', tenantId);
          socket.emit('authenticationError', { error: 'Invalid tenant ID' });
          return;
        }

        // Validate ObjectId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
          console.error('❌ Invalid ObjectId format:', userId);
          socket.emit('authenticationError', { error: 'Invalid user ID format' });
          return;
        }

        // ✅ Find user in tenant-specific collection
        const user = await findUserInTenant(userId, tenantId);

        if (!user) {
          console.error('❌ User not found:', userId, 'in tenant:', tenantId);
          socket.emit('authenticationError', { error: 'User not found' });
          return;
        }

        // ✅ Store tenant context for this socket
        socketDataMap.set(socket.id, { userId, tenantId });

        // Join user to their personal room
        socket.join(`user-${userId}`);

        console.log(`✅ User ${userId} authenticated for tenant ${tenantId}`);

        socket.emit('authenticated', {
          userId,
          tenantId,
          socketId: socket.id,
          message: 'Authentication successful'
        });

      } catch (error) {
        console.error('❌ Authentication error:', error);
        socket.emit('authenticationError', {
          error: 'Authentication failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ========== CHAT MANAGEMENT ==========
    socket.on('joinChat', (chatId: string) => {
      try {
        if (!chatId) {
          console.error('❌ Invalid chatId provided');
          return;
        }

        const socketData = socketDataMap.get(socket.id);
        if (!socketData) {
          console.error('❌ User not authenticated, cannot join chat');
          socket.emit('error', { message: 'Please authenticate first' });
          return;
        }

        socket.join(`chat-${chatId}`);
        console.log(`✅ Socket ${socket.id} (user ${socketData.userId}) joined chat ${chatId}`);

        socket.to(`chat-${chatId}`).emit('userJoined', {
          chatId,
          socketId: socket.id,
          userId: socketData.userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Error joining chat:', error);
      }
    });

    socket.on('leaveChat', (chatId: string) => {
      try {
        socket.leave(`chat-${chatId}`);
        console.log(`🚪 Socket ${socket.id} left chat ${chatId}`);
      } catch (error) {
        console.error('❌ Error leaving chat:', error);
      }
    });

    // ========== MESSAGE EVENTS ==========
    socket.on('sendMessage', async (data) => {
      try {
        console.log('📤 Sending message:', data);

        const { chatId, senderId, content, recipientIds, replyToMessageId } = data;

        if (!chatId || !senderId || !content) {
          console.error('❌ Missing required fields:', { chatId, senderId, content });
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }

        const socketData = socketDataMap.get(socket.id);
        if (!socketData) {
          console.error('❌ No socket data available - user not authenticated');
          socket.emit('messageError', { error: 'Authentication required' });
          return;
        }

        console.log(`📨 Processing message from user ${senderId} in tenant ${socketData.tenantId}`);

        if (!messageService) {
          messageService = new MessageService();
          messageService.setSocketIO(io);
        }

        const message = await messageService.sendMessage({
          senderId,
          recipientIds: recipientIds || [],
          content,
          chatId,
          replyToMessageId
        });

        io.to(`chat-${chatId}`).emit('newMessage', {
          ...message,
          chatId
        });

        console.log('✅ Message sent successfully:', message._id);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('messageError', {
          error: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ========== TYPING INDICATORS ==========
    socket.on('typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      try {
        const { chatId, userId, isTyping } = data;

        if (!chatId || !userId) {
          console.error('❌ Invalid typing data:', data);
          return;
        }

        socket.to(`chat-${chatId}`).emit('typing', {
          chatId,
          userId,
          isTyping
        });
      } catch (error) {
        console.error('❌ Error handling typing event:', error);
      }
    });

    // ========== MESSAGE STATUS ==========
    socket.on('markMessageRead', async (data: { messageId: string; userId: string }) => {
      try {
        const socketData = socketDataMap.get(socket.id);
        if (!socketData) {
          console.error('❌ No socket data for marking message read');
          return;
        }

        if (!messageService) {
          const { MessageService } = await import('../components/messaging/services/message.service.js');
          messageService = new MessageService();
          messageService.setSocketIO(io);
        }

        await messageService.markMessageRead(data.messageId, data.userId);

        io.to(`user-${data.userId}`).emit('messageRead', {
          messageId: data.messageId,
          userId: data.userId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('❌ Error marking message as read:', error);
      }
    });

    socket.on('markMessageDelivered', async (data: { messageId: string; userId: string }) => {
      try {
        const socketData = socketDataMap.get(socket.id);
        if (!socketData) {
          console.error('❌ No socket data for marking message delivered');
          return;
        }

        if (!messageService) {
          const { MessageService } = await import('../components/messaging/services/message.service.js');
          messageService = new MessageService();
          messageService.setSocketIO(io);
        }

        await messageService.markAsDelivered(data.messageId, data.userId);

        io.to(`user-${data.userId}`).emit('messageDelivered', {
          messageId: data.messageId,
          userId: data.userId,
          deliveredAt: new Date()
        });
      } catch (error) {
        console.error('❌ Error marking message as delivered:', error);
      }
    });

    // ========== CHAT UPDATES ==========
    socket.on('chatUpdated', (data: { chatId: string; userId: string; updates: any }) => {
      try {
        const { chatId, userId, updates } = data;

        if (!chatId || !userId) {
          console.error('❌ Invalid chat update data:', data);
          return;
        }

        io.to(`chat-${chatId}`).emit('chatUpdated', {
          chatId,
          userId,
          updates,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Error handling chat update:', error);
      }
    });

    // ========== NOTIFICATION EVENTS ==========
    socket.on('joinNotifications', (userId: string) => {
      try {
        if (!userId) {
          console.error('❌ Invalid userId for notifications');
          return;
        }

        const socketData = socketDataMap.get(socket.id);
        if (!socketData) {
          console.error('❌ User not authenticated for notifications');
          return;
        }

        console.log(`🔔 User ${userId} (tenant: ${socketData.tenantId}) notifications ready`);
        
        socket.emit('notificationsJoined', { 
          userId, 
          timestamp: new Date(),
          rooms: [`user-${userId}`]
        });
      } catch (error) {
        console.error('❌ Error in joinNotifications:', error);
      }
    });

    socket.on('markNotificationRead', async (data: { notificationId: string; userId: string }) => {
      try {
        console.log('📖 Marking notification as read:', data);
        
        socket.emit('notificationMarkedRead', {
          notificationId: data.notificationId,
          timestamp: new Date()
        });
        
        io.to(`user-${data.userId}`).emit('notificationMarkedRead', {
          notificationId: data.notificationId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    }); 

    // ========== USER PRESENCE ==========
    socket.on('userOnline', (userId: string) => {
      try {
        console.log(`🟢 User ${userId} is online`);
        socket.broadcast.emit('userOnline', userId);
      } catch (error) {
        console.error('❌ Error broadcasting user online:', error);
      }
    });

    socket.on('userOffline', (userId: string) => {
      try {
        console.log(`🔴 User ${userId} is offline`);
        socket.broadcast.emit('userOffline', userId);
      } catch (error) {
        console.error('❌ Error broadcasting user offline:', error);
      }
    });

    // ========== DISCONNECTION ==========
    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
      
      // ✅ Clean up socket data
      const socketData = socketDataMap.get(socket.id);
      if (socketData) {
        console.log(`🧹 Cleaning up socket data for user ${socketData.userId} (tenant: ${socketData.tenantId})`);
        socketDataMap.delete(socket.id);
      }
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socket.conn.on('upgrade', () => {
      console.log('🔼 Transport upgraded to:', socket.conn.transport.name);
    });
  });

  console.log('✅ Socket.IO event handlers registered');

  return io;
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    console.log(`🔔 Emitting notification to user-${userId}:`, notification.title);
    // ✅ Only emit to user room (user is already in this room from authenticate)
    io.to(`user-${userId}`).emit('newNotification', notification);
  } else {
    console.error('❌ Socket.IO not initialized, cannot emit notification');
  }
};

export const emitToChat = (chatId: string, event: string, data: any) => {
  if (io) {
    io.to(`chat-${chatId}`).emit(event, data);
  }
};

export { io };