// chat.models.ts - Fixed with all required properties
import type {
    Chat as GeneratedChat,
    Message as GeneratedMessage,
    User as GeneratedUser
  } from '../../../gen-api/schemas';
  
  // Extend generated types with frontend-specific properties
  export interface Chat {
    _id: string;
    participants: string[];
    participantsDetails?: ParticipantDetail[];
    type: 'direct' | 'group';
    name?: string;
    lastMessageContent?: string;
    lastMessageDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    unreadCount?: Record<string, number>;
    isStarred?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
    isArchived?: boolean;
  }
  
  export interface Message {
    _id: string;
    chatId: string;
    senderId: string;
    senderUsername?: string;
    senderFullName?: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video';
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
    readBy?: ReadStatus[];
    deliveredTo?: DeliveryStatus[];
    replyToMessage?: ReplyToMessage | null;
    attachments?: any[];
    reactions?: any[];
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  }
  
  // ✅ Fixed: Added lastSeen property
  export interface ParticipantDetail {
    _id: string;
    userId: string;
    username?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    displayName?: string;
    userType?: string;
    isOnline?: boolean;
    lastSeen?: Date;  
    avatar?: string;
  }
  
  export interface ReadStatus {
    userId: string;
    readAt: Date;
  }
  
  export interface DeliveryStatus {
    userId: string;
    deliveredAt: Date;
  }
  
  export interface ReplyToMessage {
    _id: string;
    content: string;
    timestamp: Date;
    senderId: string;
    senderUsername?: string;
    senderFullName?: string;
  }
  
  export interface User {
    _id: string;
    userId: string;
    username: string;
    email: string;
    userType?: 'Student' | 'Teacher' | 'Admin' | 'Manager' | 'Parent' | string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: Date;
    displayName: string;
    firstname?: string;
    lastname?: string;
    fullName?: string;
  }
  
  // ✅ Add ChatUpdateEvent interface for socket events
  export interface ChatUpdateEvent {
    _id?: string;
    chatId?: string;
    userId?: string;
    updates?: any;
    timestamp?: Date;
    // Include all possible chat properties that might be updated
    lastMessageContent?: string;
    lastMessageDate?: Date;
    name?: string;
    participantsDetails?: ParticipantDetail[];
    type?: 'direct' | 'group';
    unreadCount?: Record<string, number>;
    updatedAt?: Date;
    isStarred?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
    isArchived?: boolean;
  }