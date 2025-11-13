// notification.models.ts 

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  SYSTEM = 'system',
  CHAT_INVITE = 'chat_invite',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline'
}

/**
 * ✅ FIXED: Notification interface with union types for populated fields
 */
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  
  // ✅ Can be string (ObjectId) OR populated object
  relatedUserId?: string | {
    _id: string;
    username: string;
    avatar?: string;
    firstname?: string;
    lastname?: string;
  };
  
  relatedMessageId?: string;
  
  // ✅ Can be string (ObjectId) OR populated object
  relatedChatId?: string | {
    _id: string;
    name?: string;
    type: 'direct' | 'group';
  };
  
  isRead: boolean;
  isDeleted: boolean;
  readAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message?: string;
  data?: Notification;
  modifiedCount?: number;
}