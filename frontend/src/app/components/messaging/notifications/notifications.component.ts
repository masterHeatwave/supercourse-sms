// notifications.component.ts 
import { Component, Input, OnInit, OnDestroy, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { OverlayPanel } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationsWrapperService } from '@services/messaging/notifications-wrapper.service';
import { SocketService } from '@services/socket/socket.service'; // ✅ ADD THIS
import { Notification } from '@components/messaging/models/notification.models';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, BadgeModule, ButtonModule, OverlayPanelModule, TooltipModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('notificationPanel') notificationPanel!: OverlayPanel;
  @Input() currentUserId: string = '';
  
  unreadCount = 0;
  notifications: Notification[] = [];
  loading = false;
  hasMore = false;
  currentPage = 1;
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>(); 

  constructor(
    private notificationsService: NotificationsWrapperService,
    private socketService: SocketService, 
    private http: HttpClient
  ) {}

  get badgeValue(): string {
    return this.unreadCount > 0 ? this.unreadCount.toString() : '';
  }

  isPopulatedUser(relatedUserId: any): boolean {
    return relatedUserId && typeof relatedUserId === 'object' && 'username' in relatedUserId;
  }

  isPopulatedChat(relatedChatId: any): boolean {
    return relatedChatId && typeof relatedChatId === 'object' && 'name' in relatedChatId;
  }

  getRelatedUsername(relatedUserId: any): string {
    if (this.isPopulatedUser(relatedUserId)) {
      return relatedUserId.username || 'Unknown User';
    }
    return 'Unknown User';
  }

  getRelatedChatName(relatedChatId: any): string {
    if (this.isPopulatedChat(relatedChatId)) {
      return relatedChatId.name || 'Unknown Chat';
    }
    return 'Unknown Chat';
  }

  ngOnInit(): void {
    console.log('🔔 NotificationsComponent initialized with userId:', this.currentUserId);
    
    // Subscribe to unread count updates
    const unreadSub = this.notificationsService.unreadCount$.subscribe(
      (count: number) => {
        this.unreadCount = count;
        console.log('🔔 Unread count updated:', count);
      }
    );
    this.subscriptions.push(unreadSub);
  
    if (this.currentUserId) {
      this.refreshData();
      this.createWelcomeNotificationIfNeeded();
      this.setupSocketListeners(); // ✅ ADD THIS
    } else {
      console.warn('⚠️ NotificationsComponent: No currentUserId provided!');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUserId']) {
      console.log('🔔 UserId changed:', changes['currentUserId'].currentValue);
      
      if (this.currentUserId && !changes['currentUserId'].firstChange) {
        this.refreshData();
        this.setupSocketListeners(); // ✅ Re-setup sockets with new userId
      } else if (!this.currentUserId) {
        this.notifications = [];
        this.unreadCount = 0;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next(); // ✅ Clean up socket subscriptions
    this.destroy$.complete();
  }

  // ✅ NEW: Set up Socket.IO listeners for real-time notifications
  private setupSocketListeners(): void {
    if (!this.currentUserId) {
      console.warn('🔔 Cannot setup socket listeners: No userId');
      return;
    }

    console.log('🔔 Setting up socket listeners for notifications...');

    // Listen for new notifications
    this.socketService.on('newNotification')
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: any) => {
        console.log('🔔 Socket: New notification received', notification);
        
        // Add notification to the top of the list
        this.notifications.unshift(notification as Notification);
        
        // Increment unread count
        this.unreadCount++;
        
        // Show a toast or alert if needed
        this.showNotificationToast(notification);
      });

    // Listen for notification read events
    this.socketService.on('notificationRead')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('🔔 Socket: Notification marked as read', data);
        
        const notification = this.notifications.find(n => n._id === data.notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });

    // Listen for notification deleted events
    this.socketService.on('notificationDeleted')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('🔔 Socket: Notification deleted', data);
        
        this.notifications = this.notifications.filter(n => n._id !== data.notificationId);
      });

    console.log('✅ Socket listeners set up for notifications');
  }

  // ✅ NEW: Show notification toast (optional)
  private showNotificationToast(notification: any): void {
    // You can integrate with PrimeNG Toast here
    console.log('🔔 New notification:', notification.title);
    
    // Example: Play notification sound
    // this.playNotificationSound();
  }

  private refreshData(): void {
    if (!this.currentUserId) {
      console.warn('🔔 Cannot refresh notifications - no userId');
      return;
    }
    
    console.log('🔔 Refreshing notification data for user:', this.currentUserId);
    this.notificationsService.refreshUnreadCount(this.currentUserId);
    this.loadNotifications(1);
  }
  
  onPanelShow(): void {
    this.error = null;
    
    if (!this.currentUserId) {
      console.warn('🔔 No userId when opening notifications panel');
      this.error = 'User not authenticated';
      return;
    }
    
    console.log('🔔 Notification panel opened for user:', this.currentUserId);
    this.notificationsService.refreshUnreadCount(this.currentUserId);
    
    if (this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  toggleNotificationPanel(event: Event): void {
    this.notificationPanel.toggle(event);
  }

  onPanelHide(): void {
    console.log('🔔 Notification panel closed');
  }

  loadNotifications(page: number = 1): void {
    if (!this.currentUserId) {
      this.error = 'User ID not available';
      console.error('🔔 Cannot load notifications: No userId');
      return;
    }
  
    this.loading = true;
    this.error = null;
    
    console.log(`🔔 Loading notifications - Page: ${page}, UserId: ${this.currentUserId}`);
    
    this.notificationsService.getNotifications(this.currentUserId, page, 20).subscribe({
      next: (response) => {
        console.log('🔔 Notifications loaded:', response);
        
        if (response.success) {
          if (page === 1) {
            this.notifications = response.notifications;
          } else {
            this.notifications.push(...response.notifications);
          }
          
          this.hasMore = response.hasMore;
          this.currentPage = response.currentPage;
          this.unreadCount = response.unreadCount;
        } else {
          this.error = 'Failed to load notifications';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('🔔 Error loading notifications:', error);
        this.error = 'Failed to load notifications. Please try again.';
        this.loading = false;
      }
    });
  }

  // ... rest of your methods (markAsRead, deleteNotification, etc.) remain the same ...

  loadMore(): void {
    if (this.hasMore && !this.loading) {
      console.log('🔔 Loading more notifications...');
      this.loadNotifications(this.currentPage + 1);
    }
  }

  markAsRead(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();
    const notification = this.notifications.find(n => n._id === notificationId);
    if (!notification || notification.isRead) return;
    if (!this.currentUserId) return;
    
    this.notificationsService.markAsRead(notificationId, this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        }
      },
      error: (error: any) => console.error('🔔 Error marking notification as read:', error)
    });
  }
  
  markAllAsRead(): void {
    if (this.unreadCount === 0 || !this.currentUserId) return;
    
    this.notificationsService.markAllAsRead(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(n => {
            if (!n.isRead) {
              n.isRead = true;
              n.readAt = new Date().toISOString();
            }
          });
        }
      },
      error: (error: any) => console.error('🔔 Error marking all as read:', error)
    });
  }

  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();
    if (!this.currentUserId) return;
    
    this.notificationsService.deleteNotification(notificationId, this.currentUserId).subscribe({  
      next: (response) => {  
        if (response.success) {
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
          this.notificationsService.refreshUnreadCount(this.currentUserId);
          if (this.notifications.length === 0) this.loadNotifications(1);
        }
      },
      error: (error: any) => console.error('🔔 Error deleting notification:', error)
    });
  }

  clearAllNotifications(): void {
    if (this.notifications.length === 0 || !this.currentUserId) return;
    
    this.notificationsService.clearAllNotifications(this.currentUserId).subscribe({  
      next: (response) => {
        if (response.success) {
          this.notifications = [];
          this.notificationPanel.hide();
        }
      },
      error: (error: any) => console.error('🔔 Error clearing all notifications:', error)
    });
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      message: 'pi pi-envelope',
      mention: 'pi pi-at',
      system: 'pi pi-cog',
      chat_invite: 'pi pi-users',
      user_online: 'pi pi-circle-fill text-green-500',
      user_offline: 'pi pi-circle text-gray-400'
    };
    return icons[type] || 'pi pi-bell';
  }

  getNotificationIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      message: '#3B82F6',
      mention: '#F59E0B',
      system: '#6B7280',
      chat_invite: '#10B981',
      user_online: '#22C55E',
      user_offline: '#9CA3AF'
    };
    return colors[type] || '#6B7280';
  }

  formatTime(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) this.markAsRead(notification._id);
    this.handleNotificationAction(notification);
  }

  private handleNotificationAction(notification: Notification): void {
    // Handle navigation based on notification type
    console.log('🔔 Notification clicked:', notification);
  }

  retryLoading(): void {
    this.error = null;
    this.loadNotifications(1);
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }

  private createWelcomeNotificationIfNeeded(): void {
    if (!this.currentUserId) return;
    
    this.notificationsService.getNotifications(this.currentUserId, 1, 1).subscribe({
      next: (response) => {
        if (response.totalCount === 0) {
          this.createWelcomeNotification();
        }
      },
      error: (error) => console.error('❌ Error checking notifications:', error)
    });
  }

  private createWelcomeNotification(): void {
    const baseUrl = this.getBaseUrl();
    
    this.http.post(`${baseUrl}/messaging/notifications/welcome`, {
      userId: this.currentUserId
    }).subscribe({
      next: () => this.refreshData(),
      error: (error) => console.error('❌ Error creating welcome notification:', error)
    });
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
}