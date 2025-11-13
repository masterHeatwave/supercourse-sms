import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { SOCKET_URL } from '@config/endpoints';
import { AuthStoreService } from '@services/messaging/auth-store.service';
import { NotificationsWrapperService } from '../messaging/notifications-wrapper.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';

// ==========================================
// INTERFACES
// ==========================================

interface TypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

interface MessageReadEvent {
  messageId: string;
  userId: string;
  readAt: Date;
  chatId: string;
}

interface ChatUpdateEvent {
  chatId: string;
  userId: string;
  updates: any;
  timestamp: Date;
}

interface DeliveryStatus {
  messageId: string;
  userId: string;
  deliveredAt: Date;
}

export interface NotificationEvent {
  _id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  relatedUserId?: string;
  relatedChatId?: string;
  relatedMessageId?: string;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  public socket!: Socket;
  private destroy$ = new Subject<void>();
  private authService = inject(AuthStoreService);
  private platformId = inject(PLATFORM_ID);
  
  // Browser check
  private isBrowser: boolean;

  // ✅ Notification subjects
  private notifications$ = new BehaviorSubject<NotificationEvent | null>(null);
  private notificationMarkedRead$ = new BehaviorSubject<{ notificationId: string } | null>(null);
  
  // Connection status management
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  
  // Reconnection management
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private reconnectInterval = 5000;

  // Public observables
  public connectionStatus$ = this.connectionStatus.asObservable();
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  // Current user ID for notification updates
  private currentUserId: string = '';
  
  // ✅ Store tenantId from NgRx store
  private tenantId: string = '';
  
  store = inject(Store);

  public onNewNotification$ = this.notifications$
      .asObservable()
      .pipe(filter(n => n !== null)) as Observable<NotificationEvent>;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      console.log('🌐 Running in browser - initializing socket');
      
      // ✅ Subscribe to auth state to get tenantId
      this.store.select(selectAuthState).subscribe({
        next: (authState: any) => {
          console.log('🏢 TenantId (customerContext):', authState.customerContext);
          this.tenantId = authState.customerContext;
        }
      });
      
