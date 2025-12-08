// src/app/services/messaging/messaging-wrapper.service.ts 
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MessagingService } from '../../gen-api/messaging/messaging.service';
import { UsersService } from '../../gen-api/users/users.service';
import { AuthStoreService } from './auth-store.service';
import { HttpClient, HttpEvent } from '@angular/common/http';

// Import generated types
import type {
  PostMessagingChatsBody,
  PostMessagingMessagesBody,
  PostMessagingChatsChatIdReadBody,
  PostMessagingMessagesMessageIdDeliveredBody
} from '../../gen-api/schemas';

// Import custom models
import { Chat, Message } from '../../components/messaging/models/chat.models';
import {
  Attachment,
  AttachmentUploadRequest,
  AttachmentUploadResponse,
  MessageAttachment
} from '../../components/messaging/models/attachment.models';

@Injectable({
  providedIn: 'root'
})
export class MessagingWrapperService {
  private messagingApi = inject(MessagingService);
  private usersApi = inject(UsersService);
  private authService = inject(AuthStoreService);
  private http = inject(HttpClient);

  // ========================================
  // HELPER METHODS
  // ========================================
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost';
      return isDev 
        ? 'http://localhost:3193/v1'
        : 'https://api-sms.supercourse.dd.softwebpages.com/v1';
    }
    return 'http://localhost:3193/v1';
  }

  private convertChatDates(chat: any): Chat {
    return {
      ...chat,
      _id: chat._id,
      lastMessageDate: new Date(chat.lastMessageDate || chat.updatedAt),
      createdAt: chat.createdAt ? new Date(chat.createdAt) : undefined,
      updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : undefined,
      participantsDetails: chat.participantsDetails || chat.participants || []
    };
  }

  private convertMessageDates(message: any): Message {
    return {
      ...message,
      timestamp: new Date(message.timestamp),
      createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
      updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined,
      readBy: message.readBy?.map((readItem: any) => ({
        ...readItem,
        readAt: new Date(readItem.readAt)
      })) || [],
      replyToMessage: message.replyToMessage ? {
        ...message.replyToMessage,
        timestamp: new Date(message.replyToMessage.timestamp)
      } : null,
      // ✅ Convert attachment dates
      attachments: message.attachments?.map((att: any) => this.convertAttachmentDates(att)) || []
    };
  }
  
  private convertAttachmentDates(attachment: any): Attachment | MessageAttachment {
    return {
      ...attachment,
      createdAt: attachment.createdAt ? new Date(attachment.createdAt) : undefined,
      updatedAt: attachment.updatedAt ? new Date(attachment.updatedAt) : undefined,
      deletedAt: attachment.deletedAt ? new Date(attachment.deletedAt) : undefined,
      lastModified: attachment.lastModified ? new Date(attachment.lastModified) : undefined
    };
  }

  // ========================================
  // CHAT METHODS
  // ========================================
  getUserChats(userId: string): Observable<Chat[]> {
    return this.messagingApi.getMessagingChatsParticipantsUserId(userId).pipe(
      map((response: any) => {
        const chats = response.data || response;
        return Array.isArray(chats) ? chats.map(chat => this.convertChatDates(chat)) : [];
      })
    );
  }

  /**
   * ✅ Get messages for a chat (includes attachments with signed URLs from backend)
   */
  getMessages(chatId: string, limit: number = 1000): Observable<Message[]> {
    const params: any = { chatId };
    if (limit) params.limit = limit.toString();
    
    return this.messagingApi.getMessagingMessages(params).pipe(
      map((response: any) => {
        let messages = response.data || response;
        if (!Array.isArray(messages)) return [];
        
        const converted = messages.map(msg => this.convertMessageDates(msg));
        
        return converted;
      }),
      catchError((error) => {
        console.error('❌ Error fetching messages:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ Send message WITHOUT attachments (original method)
   */
  sendMessage(
    senderId: string, 
    recipientIds: string[], 
    content: string, 
    chatId: string, 
    replyToMessageId?: string
  ): Observable<Message> {
    const body: PostMessagingMessagesBody = {
      senderId,
      recipientIds,
      content,
      type: 'text',
      chatId,
      ...(replyToMessageId && { replyToMessageId })
    };

    return this.messagingApi.postMessagingMessages(body).pipe(
      map((response: any) => this.convertMessageDates(response.data || response))
    );
  }

  /**
   * ✅ NEW: Send message WITH attachments
   */
  sendMessageWithAttachments(
    senderId: string,
    recipientIds: string[],
    content: string,
    chatId: string,
    attachments?: Array<{
      fileId: string;
      filename: string;
      key: string;
      size: number;
      contentType: string;
    }>,
    replyToMessageId?: string
  ): Observable<Message> {
    const payload: any = {
      senderId,
      recipientIds,
      content: content || '',
      type: 'text',
      chatId,
      timestamp: new Date().toISOString()
    };

    // ✅ Add attachments if present
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    // ✅ Add reply reference if present
    if (replyToMessageId) {
      payload.replyToMessageId = replyToMessageId;
    }

    return this.messagingApi.postMessagingMessages(payload).pipe(
      map((response: any) => this.convertMessageDates(response.data || response)),
      catchError((error) => {
        console.error('❌ Error sending message:', error);
        console.error('❌ Error details:', error.error);
        throw error;
      })
    );
  }

  createChat(chatData: { participants: string[]; type: 'direct' | 'group'; name?: string }): Observable<Chat> {
    const body: PostMessagingChatsBody = {
      participants: chatData.participants,
      type: chatData.type as any,
      ...(chatData.name && { name: chatData.name })
    };
  
    return this.messagingApi.postMessagingChats(body).pipe(
      map((response: any) => this.convertChatDates(response.data || response))
    );
  }

  updateChat(chatId: string, updates: any): Observable<Chat> {
    return this.messagingApi.patchMessagingChatsChatId(chatId, updates).pipe(
      map((response: any) => this.convertChatDates(response.data || response))
    );
  }

  resetUnreadCount(chatId: string, userId: string): Observable<any> {
    return this.messagingApi.postMessagingChatsChatIdResetUnread(chatId, { userId });
  }

  getChatById(chatId: string): Observable<Chat> {
    return this.messagingApi.getMessagingChatsChatId(chatId).pipe(
      map((response: any) => this.convertChatDates(response.data || response))
    );
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.messagingApi.deleteMessagingMessagesMessageId(messageId);
  }

  deleteChat(chatId: string): Observable<any> {
    return this.messagingApi.deleteMessagingChatsChatId(chatId);
  }

  markChatAsRead(chatId: string, userId: string): Observable<any> {
    const body: PostMessagingChatsChatIdReadBody = {
      chatId,
      userId
    };
    
    return this.messagingApi.postMessagingChatsChatIdRead(chatId, body);
  }
  
  markMessageAsDelivered(messageId: string, userId: string): Observable<any> {
    const body: PostMessagingMessagesMessageIdDeliveredBody = {
      messageId,
      userId
    };
    
    return this.messagingApi.postMessagingMessagesMessageIdDelivered(messageId, body);
  }

  // ========================================
  // ATTACHMENT METHODS
  // ========================================
  
  /**
   * ✅ Download attachment (returns blob)
   */
  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.messagingApi.getMessagingAttachmentsIdDownload(attachmentId, {
      responseType: 'blob'
    }) as Observable<Blob>;
  }

  /**
   * ✅ Delete attachment
   */
  deleteAttachment(attachmentId: string): Observable<any> {
    return this.messagingApi.deleteMessagingAttachmentsId(attachmentId);
  }

  /**
   * ✅ Upload attachments (multiple files)
   */
  uploadAttachments(request: AttachmentUploadRequest): Observable<AttachmentUploadResponse> {
    return this.messagingApi.postMessagingAttachmentsUpload({
      files: request.files,
      chatId: request.chatId,
      messageId: request.messageId
    }).pipe(
      map((response: any) => ({
        ...response,
        attachments: response.attachments?.map((att: any) => this.convertAttachmentDates(att))
      }))
    );
  }

  /**
   * ✅ Upload attachments with progress tracking
   */
  uploadAttachmentsWithProgress(formData: FormData): Observable<HttpEvent<any>> {
    const baseUrl = this.getBaseUrl();
    
    return this.http.post(`${baseUrl}/messaging/attachments/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * ✅ Get all attachments for a chat
   */
  getChatAttachments(chatId: string, limit: number = 50): Observable<Attachment[]> {
    return this.messagingApi.getMessagingAttachmentsChatChatId(chatId, { limit }).pipe(
      map((response: any) => {
        const attachments = response.attachments || response.data?.attachments || [];
        return attachments.map((att: any) => this.convertAttachmentDates(att));
      })
    );
  }

  /**
   * ✅ Get attachments for a specific message
   */
  getMessageAttachments(messageId: string): Observable<Attachment[]> {
    return this.messagingApi.getMessagingAttachmentsMessageMessageId(messageId).pipe(
      map((response: any) => {
        const attachments = response.attachments || response.data?.attachments || [];
        return attachments.map((att: any) => this.convertAttachmentDates(att));
      })
    );
  }

  // ========================================
  // CONVENIENCE METHODS
  // ========================================
  toggleChatFavorite(chatId: string, isStarred: boolean, userId?: string): Observable<Chat> {
    return this.updateChat(chatId, { isStarred });
  }

  toggleChatPin(chatId: string, isPinned: boolean, userId?: string): Observable<Chat> {
    return this.updateChat(chatId, { isPinned });
  }

  toggleChatMute(chatId: string, isMuted: boolean, userId?: string): Observable<Chat> {
    return this.updateChat(chatId, { isMuted });
  }

  archiveChat(chatId: string, userId?: string): Observable<Chat> {
    return this.updateChat(chatId, { isArchived: true });
  }

  unarchiveChat(chatId: string, userId?: string): Observable<Chat> {
    return this.updateChat(chatId, { isArchived: false });
  }
  
  // ========================================
  // USER & CLASS METHODS FOR NEW CHAT DIALOG
  // ========================================
  getUsers(limit: number = 1000): Observable<any[]> {
    return this.usersApi.getUsers({ limit: limit.toString() }).pipe(
      map((response: any) => {
        let users: any[] = [];
        
        if (response?.data?.results && Array.isArray(response.data.results)) {
          users = response.data.results;
        } else if (response?.data && Array.isArray(response.data)) {
          users = response.data;
        } else if (Array.isArray(response)) {
          users = response;
        } else {
          console.warn('⚠️ No users array found in response');
        }
        
        const transformedUsers = users.map(user => {
          let userId: string;
          
          if (user._id && typeof user._id === 'object' && '$oid' in user._id) {
            userId = user._id.$oid;
          } else if (typeof user._id === 'string') {
            userId = user._id;
          } else if (user.id) {
            userId = user.id;
          } else {
            console.warn('⚠️ No valid ID found for user:', user);
            userId = `fallback-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          return {
            _id: userId,
            user: userId,
            username: user.username,
            userType: user.user_type,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
          };
        });
      
        return transformedUsers;
      }),
      catchError((error: any) => {
        console.error('❌ Error in getUsers:', error);
        return of([]);
      })
    );
  }
  
  getClasses(): Observable<any[]> {
    const baseUrl = this.getBaseUrl();
    return this.http.get<any>(`${baseUrl}/taxis/messaging`).pipe(
      map((response: any) => {
        let classes: any[] = [];
        
        if (Array.isArray(response)) {
          classes = response;
        } else if (response && typeof response === 'object') {
          if ('data' in response && Array.isArray(response.data)) {
            classes = response.data;
          } else if ('taxis' in response && Array.isArray(response.taxis)) {
            classes = response.taxis;
          } else if ('classes' in response && Array.isArray(response.classes)) {
            classes = response.classes;
          }
        }
      
        const transformClassUser = (user: any) => {
          let userId: string;
          
          if (user._id && typeof user._id === 'object' && '$oid' in user._id) {
            userId = user._id.$oid;
          } else if (typeof user._id === 'string') {
            userId = user._id;
          } else if (user.id) {
            userId = user.id;
          } else {
            userId = `fallback-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          return {
            _id: userId,
            user: userId,
            username: user.username,
            userType: user.user_type,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
          };
        };
        
        const transformedClasses = classes.map(classItem => ({
          _id: classItem._id,
          name: classItem.name,
          subject: classItem.subject || '',
          level: classItem.level || '',
          students: (classItem.students || []).map(transformClassUser),
          teachers: (classItem.teachers || []).map(transformClassUser)
        }));
        
        return transformedClasses;
      }),
      catchError((error: any) => {
        console.error('❌ Error in getClasses:', error);
        return of([]);
      })
    );
  }

  getClassChat(taxiId: string): Observable<Chat> {

    if (!taxiId) {
      return throwError(() => new Error('Taxi ID is required'));
    }

    const baseUrl = this.getBaseUrl();
    
    return this.http.get<any>(`${baseUrl}/messaging/chats/class/${taxiId}`).pipe(
      map((response: any) => {
        const chat = response.data || response;
        
        if (!chat) {
          throw new Error('No chat data received from server');
        }

        return this.convertChatDates(chat);
      }),
      catchError((error: any) => {
        console.error('❌ [MessagingWrapper] Error fetching class chat:', error);
        
        if (error.status === 404) {
          return throwError(() => new Error('Class chat not found'));
        }
        if (error.status === 400) {
          return throwError(() => new Error('Invalid taxi ID format'));
        }
        
        return throwError(() => new Error(`Failed to fetch class chat: ${error.message}`));
      })
    );
  }
}