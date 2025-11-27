// src/app/components/messaging/notifications/notifications.component.ts

import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { NotificationsWrapperService } from '../../../services/messaging/notifications-wrapper.service';
import { Subject, takeUntil, filter } from 'rxjs';
import { Notification } from '../models/notification.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    BadgeModule,
    OverlayPanelModule,
    ScrollPanelModule,
    RippleModule,
    TooltipModule,
    SkeletonModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() currentUserId: string = '';
  @ViewChild('notificationPanel') notificationPanel!: OverlayPanel;

  // ✅ Notifications state
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  error: string | null = null;
  
  // ✅ Pagination
  currentPage = 1;
  totalPages = 1;
  hasMore = false;
  
  // ✅ Lifecycle management
  private destroy$ = new Subject<void>();
  
  // ✅ Flags
  private hasLoadedInitialNotifications = false;

  private isComponentInitialized = false;

  constructor(
    private notificationsService: NotificationsWrapperService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🔔 NotificationsComponent constructed');
  }

  ngOnInit(): void {
    
    if (!this.currentUserId) {
      console.error('❌ NotificationsComponent: No currentUserId provided');
      return;
    }

    // ✅ Prevent multiple initializations
    if (this.isComponentInitialized) {
      return;
    }

    // ✅ STEP 1: Join notification room via Socket.IO
    this.joinNotificationRoom();

    // ✅ STEP 2: Setup real-time listeners
    this.setupRealtimeListeners();

    // ✅ STEP 3: Load initial notifications (HTTP - one time only)
    this.loadInitialNotifications();
    
    this.isComponentInitialized = true;
  }

  ngOnDestroy(): void {
    console.log('🧹 NotificationsComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // ✅ INITIALIZATION
  // ==========================================

  /**
   * ✅ Join notification room via Socket.IO
   */
  private joinNotificationRoom(): void {
    console.log('🔔 Joining notification room for user:', this.currentUserId);
    this.notificationsService.joinNotificationRoom(this.currentUserId);
  }

  /**
   * ✅ Setup real-time Socket.IO listeners
   */
  private setupRealtimeListeners(): void {

    // ✅ Listen for NEW NOTIFICATIONS via Socket.IO
    this.notificationsService.realTimeNotifications$
      .pipe(
        takeUntil(this.destroy$),
        filter(notification => !!notification) // Only process valid notifications
      )
      .subscribe({
        next: (notification: Notification) => {
          
          // ✅ Verify this notification is for current user
          if (notification.userId === this.currentUserId) {
            // ✅ Add to the TOP of notifications array
            this.notifications = [notification, ...this.notifications];
            
            // ✅ Trigger change detection
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Received notification for different user:', notification.userId);
          }
        },
        error: (err) => {
          console.error('❌ Error in real-time notification stream:', err);
        }
      });

    // ✅ Subscribe to UNREAD COUNT changes
    this.notificationsService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count: number) => {
          console.log('🔔 Unread count updated:', count);
          this.unreadCount = count;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * ✅ Load initial notifications (HTTP - one time only on component init)
   */
  private loadInitialNotifications(): void {
    if (this.hasLoadedInitialNotifications) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.notificationsService.getNotifications(this.currentUserId, 1, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          
          this.notifications = response.notifications || [];
          this.unreadCount = response.unreadCount || 0;
          this.currentPage = response.currentPage || 1;
          this.totalPages = response.totalPages || 1;
          this.hasMore = response.hasMore || false;
          this.isLoading = false;
          this.hasLoadedInitialNotifications = true;
          
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error loading initial notifications:', error);
          this.error = 'Failed to load notifications. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // ✅ DATA LOADING (HTTP - for pagination only)
  // ==========================================

  /**
   * ✅ Load more notifications (pagination)
   */
  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      
      this.isLoading = true;
      const nextPage = this.currentPage + 1;

      this.notificationsService.getNotifications(this.currentUserId, nextPage, 20)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            
            // ✅ Append to existing notifications
            this.notifications = [...this.notifications, ...(response.notifications || [])];
            
            this.currentPage = response.currentPage || nextPage;
            this.totalPages = response.totalPages || 1;
            this.hasMore = response.hasMore || false;
            this.isLoading = false;
            
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('❌ Error loading more notifications:', error);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * ✅ Refresh notifications list (reload from server)
   */
  refreshNotifications(): void {
    this.hasLoadedInitialNotifications = false;
    this.currentPage = 1;
    this.loadInitialNotifications();
  }

  /**
   * ✅ Retry loading after error
   */
  retryLoading(): void {
    console.log('🔄 Retrying notification load');
    this.error = null;
    this.loadInitialNotifications();
  }

  // ==========================================
  // ✅ NOTIFICATION ACTIONS
  // ==========================================

  /**
   * ✅ Mark notification as read
   */
  markAsRead(notificationId: string, event: Event): void {
    event.stopPropagation();

    const notification = this.notifications.find(n => n._id === notificationId);
    if (!notification || notification.isRead) {
      return;
    }

    // ✅ Call service - it handles both socket emission and HTTP persistence
    this.notificationsService.markAsRead(notificationId, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Note: The service already updated the cache and unread count optimistically
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error marking notification as read:', error);
          // Note: The service already reverted optimistic changes
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * ✅ Mark all notifications as read
   */
  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      return;
    }

    this.notificationsService.markAllAsRead(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Note: Service already updated cache optimistically
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error marking all as read:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * ✅ Delete single notification
   */
  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();

    this.notificationsService.deleteNotification(notificationId, this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          
          // ✅ Remove from local array
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
          
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error deleting notification:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * ✅ Clear all notifications
   */
  clearAllNotifications(): void {
    if (this.notifications.length === 0) {
      return;
    }

    this.notificationsService.clearAllNotifications(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          
          // ✅ Clear local array
          this.notifications = [];
          
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error clearing notifications:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * ✅ Handle notification click
   */
  onNotificationClick(notification: Notification): void {

    // ✅ Mark as read if unread
    if (!notification.isRead) {
      this.markAsRead(notification._id, new Event('click'));
    }

    // ✅ Navigate to related chat if exists
    if (notification.relatedChatId) {
      // TODO: Emit event to parent component to open chat
      // this.navigateToChat.emit(notification.relatedChatId);
    }

    // ✅ Close panel
    if (this.notificationPanel) {
      this.notificationPanel.hide();
    }
  }

  // ==========================================
  // ✅ PANEL CONTROLS
  // ==========================================

  /**
   * ✅ Toggle notification panel
   */
  toggleNotificationPanel(event: Event): void {
    if (this.notificationPanel) {
      this.notificationPanel.toggle(event);
    }
  }

  /**
   * ✅ Panel show handler
   */
  onPanelShow(): void {
    // Real-time updates are already active, no need to refresh
  }

  onPanelHide(): void {
    // No action needed on hide

  }


  // ==========================================
  // ✅ UI HELPERS
  // ==========================================

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'MESSAGE': 'pi pi-envelope',
      'SYSTEM': 'pi pi-info-circle',
      'MENTION': 'pi pi-at',
      'REACTION': 'pi pi-heart',
      'CHAT': 'pi pi-comments',
      'USER': 'pi pi-user',
    };
    return icons[type] || 'pi pi-bell';
  }

  /**
   * Get notification icon color based on type
   */
  getNotificationIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      'MESSAGE': '#3b82f6',
      'SYSTEM': '#8b5cf6',
      'MENTION': '#f59e0b',
      'REACTION': '#ef4444',
      'CHAT': '#10b981',
      'USER': '#6366f1',
    };
    return colors[type] || '#6b7280';
  }

  /**
   * Format timestamp relative to now
   */
  formatTime(date: Date | string): string {
    const now = new Date();
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }

    return notificationDate.toLocaleDateString();
  }

  /**
   * Get short preview of notification content
   */
  getShortContent(content: string, maxLength: number = 60): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Check if there are any notifications
   */
  hasNotifications(): boolean {
    return this.notifications.length > 0;
  }

  /**
   * Check if there are any unread notifications
   */
  hasUnreadNotifications(): boolean {
    return this.unreadCount > 0;
  }

  /**
   * Get badge display value
   */
  get badgeValue(): string {
    if (this.unreadCount === 0) return '';
    if (this.unreadCount > 99) return '99+';
    return this.unreadCount.toString();
  }

  /**
   * Get empty state message
   */
  getEmptyStateMessage(): string {
    return this.isLoading 
      ? 'Loading notifications...' 
      : 'No notifications yet';
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }

  /**
   * Type guard for populated user
   */
  isPopulatedUser(relatedUserId: any): boolean {
    return relatedUserId && typeof relatedUserId === 'object' && 'username' in relatedUserId;
  }

  /**
   * Get related username
   */
  getRelatedUsername(relatedUserId: any): string {
    if (this.isPopulatedUser(relatedUserId)) {
      return relatedUserId.username || 'Unknown User';
    }
    return '';
  }

  /**
   * Type guard for populated chat
   */
  isPopulatedChat(relatedChatId: any): boolean {
    return relatedChatId && typeof relatedChatId === 'object' && ('name' in relatedChatId || 'type' in relatedChatId);
  }

  /**
   * Get related chat name
   */
  getRelatedChatName(relatedChatId: any): string {
    if (this.isPopulatedChat(relatedChatId)) {
      return relatedChatId.name || `${relatedChatId.type} chat` || 'Chat';
    }
    return '';
  }

  /**
   * Check if loading
   */
  get loading(): boolean {
    return this.isLoading;
  }
}