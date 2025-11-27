// src/app/services/messaging/notifications-wrapper.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, Subject, Subscription } from 'rxjs';
import { map, catchError, tap, filter, shareReplay } from 'rxjs/operators';
import { MessagingService } from '../../gen-api/messaging/messaging.service';
import {
  Notification,
  NotificationResponse,
  NotificationActionResponse,
  NotificationType
} from '@components/messaging/models/notification.models';
import { SocketService } from '../socket/socket.service';

@Injectable({ providedIn: 'root' })
export class NotificationsWrapperService {
  private socketService = inject(SocketService);
  
  // Use shareReplay to ensure single subscription
  private notificationStream$ = new Subject<Notification>();
  public realTimeNotifications$ = this.notificationStream$.asObservable().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  
  // Unread count management
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Cache for notifications
  private notificationsCache: Notification[] = [];
  
  // Track subscriptions to prevent duplicates
  private socketListenersInitialized = false;
  private socketSubscription: Subscription | null = null;
  private readSubscription: Subscription | null = null;
  
  // Track processed notification IDs to prevent duplicates
  private processedNotificationIds = new Set<string>();
  private readonly MAX_PROCESSED_IDS = 100;

  constructor(private messagingService: MessagingService) {

  }

  /**
   * Initialize Socket.IO listeners for real-time notifications
   * Should be called once when user authenticates
   */
  initializeSocketListeners(): void {
    if (this.socketListenersInitialized) {
      return;
    }
    
    // ✅ Unsubscribe previous subscriptions if any
    this.cleanupSocketSubscriptions();
    
    // ✅ Listen for new notifications
    this.socketSubscription = this.socketService.onNewNotification()
      .pipe(
        filter(notification => {
          // ✅ Deduplicate by notification ID
          if (this.processedNotificationIds.has(notification._id)) {
            return false;
          }
          return true;
        })
      )
      .subscribe({
        next: (notification) => {
          try {
            
            // ✅ Mark as processed
            this.processedNotificationIds.add(notification._id);
            
            // ✅ Limit processed IDs set size
            if (this.processedNotificationIds.size > this.MAX_PROCESSED_IDS) {
              const idsArray = Array.from(this.processedNotificationIds);
              this.processedNotificationIds = new Set(idsArray.slice(-this.MAX_PROCESSED_IDS));
            }
    
            // Convert to Notification model
            const notificationObj: Notification = {
              _id: notification._id,
              userId: notification.userId,
              type: notification.type as any,
              title: notification.title,
              content: notification.content,
              createdAt: new Date(notification.createdAt),
              isRead: notification.isRead,
              isDeleted: false,
              relatedUserId: notification.relatedUserId,
              relatedChatId: notification.relatedChatId,
              relatedMessageId: notification.relatedMessageId
            };
            
            // ✅ Add to cache at the beginning
            this.notificationsCache.unshift(notificationObj);
            
            // ✅ Limit cache size
            if (this.notificationsCache.length > 100) {
              this.notificationsCache = this.notificationsCache.slice(0, 100);
            }
            
            // ✅ Emit to subscribers
            this.notificationStream$.next(notificationObj);
            
            // ✅ Increment unread count if notification is unread
            if (!notification.isRead) {
              const currentCount = this.unreadCountSubject.value;
              this.unreadCountSubject.next(currentCount + 1);
            }
          } catch (error) {
            console.error('❌ Error processing notification:', error);
          }
        },
        error: (err) => {
          console.error('❌ Error receiving real-time notification:', err);
        }
      });
    
    // ✅ Listen for notification read confirmations via Socket.IO
    this.readSubscription = this.socketService.onNotificationMarkedRead()
      .subscribe({
        next: (data) => {
          
          // ✅ Update cache
          const notification = this.notificationsCache.find(n => n._id === data.notificationId);
          if (notification && !notification.isRead) {
            notification.isRead = true;
            
            // ✅ Decrement unread count
            const currentCount = this.unreadCountSubject.value;
            if (currentCount > 0) {
              this.unreadCountSubject.next(currentCount - 1);
            }
          }
        },
        error: (err) => {
          console.error('❌ Error handling notification read event:', err);
        }
      });

    this.socketListenersInitialized = true;
  }

