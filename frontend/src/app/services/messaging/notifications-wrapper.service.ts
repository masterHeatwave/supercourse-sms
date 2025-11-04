import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { MessagingService } from '../../gen-api/messaging/messaging.service';
import { 
  Notification, 
  NotificationResponse,
  NotificationActionResponse,
  NotificationType 
} from '@components/messaging/models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsWrapperService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private messagingService: MessagingService) {}

  /**
   * Get notifications for a user with pagination
   * Backend: GET /messaging/notifications?userId=xxx&page=1&limit=20
   * 
   * ✅ FIXED: Pass userId as a separate query parameter
   */
  getNotifications(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Observable<NotificationResponse> {
    // ✅ Create params object with all parameters
    const params: any = {
      page: page,
      limit: limit
    };

    // ✅ Add userId to params - backend controller reads from req.query.userId
    if (userId) {
      params.userId = userId;
    }

    return this.messagingService.getMessagingNotifications(params).pipe(
      map((response: any) => {
        console.log('🔔 Raw notification response:', response);
        
        // Update unread count from response
        if (response.unreadCount !== undefined) {
          this.unreadCountSubject.next(response.unreadCount);
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
      catchError((error) => {
        console.error('❌ Error fetching notifications:', error);
        throw error;
      })
    );
  }

  /**
   * Get unread notifications count
   * Backend: GET /messaging/notifications/unread/count?userId=xxx
   * 
   * ✅ FIXED: The backend endpoint might not accept userId, 
   * so we'll use getNotifications with limit 1 to get the count
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.getNotifications(userId, 1, 1).pipe(
      map(response => response.unreadCount)
    );
  }

  /**
   * Refresh unread count and update the subject
   */
  refreshUnreadCount(userId: string): void {
    if (!userId) {
      console.warn('🔔 Cannot refresh unread count: No userId provided');
      return;
    }

    this.getUnreadCount(userId).subscribe({
      next: (count: number) => {
        console.log('🔔 Unread count refreshed:', count);
        this.unreadCountSubject.next(count);
      },
      error: (error) => {
        console.error('🔔 Error refreshing unread count:', error);
      }
    });
  }

  /**
   * Mark a single notification as read
   * Backend: PATCH /messaging/notifications/:id/read
   * 
   * Note: Backend gets userId from req.user.id (auth middleware)
   * or req.body.userId, so we don't need to pass it in the URL
   */
  markAsRead(notificationId: string, userId: string): Observable<NotificationActionResponse> {
    return this.messagingService.patchMessagingNotificationsIdRead(notificationId).pipe(
      tap(() => {
        console.log('🔔 Notification marked as read, refreshing count');
        this.refreshUnreadCount(userId);
      }),
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'Notification marked as read',
        data: response.data
      })),
      catchError((error) => {
        console.error('❌ Error marking notification as read:', error);
        throw error;
      })
    );
  }

  /**
   * Mark all notifications as read
   * Backend: POST /messaging/notifications/read/all
   */
  markAllAsRead(userId: string): Observable<NotificationActionResponse> {
    return this.messagingService.postMessagingNotificationsReadAll().pipe(
      tap(() => {
        console.log('🔔 All notifications marked as read');
        // Update unread count to 0 immediately
        this.unreadCountSubject.next(0);
      }),
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'All notifications marked as read',
        modifiedCount: response.modifiedCount
      })),
      catchError((error) => {
        console.error('❌ Error marking all as read:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a single notification (soft delete)
   * Backend: DELETE /messaging/notifications/:id
   */
  deleteNotification(notificationId: string, userId: string): Observable<NotificationActionResponse> {
    return this.messagingService.deleteMessagingNotificationsId(notificationId).pipe(
      tap(() => {
        console.log('🔔 Notification deleted, refreshing count');
        this.refreshUnreadCount(userId);
      }),
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'Notification deleted',
        data: response.data
      })),
      catchError((error) => {
        console.error('❌ Error deleting notification:', error);
        throw error;
      })
    );
  }

  /**
   * Clear all notifications for a user (soft delete all)
   * Backend: POST /messaging/notifications/clear
   */
  clearAllNotifications(userId: string): Observable<NotificationActionResponse> {
    return this.messagingService.postMessagingNotificationsClear().pipe(
      tap(() => {
        console.log('🔔 All notifications cleared');
        // Update unread count to 0 immediately
        this.unreadCountSubject.next(0);
      }),
      map((response: any) => ({
        success: response.success ?? true,
        message: response.message || 'All notifications cleared',
        modifiedCount: response.modifiedCount
      })),
      catchError((error) => {
        console.error('❌ Error clearing notifications:', error);
        throw error;
      })
    );
  }

  /**
   * Get notifications by type
   * Backend: GET /messaging/notifications/type/:type?userId=xxx&page=1&limit=10
   */
  getNotificationsByType(
    userId: string,
    type: NotificationType,
    page: number = 1,
    limit: number = 10
  ): Observable<NotificationResponse> {
    // ✅ Create params with userId
    const params: any = {
      page: page,
      limit: limit
    };

    if (userId) {
      params.userId = userId;
    }

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
      catchError((error) => {
        console.error('❌ Error fetching notifications by type:', error);
        throw error;
      })
    );
  }

  /**
   * Create system notification (admin only)
   * Backend: POST /messaging/notifications/system
   */
  createSystemNotification(
    userIds: string[],
    title: string,
    content: string
  ): Observable<NotificationActionResponse> {
    return this.messagingService.postMessagingNotificationsSystem({
      userIds,
      title,
      content
    }).pipe(
      map((response: any) => ({
        success: response.success ?? true,
        message: 'System notification created',
        data: response.data
      })),
      catchError((error) => {
        console.error('❌ Error creating system notification:', error);
        throw error;
      })
    );
  }
}