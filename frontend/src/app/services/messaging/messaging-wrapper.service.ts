// services/messaging/messaging-wrapper.service.ts 
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { MessagingService } from '../../gen-api/messaging/messaging.service';
import { UsersService } from '../../gen-api/users/users.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
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
  AttachmentUploadResponse 
} from '../../components/messaging/models/attachment.models';

@Injectable({
  providedIn: 'root'
})
export class MessagingWrapperService {
  private messagingApi = inject(MessagingService);
  private usersApi = inject(UsersService);
  private taxisApi = inject(TaxisService);
  private authService = inject(AuthStoreService);
  private http = inject(HttpClient);


  private convertChatDates(chat: any): Chat {
    return {
      ...chat,
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
      attachments: message.attachments?.map((att: any) => this.convertAttachmentDates(att)) || []
    };
  }

  private convertAttachmentDates(attachment: any): Attachment {
    return {
      ...attachment,
      uploadedAt: new Date(attachment.uploadedAt),
      metadata: attachment.metadata ? {
        ...attachment.metadata,
        exif: attachment.metadata.exif ? {
          ...attachment.metadata.exif,
          dateTaken: attachment.metadata.exif.dateTaken ? new Date(attachment.metadata.exif.dateTaken) : undefined
        } : undefined
      } : undefined
    };
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost';
      return isDev 
        ? 'http://localhost:3193/v1'
        : 'https://api-sms.supercourse.dd.softwebpages.com/v1';
    }
    return 'http://localhost:3193/v1';
  }

  // ========== CHAT METHODS ==========
  getUserChats(userId: string): Observable<Chat[]> {
    return this.messagingApi.getMessagingChatsParticipantsUserId(userId).pipe(
      map((response: any) => {
        const chats = response.data || response;
        return Array.isArray(chats) ? chats.map(chat => this.convertChatDates(chat)) : [];
      })
    );
  }

  getMessages(chatId: string, limit?: number): Observable<Message[]> {
    const params: any = { chatId };
    if (limit) params.limit = limit.toString();
    
    return this.messagingApi.getMessagingMessages(params).pipe(
      map((response: any) => {
        let messages = response.data || response;
        if (!Array.isArray(messages)) return [];
        return messages.map(msg => this.convertMessageDates(msg));
      })
    );
  }

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
    // ✅ SIMPLIFIED: No userId handling needed
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

  // ========== ATTACHMENT METHODS ==========
  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.messagingApi.getMessagingAttachmentsIdDownload(attachmentId, {
      responseType: 'blob'
    }) as Observable<Blob>;
  }

  deleteAttachment(attachmentId: string): Observable<any> {
    return this.messagingApi.deleteMessagingAttachmentsId(attachmentId);
  }

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

  uploadAttachmentsWithProgress(formData: FormData): Observable<HttpEvent<any>> {
    const baseUrl = this.getBaseUrl();
    
    return this.http.post(`${baseUrl}/messaging/attachments/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getChatAttachments(chatId: string, limit: number = 50): Observable<Attachment[]> {
    return this.messagingApi.getMessagingAttachmentsChatChatId(chatId, { limit }).pipe(
      map((response: any) => {
        const attachments = response.attachments || response.data?.attachments || [];
        return attachments.map((att: any) => this.convertAttachmentDates(att));
      })
    );
  }

  getMessageAttachments(messageId: string): Observable<Attachment[]> {
    return this.messagingApi.getMessagingAttachmentsMessageMessageId(messageId).pipe(
      map((response: any) => {
        const attachments = response.attachments || response.data?.attachments || [];
        return attachments.map((att: any) => this.convertAttachmentDates(att));
      })
    );
  }

  // ========== CONVENIENCE METHODS ==========
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
  
  // ========== USER & CLASS METHODS FOR NEW CHAT DIALOG ==========
  

getUsers(): Observable<any[]> {
  
  return this.usersApi.getUsers().pipe(
    tap((response: any) => {
    }),
    map((response: any) => {
      let users: any[] = [];
      
      if (response?.data?.results && Array.isArray(response.data.results)) {
        console.log('✅ Found paginated results');
        users = response.data.results;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('✅ Found direct data array');
        users = response.data;
      } else if (Array.isArray(response)) {
        console.log('✅ Response is direct array');
        users = response;
      } else {
        console.warn('⚠️ No users array found in response');
      }
      
      console.log('✅ Raw extracted users (first 2):', users.slice(0, 2));
      
      // Transform users with proper ObjectId handling
      const transformedUsers = users.map(user => {
        console.log('🔍 Raw user _id structure:', user._id);
        
        // Extract the actual ID string from the ObjectId format
        let userId: string;
        
        if (user._id && typeof user._id === 'object' && '$oid' in user._id) {
          // Handle MongoDB ObjectId format: { "$oid": "..." }
          userId = user._id.$oid;
        } else if (typeof user._id === 'string') {
          // Handle string ID
          userId = user._id;
        } else if (user.id) {
          // Fallback to id field
          userId = user.id;
        } else {
          // Generate a fallback ID to prevent crashes
          console.warn('⚠️ No valid ID found for user:', user);
          userId = `fallback-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const transformed = {
          _id: userId,
          user: userId, // Use the extracted ID
          username: user.username,
          userType: user.user_type || user.userType || 'user',
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname
        };
        
        console.log('🔍 Transformed user ID:', transformed._id);
        return transformed;
      });
      
      console.log('✅ Final transformed users count:', transformedUsers.length);
      console.log('🔍 First transformed user:', transformedUsers[0]);
      return transformedUsers;
    }),
    catchError((error: any) => {
      console.error('❌ Error in getUsers:', error);
      return of([]);
    })
  );
}
  
getClasses(): Observable<any[]> {
  console.log('🔍 Fetching classes from TaxisService...');
  
  const baseUrl = this.getBaseUrl();
  return this.http.get<any>(`${baseUrl}/taxis/messaging`).pipe(
    tap((response: any) => console.log('📦 Raw classes response:', response)),
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
      
      console.log('✅ Processed classes:', classes.length);
      
      // Transform class users with proper ObjectId handling
      const transformedClasses = classes.map(classItem => {
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
            userType: user.userType || user.user_type || 'user',
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
          };
        };
        
        return {
          _id: classItem._id,
          name: classItem.name,
          subject: classItem.subject || '',
          level: classItem.level || '',
          students: (classItem.students || []).map(transformClassUser),
          teachers: (classItem.teachers || []).map(transformClassUser)
        };
      });
      
      if (transformedClasses.length > 0) {
        console.log('📊 Sample transformed class:', {
          name: transformedClasses[0].name,
          students: transformedClasses[0].students?.length || 0,
          teachers: transformedClasses[0].teachers?.length || 0
        });
        console.log('🔍 Sample class user ID:', transformedClasses[0].students?.[0]?._id);
      }
      
      return transformedClasses;
    }),
    catchError((error: any) => {
      console.error('❌ Error in getClasses:', error);
      return of([]);
    })
  );
}
}