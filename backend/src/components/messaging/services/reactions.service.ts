// src/components/messaging/services/reaction.service.ts
import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import Reaction from '../models/message.model';
import Message from '../models/message.model';
import Chat from '../models/chat.model';
import { Server as SocketIOServer } from 'socket.io';

export class ReactionService {
  private io: SocketIOServer | null = null;

  /**
   * Set Socket.IO instance for real-time updates
   */
  setSocketIO(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ErrorResponse('Message not found', StatusCodes.NOT_FOUND);
    }

    const existing = await Reaction.findOne({ messageId, userId, emoji });
    if (existing) return existing;

    const reaction = await Reaction.create({ messageId, userId, emoji });

    if (this.io) {
      const chat = await Chat.findById(message.chatId);
      if (chat) {
        chat.participants.forEach((participantId: Types.ObjectId) => {
          this.io?.to(participantId.toString()).emit('reactionAdded', {
            messageId,
            reaction,
          });
        });
      }
    }

    return reaction;
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<{ success: boolean }> {
    await Reaction.deleteOne({ messageId, userId, emoji });

    if (this.io) {
      const message = await Message.findById(messageId);
      if (message) {
        const chat = await Chat.findById(message.chatId);
        if (chat) {
          chat.participants.forEach((participantId: Types.ObjectId) => {
            this.io?.to(participantId.toString()).emit('reactionRemoved', {
              messageId,
              userId,
              emoji,
            });
          });
        }
      }
    }

    return { success: true };
  }
}