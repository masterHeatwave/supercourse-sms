// src/components/messaging/messaging.interface.ts
import { Document, Types } from 'mongoose';

// ==================== ENUMS ====================

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  SYSTEM = 'system',
}

export enum AttachmentStatus {
  UPLOADING = 'uploading',
  READY = 'ready',
  ERROR = 'error',
}

export enum VirusScanStatus {
  PENDING = 'pending',
  CLEAN = 'clean',
  INFECTED = 'infected',
}

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  SYSTEM = 'system',
  CHAT_INVITE = 'chat_invite',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
}

export type FileCategory = 'image' | 'document' | 'audio' | 'video' | 'other';

// ==================== CHAT INTERFACES ====================

export interface IUserChatSettings {
  isStarred: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessageId?: Types.ObjectId;
  lastMessageContent: string;
  lastMessagedAt: Date;
  unreadCount: Map<string, number>;
  type: ChatType;
  name?: string;
  isStarred: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: string;
  
  // ❌ REMOVE userSettings: Map<string, IUserChatSettings>;
  
  // Instance methods (keep only unread count ones)
  resetUnreadCountForUser(userId: string): void;
  incrementUnreadCount(senderId: string): void;
}

export interface ICreateChatDTO {
  participants: string[];
  type?: ChatType;
  name?: string;
}

export interface IChatUpdateDTO {
  id: string;
  participants?: string[];
  lastMessageId?: string;
  lastMessageContent?: string;
  lastMessagedAt?: Date;
  type?: ChatType;
  name?: string;
  isStarred?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

export interface IChatModel {
  findByParticipant(userId: string | Types.ObjectId): Promise<IChat[]>;
  findDirectChat(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId): Promise<IChat | null>;
}

// ==================== MESSAGE INTERFACES ====================

export interface IDeliveryStatus {
  userId: Types.ObjectId;
  deliveredAt: Date;
}

export interface IReadStatus {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientIds: Types.ObjectId[];
  chatId: Types.ObjectId;
  content?: string;
  timestamp: Date;
  replyToMessageId?: Types.ObjectId;
  deliveredTo: IDeliveryStatus[];
  readBy: IReadStatus[];
  read: boolean; // legacy field - for backward compatibility
  readAt?: Date; // legacy field - for backward compatibility
  type: MessageType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISendMessageDTO {
  senderId: string;
  chatId?: string;
  recipientIds?: string[];
  content?: string;
  type?: MessageType;
  replyToMessageId?: string;
  timestamp?: Date;
}

export interface IMessageUpdateDTO {
  id: string;
  content?: string;
  deliveredTo?: IDeliveryStatus[];
  readBy?: IReadStatus[];
}

export interface IMessageModel {
  findByChatId(chatId: string | Types.ObjectId, limit?: number): Promise<IMessage[]>;
  markAsDelivered(messageId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IMessage | null>;
  markAsRead(messageId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IMessage | null>;
}

// ==================== REACTION INTERFACES ====================

export interface IReaction extends Document {
  _id: Types.ObjectId;
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReactionCreateDTO {
  messageId: string;
  userId: string;
  emoji: string;
}

// ==================== CHAT NOTIFICATION INTERFACES ====================

export interface IChatNotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  content: string;
  relatedUserId?: Types.ObjectId;
  relatedMessageId?: Types.ObjectId;
  relatedChatId?: Types.ObjectId;
  isRead: boolean;
  isDeleted: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatNotificationCreateDTO {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedUserId?: string;
  relatedMessageId?: string;
  relatedChatId?: string;
}

export interface IChatNotificationUpdateDTO {
  id: string;
  isRead?: boolean;
  isDeleted?: boolean;
  readAt?: Date;
}

export interface IChatNotificationModel {
  findByUserId(userId: string | Types.ObjectId, limit?: number): Promise<IChatNotification[]>;
  findUnreadByUserId(userId: string | Types.ObjectId): Promise<IChatNotification[]>;
  markAsRead(notificationId: string | Types.ObjectId): Promise<IChatNotification | null>;
  markAllAsRead(userId: string | Types.ObjectId): Promise<number>;
}

// ==================== ATTACHMENT INTERFACES ====================

export interface IAttachmentMetadata {
  width?: number;
  height?: number;
  exif?: {
    camera?: string;
    location?: string;
    dateTaken?: Date;
  };
}

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  fileExtension?: string;
  fileSize: number;
  url?: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  chatId: Types.ObjectId;
  messageId?: Types.ObjectId;
  status: AttachmentStatus;
  virusScanStatus: VirusScanStatus;
  metadata?: IAttachmentMetadata;
  createdAt: Date;
  updatedAt: Date;
  fileCategory: FileCategory; // virtual
  fileSizeFormatted: string; // virtual
}

export interface IAttachmentCreateDTO {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  chatId: string;
  messageId?: string;
  url?: string;
  fileExtension?: string;
  status?: AttachmentStatus;
  metadata?: IAttachmentMetadata;
}

export interface IAttachmentUpdateDTO {
  id: string;
  status?: AttachmentStatus;
  virusScanStatus?: VirusScanStatus;
  url?: string;
}

export interface IAttachmentModel {
  findByChat(chatId: string | Types.ObjectId, limit?: number): Promise<IAttachment[]>;
  findByMessage(messageId: string | Types.ObjectId): Promise<IAttachment[]>;
}