      this.initializeSocket();
      this.setupAuthSubscription();
    } else {
      console.log('🖥️ Running on server (SSR) - skipping socket initialization');
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  private setupAuthSubscription(): void {
    if (!this.isBrowser) return;
    
    this.authService.getCurrentUserID$()
      .pipe(
        takeUntil(this.destroy$),
        filter(userId => !!userId)
      )
      .subscribe(userId => {
        console.log('👤 User ID changed, re-authenticating socket:', userId);
        this.currentUserId = userId;
        
        if (this.socket?.connected && !this._isAuthenticated.value) {
          this.authenticate(userId);
        }
      });
  }

  private initializeSocket() {
    if (!this.isBrowser) {
      console.warn('⚠️ Cannot initialize socket - not in browser environment');
      return;
    }

    try {
      console.log('🔧 Initializing SocketService');
      console.log('🔧 SOCKET_URL:', SOCKET_URL);
      
      const cleanUrl = SOCKET_URL.replace(/\/$/, '');
      console.log('🔧 Clean Socket URL:', cleanUrl);
      
      this.socket = io(cleanUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 20000,
        autoConnect: true
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      this.connectionStatus.next(false);
      this._isAuthenticated.next(false);
    }
  }

  private setupSocketListeners() {
    if (!this.isBrowser || !this.socket) return;
  
    // ========== CONNECTION EVENTS ==========
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      console.log('📡 Socket ID:', this.socket.id);
      
      this.connectionStatus.next(true);
      this.reconnectAttempts = 0;
      
      this.authService.getCurrentUserID$()
        .pipe(take(1))
        .subscribe(userId => {
          console.log('🔍 Attempting to authenticate with userId:', userId);
          
          if (userId) {
            console.log('🔐 Auto-authenticating user:', userId);
            this.authenticate(userId);
          } else {
            console.warn('⚠️ No userId available for authentication');
          }
        });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connectionStatus.next(false);
      this._isAuthenticated.next(false);
      
      if (reason === 'io server disconnect') {
        setTimeout(() => this.socket.connect(), 1000);
      }
    });

    // ========== AUTHENTICATION EVENTS ==========
    this.socket.on('authenticated', (data: any) => {
      console.log('✅ Socket authenticated for user:', data.userId, 'tenant:', data.tenantId);
      this._isAuthenticated.next(true);

      // Ensure we store the current userId and join the notifications room
      if (data?.userId) {
        this.currentUserId = data.userId;
        try {
          // Ask the server to put this socket in the notifications room for this user
          this.socket.emit('joinNotifications', data.userId);
          console.log(`🔔 Requested to join notifications for user ${data.userId}`);
        } catch (err) {
          console.warn('⚠️ Failed to emit joinNotifications:', err);
        }
      }
    });

    this.socket.on('authenticationError', (error: any) => {
      console.error('❌ Authentication error:', error);
      this._isAuthenticated.next(false);
    });

    // ========== NOTIFICATION EVENTS ==========

    this.socket.on('notificationsJoined', (data: { userId: string; timestamp: Date }) => {
      console.log('🔔 Successfully joined notifications room:', data);
    });
    
    this.socket.on('newNotification', (notification: NotificationEvent) => {
      console.log('🔔 New notification (single global listener):', notification);
      this.notifications$.next(notification);
    });

    this.socket.on('notificationMarkedRead', (data: { notificationId: string }) => {
      console.log('📖 Notification marked as read:', data);
      this.notificationMarkedRead$.next(data);
    });

    // ========== RECONNECTION EVENTS ==========
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  authenticate(userId: string): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log('🔐 Authenticating socket for user:', userId);
      
      if (this._isAuthenticated.value) {
        resolve();
        return;
      }

      if (!this.socket?.connected) {
        console.warn('⚠️ Socket not connected, waiting for connection...');
        
        const connectionSub = this.connectionStatus$
          .pipe(
            filter(connected => connected),
            take(1)
          )
          .subscribe(() => {
            console.log('✅ Socket connected, proceeding with authentication');
            this.performAuthentication(userId, resolve, reject);
          });
        
        setTimeout(() => {
          connectionSub.unsubscribe();
          reject(new Error('Connection timeout'));
        }, 10000);
        
        return;
      }

      this.performAuthentication(userId, resolve, reject);
    });
  }

  /**
   * ✅ UPDATED: Send both userId AND tenantId to backend
   */
  private performAuthentication(
    userId: string, 
    resolve: () => void, 
    reject: (error: Error) => void
  ): void {
    if (!this.socket) {
      reject(new Error('Socket not initialized'));
      return;
    }

    // ✅ Check if tenantId is available
    if (!this.tenantId) {
      console.error('❌ No tenantId available for authentication');
      reject(new Error('TenantId not available'));
      return;
    }

    console.log('🔐 Authenticating with userId:', userId, 'tenantId:', this.tenantId);

    const onAuthenticated = (data: any) => {
      console.log('✅ Authentication successful:', data);
      this.socket.off('authenticationError', onAuthError);
      resolve();
    };
    
    const onAuthError = (error: any) => {
      console.error('❌ Authentication failed:', error);
      this.socket.off('authenticated', onAuthenticated);
      reject(error);
    };
    
    this.socket.once('authenticated', onAuthenticated);
    this.socket.once('authenticationError', onAuthError);
    
    // ✅ CRITICAL: Send BOTH userId and tenantId as an object
    this.socket.emit('authenticate', { userId, tenantId: this.tenantId });
    
    setTimeout(() => {
      this.socket.off('authenticated', onAuthenticated);
      this.socket.off('authenticationError', onAuthError);
      reject(new Error('Authentication timeout'));
    }, 5000);
  }

  // ==========================================
  // NOTIFICATION METHODS
  // ==========================================

  /**
   * ✅ Join notification room for user
   */
  joinNotifications(userId: string): void {
    if (!this.isBrowser || !this.socket?.connected) {
      console.warn('⚠️ Cannot join notifications - socket not connected');
      return;
    }
    this.socket.emit('joinNotifications', userId);
  }

  /**
   * ✅ Observable for new notifications
   */
  onNewNotification(): Observable<NotificationEvent> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<NotificationEvent>(observer => {
      const handler = (notification: NotificationEvent) => {
        console.log('🔔 Notification event emitted to subscribers:', notification);
        observer.next(notification);
      };
      
      this.socket.on('newNotification', handler);
      
      return () => {
        this.socket.off('newNotification', handler);
      };
    }).pipe(takeUntil(this.destroy$));
    
  }

  /**
   * ✅ Mark notification as read via socket
   */
  markNotificationAsRead(notificationId: string, userId: string): void {
    if (!this.isBrowser || !this.socket?.connected) {
      console.warn('⚠️ Cannot mark notification as read - socket not connected');
      return;
    }
    
    console.log('📖 Marking notification as read:', notificationId);
    this.socket.emit('markNotificationRead', { notificationId, userId });
  }

  /**
   * ✅ Observable for notification read confirmations
   */
  onNotificationMarkedRead(): Observable<{ notificationId: string }> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<{ notificationId: string }>(observer => {
      const handler = (data: { notificationId: string }) => {
        observer.next(data);
      };
      
      this.socket.on('notificationMarkedRead', handler);
      
      return () => {
        this.socket.off('notificationMarkedRead', handler);
      };
    }).pipe(takeUntil(this.destroy$));
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  isConnected(): boolean {
    if (!this.isBrowser) return false;
    return this.socket?.connected && this._isAuthenticated.value;
  }

  waitForConnection(timeoutMs: number = 10000): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        console.log('✅ Socket already connected and authenticated');
        resolve();
        return;
      }
      
      console.log('⏳ Waiting for socket connection and authentication...');
      
      let attempts = 0;
      const maxAttempts = timeoutMs / 100;
      
      const checkConnection = () => {
        attempts++;
        
        if (this.isConnected()) {
          console.log(`✅ Socket ready after ${attempts} attempts (${attempts * 100}ms)`);
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.error(`❌ Socket connection timeout after ${timeoutMs}ms`);
          console.error(`   - Connected: ${this.socket?.connected}`);
          console.error(`   - Authenticated: ${this._isAuthenticated.value}`);
          reject(new Error('Socket connection timeout'));
          return;
        }
        
        if (attempts % 10 === 0) {
          console.log(`⏳ Still waiting for socket... (${attempts * 100}ms elapsed)`);
          console.log(`   - Connected: ${this.socket?.connected}`);
          console.log(`   - Authenticated: ${this._isAuthenticated.value}`);
        }
        
        setTimeout(checkConnection, 100);
      };
      
      checkConnection();
    });
  }

  // ==========================================
  // CHAT MANAGEMENT
  // ==========================================

  joinChat(chatId: string): boolean {
    if (!this.isBrowser || !this.isConnected()) {
      console.warn('⚠️ Cannot join chat, socket not connected/authenticated');
      return false;
    }
    
    console.log('🚪 Joining chat room:', chatId);
    return this.emit('joinChat', chatId);
  }

  leaveChat(chatId: string): boolean {
    if (!this.isBrowser || !this.socket?.connected) {
      return false;
    }
    
    console.log('🚪 Leaving chat room:', chatId);
    return this.emit('leaveChat', chatId);
  }

  // ==========================================
  // MESSAGE EVENTS
  // ==========================================

  emitTyping(chatId: string, userId: string, isTyping: boolean = true): boolean {
    if (!this.isBrowser || !this.isConnected()) {
      return false;
    }
    
    return this.emit('typing', { chatId, userId, isTyping });
  }

  // ==========================================
  // CHAT FEATURE EVENTS
  // ==========================================

  emitChatUpdate(chatId: string, userId: string, updates: any): boolean {
    if (!this.isBrowser || !this.isConnected()) {
      console.warn('⚠️ Cannot emit chat update, socket not connected');
      return false;
    }
    
    return this.emit('chatUpdated', { 
      chatId, 
      userId, 
      updates, 
      timestamp: new Date() 
    });
  }

  emitChatFavorited(chatId: string, userId: string, isStarred: boolean): boolean {
    return this.emitChatUpdate(chatId, userId, { isStarred });
  }

  emitChatPinned(chatId: string, userId: string, isPinned: boolean): boolean {
    return this.emitChatUpdate(chatId, userId, { isPinned });
  }

  emitChatMuted(chatId: string, userId: string, isMuted: boolean): boolean {
    return this.emitChatUpdate(chatId, userId, { isMuted });
  }

  emitChatArchived(chatId: string, userId: string, isArchived: boolean): boolean {
    return this.emitChatUpdate(chatId, userId, { isArchived });
  }

  // ==========================================
  // EVENT LISTENERS (OBSERVABLES)
  // ==========================================
  
  listen(eventName: string): Observable<any> {
    if (!this.isBrowser) {
      return new Observable(subscriber => {
        subscriber.complete();
      });
    }

    return new Observable((subscriber) => {
      if (!this.socket?.connected) {
        console.warn(`⚠️ Socket not connected for event '${eventName}'. Waiting...`);
        
        this.connectionStatus$.pipe(
          filter(isConnected => isConnected),
          take(1),
          takeUntil(this.destroy$)
        ).subscribe(() => {
          console.log(`✅ Socket connected. Now listening to '${eventName}'`);
          this.setupListener(eventName, subscriber);
        });
        
        return () => {
          if (this.socket) {
            this.socket.off(eventName);
          }
        };
      }
  
      this.setupListener(eventName, subscriber);
      
      return () => {
        if (this.socket) {
          this.socket.off(eventName);
        }
      };
    });
  }
  
  private setupListener(eventName: string, subscriber: any): void {
    if (!this.socket) return;

    const eventHandler = (data: any) => {
      try {
        subscriber.next(data);
      } catch (error) {
        subscriber.error(error);
      }
    };
  
    this.socket.on(eventName, eventHandler);
  }

  // ✅ Convenience method for backward compatibility
  on(eventName: string): Observable<any> {
    return this.listen(eventName);
  }

  onNewMessage(): Observable<any> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable(observer => {
      const handler = (data: any) => {
        try {
          console.log('📨 Raw socket message received:', data);
          
          const processedData = {
            ...data,
            timestamp: new Date(data.timestamp),
            readBy: data.readBy?.map((readItem: any) => ({
              ...readItem,
              readAt: new Date(readItem.readAt)
            })) || []
          };
          
          observer.next(processedData);
        } catch (error) {
          console.error('❌ Error processing incoming message:', error);
          observer.error(error);
        }
      };

      this.socket.on('newMessage', handler);

      return () => {
        this.socket.off('newMessage', handler);
      };
    }).pipe(takeUntil(this.destroy$));
  }

  onTyping(): Observable<TypingEvent> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<TypingEvent>(observer => {
      const handler = (data: TypingEvent) => observer.next(data);
      this.socket.on('typing', handler);
      return () => this.socket.off('typing', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onUserOnline(): Observable<string> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<string>(observer => {
      const handler = (userId: string) => observer.next(userId);
      this.socket.on('userOnline', handler);
      return () => this.socket.off('userOnline', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onUserOffline(): Observable<string> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<string>(observer => {
      const handler = (userId: string) => observer.next(userId);
      this.socket.on('userOffline', handler);
      return () => this.socket.off('userOffline', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onMessageDelivered(): Observable<DeliveryStatus> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<DeliveryStatus>(observer => {
      const handler = (data: any) => observer.next({
        ...data,
        deliveredAt: new Date(data.deliveredAt)
      });
      this.socket.on('messageDelivered', handler);
      return () => this.socket.off('messageDelivered', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onMessageRead(): Observable<MessageReadEvent> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<MessageReadEvent>(observer => {
      const handler = (data: any) => observer.next({
        ...data,
        readAt: new Date(data.readAt)
      });
      this.socket.on('messageRead', handler);
      return () => this.socket.off('messageRead', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onMessageDeleted(): Observable<string> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<string>(observer => {
      const handler = (messageId: string) => observer.next(messageId);
      this.socket.on('messageDeleted', handler);
      return () => this.socket.off('messageDeleted', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  onChatUpdated(): Observable<ChatUpdateEvent> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.complete());
    }

    return new Observable<ChatUpdateEvent>(observer => {
      const handler = (data: ChatUpdateEvent) => {
        const event: ChatUpdateEvent = {
          ...data,
          timestamp: new Date(data.timestamp)
        };
        observer.next(event);
      };
      this.socket.on('chatUpdated', handler);
      return () => this.socket.off('chatUpdated', handler);
    }).pipe(takeUntil(this.destroy$));
  }

  // ==========================================
  // EVENT EMITTERS
  // ==========================================

  emit(eventName: string, data: any): boolean {
    if (!this.isBrowser) return false;

    try {
      if (!this.socket?.connected) {
        console.warn('⚠️ Socket is not connected. Cannot emit event:', eventName);
        return false;
      }
      
      if (!this._isAuthenticated.value && eventName !== 'authenticate') {
        console.warn('⚠️ Socket is not authenticated. Cannot emit event:', eventName);
        return false;
      }
      
      console.log(`📤 Emitting event: ${eventName}`, data);
      this.socket.emit(eventName, data);
      return true;
    } catch (error) {
      console.error('❌ Error emitting event:', error);
      return false;
    }
  }

  // ==========================================
  // ADVANCED FEATURES
  // ==========================================

  forceReauth(): void {
    if (!this.isBrowser) return;

    this.authService.getCurrentUserID$()
      .pipe(take(1))
      .subscribe(userId => {
        if (userId) {
          console.log('🔄 Forcing re-authentication for user:', userId);
          this._isAuthenticated.next(false);
          this.authenticate(userId).catch(error => {
            console.error('❌ Force re-auth failed:', error);
          });
        }
      });
  }

  reconnect(): void {
    if (!this.isBrowser) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log('🔄 Attempting to reconnect...');
      this.socket?.connect();
    }
  }

  getConnectionInfo(): any {
    if (!this.isBrowser) {
      return { isBrowser: false, message: 'Running in SSR mode' };
    }

    return {
      connected: this.socket?.connected || false,
      authenticated: this._isAuthenticated.value,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      userId: this.authService.getCurrentUserIDSync(),
      tenantId: this.tenantId, // ✅ Include tenantId
      reconnectAttempts: this.reconnectAttempts,
      socketUrl: SOCKET_URL,
      isBrowser: true
    };
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  disconnect(): void {
    if (!this.isBrowser) return;

    try {
      console.log('🔌 Manually disconnecting socket');
      if (this.socket) {
        this.socket.disconnect();
        this.connectionStatus.next(false);
        this._isAuthenticated.next(false);
      }
    } catch (error) {
      console.error('❌ Error disconnecting socket:', error);
    }
  }

  ngOnDestroy(): void {
    console.log('🧹 SocketService cleanup');
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}