  /**
   * ✅ Cleanup socket subscriptions
   */
  private cleanupSocketSubscriptions(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
      this.socketSubscription = null;
    }
    if (this.readSubscription) {
      this.readSubscription.unsubscribe();
      this.readSubscription = null;
    }
  }

  /**
   * ✅ Join notification room when user authenticates
   */
  joinNotificationRoom(userId: string): void {
    if (!userId) {
      console.warn('⚠️ Cannot join notification room: No userId provided');
      return;
    }
    
    this.socketService.joinNotifications(userId);
    
    // ✅ Initialize socket listeners if not already done
    if (!this.socketListenersInitialized) {
      this.initializeSocketListeners();
    }
  }

  /**
   * ✅ Get notifications (HTTP - for initial load only)
   */
  getNotifications(userId: string, page = 1, limit = 20): Observable<NotificationResponse> {
    const params: any = { page, limit };
    if (userId) params.userId = userId;

    return this.messagingService.getMessagingNotifications(params).pipe(
      map((response: any) => {
        // ✅ Update unread count if provided by backend
        if (response && typeof response.unreadCount !== 'undefined') {
          this.unreadCountSubject.next(response.unreadCount);
        }
        
        // ✅ Update cache with fetched notifications (only on first page)
        if (page === 1 && response.notifications) {
          this.notificationsCache = response.notifications;
        } else if (page > 1 && response.notifications) {
          this.notificationsCache = [...this.notificationsCache, ...response.notifications];
        }
        
        return {
          success: response.success ?? true,
          notifications: response.notifications || [],
          totalCount: response.totalCount || 0,
          unreadCount: response.unreadCount || 0,
          currentPage: response.currentPage || page,
          totalPages: response.totalPages || 1,
          hasMore: response.hasMore || false
        };
      }),
      catchError((err) => {
        console.error('❌ getNotifications error:', err);
        throw err;
      })
    );
  }

  /**
   * ✅ Get cached notifications
   */
  getCachedNotifications(): Notification[] {
    return [...this.notificationsCache];
  }

  /**
   * ✅ Get unread count from server
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.getNotifications(userId, 1, 1).pipe(map(res => res.unreadCount));
  }

  /**
   * ✅ Refresh unread count from server
   */
  refreshUnreadCount(userId: string): void {
    if (!userId) {
      console.warn('🔔 refreshUnreadCount called without userId');
      return;
    }
    
    this.getUnreadCount(userId).subscribe({
      next: (count: number) => {
        this.unreadCountSubject.next(count);
      },
      error: (err) => {
        console.error('❌ refreshUnreadCount failed:', err);
      }
    });
  }

  /**
   * ✅ Mark notification as read
   */
  markAsRead(notificationId: string, userId: string): Observable<NotificationActionResponse> {
    // ✅ Optimistically update cache
    const notification = this.notificationsCache.find(n => n._id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      
      // ✅ Optimistically decrement unread count
      const currentCount = this.unreadCountSubject.value;
      if (currentCount > 0) {
        this.unreadCountSubject.next(currentCount - 1);
      }
    }
    
    // ✅ Emit socket event for real-time update
    this.socketService.markNotificationAsRead(notificationId, userId);
    
    // ✅ Call HTTP endpoint to persist
    return this.messagingService.patchMessagingNotificationsIdRead(notificationId).pipe(
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message,
        data: response.data
      } as NotificationActionResponse)),
      catchError(err => {
        console.error('❌ markAsRead failed:', err);
        
        // ✅ Revert optimistic update
        if (notification) {
          notification.isRead = false;
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(currentCount + 1);
        }
        
        throw err;
      })
    );
  }

  markAllAsRead(userId: string): Observable<NotificationActionResponse> {
    
    this.notificationsCache.forEach(n => n.isRead = true);
    const previousCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(0);
    
    return this.messagingService.postMessagingNotificationsReadAll().pipe(
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'All marked',
        modifiedCount: response.modifiedCount
      })),
      catchError(err => {
        console.error('❌ markAllAsRead failed:', err);
        this.unreadCountSubject.next(previousCount);
        throw err;
      })
    );
  }

  deleteNotification(notificationId: string, userId: string): Observable<NotificationActionResponse> {
    
    const index = this.notificationsCache.findIndex(n => n._id === notificationId);
    let removedNotification: Notification | null = null;
    
    if (index !== -1) {
      removedNotification = this.notificationsCache[index];
      const wasUnread = !removedNotification.isRead;
      
      this.notificationsCache.splice(index, 1);
      
      if (wasUnread) {
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      }
    }
    
    return this.messagingService.deleteMessagingNotificationsId(notificationId).pipe(
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'Deleted',
        data: response.data
      } as NotificationActionResponse)),
      catchError(err => {
        console.error('❌ deleteNotification failed:', err);
        
        if (removedNotification) {
          this.notificationsCache.splice(index, 0, removedNotification);
          if (!removedNotification.isRead) {
            const currentCount = this.unreadCountSubject.value;
            this.unreadCountSubject.next(currentCount + 1);
          }
        }
        
        throw err;
      })
    );
  }

  clearAllNotifications(userId: string): Observable<NotificationActionResponse> {
    const previousCache = [...this.notificationsCache];
    const previousCount = this.unreadCountSubject.value;
    
    this.notificationsCache = [];
    this.unreadCountSubject.next(0);
    
    return this.messagingService.postMessagingNotificationsClear().pipe(
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'Cleared',
        modifiedCount: response.modifiedCount
      } as NotificationActionResponse)),
      catchError(err => {
        console.error('❌ clearAllNotifications failed:', err);
        this.notificationsCache = previousCache;
        this.unreadCountSubject.next(previousCount);
        throw err;
      })
    );
  }

  getNotificationsByType(
    userId: string,
    type: NotificationType,
    page = 1,
    limit = 10
  ): Observable<NotificationResponse> {
    const params: any = { page, limit };
    if (userId) params.userId = userId;

    return this.messagingService.getMessagingNotificationsTypeType(type, params).pipe(
      map((response: any) => ({
        success: response.success ?? true,
        notifications: response.notifications || [],
        totalCount: response.totalCount || 0,
        unreadCount: response.unreadCount || 0,
        currentPage: response.currentPage || page,
        totalPages: response.totalPages || 1,
        hasMore: (response.currentPage || page) < (response.totalPages || 1)
      })),
      catchError(err => {
        console.error('❌ getNotificationsByType failed:', err);
        throw err;
      })
    );
  }

  createSystemNotification(userIds: string[], title: string, content: string): Observable<any> {
    return this.messagingService.postMessagingNotificationsSystem({ userIds, title, content });
  }

  /**
   * ✅ Reset service state (useful for logout)
   */
  resetState(): void {
    this.cleanupSocketSubscriptions();
    this.notificationsCache = [];
    this.unreadCountSubject.next(0);
    this.socketListenersInitialized = false;
    this.processedNotificationIds.clear();
  }
}