// src/config/socket.ts

import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { MessageService } from '@components/messaging/services/message.service';
import { ChatService } from '@components/messaging/services/chat.service';
import mongoose from 'mongoose';
import { config } from '@config/config';

let io: Server;

// ✅ Function to get user from any tenant database
async function findUserGlobally(userId: string) {
  try {
    // Try to import the User model correctly
    const User = mongoose.connection.model('User');

    // Query the default connection (main database)
    const user = await User.findById(userId);

    if (user) {
      console.log('✅ User found in main database');
      return user;
    }

    // If not found, try querying the users collection directly
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ Database connection is undefined');
      return null;
    }
    const userDoc = await db.collection('supercourse_users').findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });

    if (userDoc) {
      console.log('✅ User found in users collection directly');
      return userDoc;
    }

    return null;
  } catch (error) {
    console.error('❌ Error finding user:', error);
    return null;
  }
}

export const initializeSocket = (httpServer: HttpServer) => {
  console.log('🚀 Initializing Socket.IO server...');

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

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    console.log('📡 Transport:', socket.conn.transport.name);

    // ========== AUTHENTICATION ==========
    socket.on('authenticate', async (userId: string) => {
      try {
        console.log('🔐 Authenticating user:', userId);
        console.log('🔍 UserId type:', typeof userId);
        console.log('🔍 UserId length:', userId?.length);

        if (!userId || typeof userId !== 'string') {
          console.error('❌ Invalid userId provided:', userId);
          socket.emit('authenticationError', { error: 'Invalid user ID' });
          return;
        }

        // Validate ObjectId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
          console.error('❌ Invalid ObjectId format:', userId);
          socket.emit('authenticationError', { error: 'Invalid user ID format' });
          return;
        }

        // ✅ Use the global user finder
        console.log('🔍 Looking up user globally...');
        const user = await findUserGlobally(userId);

        if (!user) {
          console.error('❌ User not found in any database:', userId);
          socket.emit('authenticationError', { error: 'User not found' });
          return;
        }

        console.log('✅ User found:', user._id, user.username || user.email);

        // Join user to their personal room
        socket.join(`user-${userId}`);
        console.log(`✅ User ${userId} authenticated and joined room user-${userId}`);

        socket.emit('authenticated', {
          userId,
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

        socket.join(`chat-${chatId}`);
        console.log(`✅ Socket ${socket.id} joined chat ${chatId}`);

        socket.to(`chat-${chatId}`).emit('userJoined', {
          chatId,
          socketId: socket.id,
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
        console.log('📨 Received sendMessage event:', data);

        const { chatId, senderId, content, recipientIds, replyToMessageId } = data;

        if (!chatId || !senderId || !content) {
          console.error('❌ Missing required fields:', { chatId, senderId, content });
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }

        if (!messageService) {
          const { MessageService } = await import('../components/messaging/services/message.service.js');
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

        console.log('✅ Message processed:', message._id);

        io.to(`chat-${chatId}`).emit('newMessage', {
          ...message,
          chatId
        });

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

        socket.join(`notifications-${userId}`);
        console.log(`🔔 User ${userId} joined notifications room`);
      } catch (error) {
        console.error('❌ Error joining notifications:', error);
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
    io.to(`notifications-${userId}`).emit('newNotification', notification);
  }
};

export const emitToChat = (chatId: string, event: string, data: any) => {
  if (io) {
    io.to(`chat-${chatId}`).emit(event, data);
  }
};

export { io };