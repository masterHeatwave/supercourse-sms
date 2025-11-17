// src/app/components/messaging/messaging-container/messaging-container.component.ts

import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize, filter, take } from 'rxjs/operators';
import { AuthStoreService } from '@services/messaging/auth-store.service';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { Chat } from '../models/chat.models';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MessagingWrapperService } from '@services/messaging/messaging-wrapper.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { MenuItem } from 'primeng/api';
import { TabMenuModule } from "primeng/tabmenu";
import { SocketService } from '@services/socket/socket.service';
import { NotificationsWrapperService } from '@services/messaging/notifications-wrapper.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-messaging-container',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ChatListComponent,
    ChatWindowComponent,
    SidebarModule,
    ButtonModule,
    TranslateModule,
    NotificationsComponent,
    TabMenuModule
  ],
  providers: [MessageService],
  templateUrl: './messaging-container.component.html',
  styleUrls: ['./messaging-container.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MessagingContainerComponent implements OnInit, OnDestroy {
  // ✅ User state
  currentUserId: string = '';
  
  // ✅ Chat state
  selectedChat: Chat | null = null;
  chats: Chat[] = [];
  
  // ✅ UI state
  isVisible: boolean = false;
  isLoading: boolean = false;
  items: MenuItem[] = [];
  activeItem: MenuItem | undefined;
  
  // ✅ Lifecycle management
  private destroy$ = new Subject<void>();
  
  // ✅ Flags
  private hasLoadedInitialChats = false;
  private socketListenersInitialized = false;

  constructor(
    private authStore: AuthStoreService, 
    private messageService: MessageService,
    private messagingWrapper: MessagingWrapperService,
    private socketService: SocketService,
    private translate: TranslateService,
    private notificationsService: NotificationsWrapperService 
  ) {
    console.log('🏗️ MessagingContainerComponent constructed');
  }

  ngOnInit(): void {
    console.log('🚀 MessagingContainerComponent ngOnInit started');

    // ✅ Initialize tab menu
    this.initializeTabMenu();
    
    // ✅ Subscribe to user authentication changes
    this.subscribeToAuthChanges();
  }

  ngOnDestroy(): void {
    console.log('🧹 MessagingContainerComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // ✅ INITIALIZATION
  // ==========================================

  /**
   * ✅ Initialize tab menu items
   */
  private initializeTabMenu(): void {
    combineLatest([
      this.translate.stream('messages.tabs.chats'),
      this.translate.stream('messages.tabs.files')
    ]).subscribe(([chats, files]) => {
      this.items = [
        { label: chats,  icon: 'pi pi-comments', command: () => this.onTabChange('chats') },
        { label: files, icon: 'pi pi-file',      command: () => this.onTabChange('files') }
      ];
  
      this.activeItem = this.items[0];
    });
  }

  /**
   * ✅ Subscribe to user authentication changes
   */
  private subscribeToAuthChanges(): void {
    this.authStore.getCurrentUserID$()
      .pipe(
        takeUntil(this.destroy$),
        filter(userId => !!userId)
      )
      .subscribe(userId => {
        console.log('👤 User ID changed:', userId);
        
        const hasChanged = userId !== this.currentUserId;
        this.currentUserId = userId;
        
        if (hasChanged) {
          // ✅ Reset state on user change
          this.resetComponentState();
          
          // ✅ Setup socket authentication
          this.ensureSocketAuthentication();
        }
      });
  }

  /**
   * ✅ Reset component state (useful for user change or logout)
   */
  private resetComponentState(): void {
    this.chats = [];
    this.selectedChat = null;
    this.hasLoadedInitialChats = false;
    this.socketListenersInitialized = false;
  }

  // ==========================================
  // ✅ SOCKET AUTHENTICATION & SETUP
  // ==========================================

  /**
   * ✅ Ensure socket is authenticated for current user
   */
  private ensureSocketAuthentication(): void {
    if (!this.currentUserId) {
      console.warn('⚠️ Cannot authenticate socket: No userId');
      return;
    }

    this.socketService.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        take(1)
      )
      .subscribe(isAuthenticated => {
        if (!isAuthenticated && this.socketService.isConnected()) {
          this.authenticateSocket();
        } else if (isAuthenticated) {
          this.onSocketAuthenticated();
        } else {
          this.waitForSocketConnection();
        }
      });
  }

  /**
   * ✅ Authenticate socket with current user
   */
  private authenticateSocket(): void {
    this.socketService.authenticate(this.currentUserId)
      .then(() => {
        this.onSocketAuthenticated();
      })
      .catch(error => {
        console.error('❌ Socket authentication failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Connection Error',
          detail: 'Failed to establish real-time connection. Some features may not work.',
          life: 5000
        });
      });
  }

  /**
   * ✅ Wait for socket connection before authenticating
   */
  private waitForSocketConnection(): void {
    
    this.socketService.connectionStatus$
      .pipe(
        takeUntil(this.destroy$),
        filter(isConnected => isConnected),
        take(1)
      )
      .subscribe(() => {
        this.authenticateSocket();
      });
  }

  /**
   * ✅ Called when socket is authenticated
   */
  private onSocketAuthenticated(): void {
    
    // ✅ Setup socket listeners for real-time updates
    this.setupSocketListeners();

  }

  // ==========================================
  // ✅ SOCKET LISTENERS (REAL-TIME UPDATES)
  // ==========================================

  /**
   * ✅ Setup Socket.IO listeners for real-time updates
   */
  private setupSocketListeners(): void {
    if (this.socketListenersInitialized) {
      console.log('⚠️ Socket listeners already initialized, skipping');
      return;
    }

    if (!this.currentUserId) {
      console.warn('⚠️ Cannot setup socket listeners: No userId');
      return;
    }

    console.log('🔌 Setting up socket listeners for user:', this.currentUserId);

    // ✅ 1. Listen for NEW MESSAGES (for chat list updates)
    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message: any) => {
          this.handleNewMessage(message);
        },
        error: (err) => {
          console.error('❌ Error in new message listener:', err);
        }
      });

    // // ✅ 2. Listen for NOTIFICATIONS (for toast display only)
    // // IMPORTANT: Only subscribe once here, don't duplicate with NotificationsComponent
    // this.notificationsService.realTimeNotifications$
    //   .pipe(
    //     takeUntil(this.destroy$),
    //     filter(notification => !!notification && notification.userId === this.currentUserId)
    //   )
    //   .subscribe({
    //     next: (notification) => {
    //       console.log('🔔 New notification received in container (for toast):', notification);
    //       this.handleNewNotification(notification);
    //     },
    //     error: (err) => {
    //       console.error('❌ Error in notification listener:', err);
    //     }
    //   });

    this.socketService.onMessageRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.handleMessageRead(data);
        },
        error: (err) => {
          console.error('❌ Error in message read listener:', err);
        }
      });

    this.socketService.onChatUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.handleChatUpdate(data);
        },
        error: (err) => {
          console.error('❌ Error in chat update listener:', err);
        }
      });
      
    this.socketService.onTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.handleTypingIndicator(data);
        },
        error: (err) => {
          console.error('❌ Error in typing listener:', err);
        }
      });

    this.socketListenersInitialized = true;
    console.log('✅ Socket listeners setup complete');
  }

  // ==========================================
  // ✅ SOCKET EVENT HANDLERS
  // ==========================================

  /**
   * ✅ Handle new message event
   */
  private handleNewMessage(message: any): void {
    
    const chatIndex = this.chats.findIndex(c => c._id === message.chatId);
    
    if (chatIndex !== -1) {
      const chat = this.chats[chatIndex];
      
      // ✅ Update chat with new message info
      chat.lastMessageContent = message.content || message.type;
      chat.lastMessageDate = new Date(message.timestamp);
      
      // ✅ Increment unread count if message is not from current user
      if (message.senderId !== this.currentUserId) {
        if (!chat.unreadCount) {
          chat.unreadCount = {};
        }
        const currentCount = (chat.unreadCount as any)[this.currentUserId] || 0;
        (chat.unreadCount as any)[this.currentUserId] = currentCount + 1;
      }
      
      // ✅ Move chat to top of list
      this.chats.splice(chatIndex, 1);
      this.chats.unshift(chat);
      
    } else {
      this.loadChats();
    }
  }

  /**
   * ✅ Handle new notification event (show toast only)
   * Note: The NotificationsComponent handles adding it to the notification list
   */
  private handleNewNotification(notification: any): void {
    console.log('🔔 Handling new notification for toast:', notification.title);
    
    // ✅ Show toast notification
    // this.messageService.add({
    //   severity: 'info',
    //   summary: notification.title,
    //   detail: notification.content,
    //   life: 5000,
    //   closable: true
    // });
    
    // ✅ Play notification sound
    this.playNotificationSound();
    
    // ✅ Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  /**
   * ✅ Handle message read event
   */
  private handleMessageRead(data: any): void {
    
    const chat = this.chats.find(c => c._id === data.chatId);
    if (chat && chat.unreadCount) {
      const currentCount = (chat.unreadCount as any)[this.currentUserId] || 0;
      if (currentCount > 0) {
        (chat.unreadCount as any)[this.currentUserId] = Math.max(0, currentCount - 1);
        console.log('✅ Chat unread count updated');
      }
    }
  }

  /**
   * ✅ Handle chat update event
   */
  private handleChatUpdate(data: any): void {
    
    const chat = this.chats.find(c => c._id === data.chatId);
    if (chat) {
      Object.assign(chat, data.updates);
    }
  }

  /**
   * ✅ Handle typing indicator event
   */
  private handleTypingIndicator(data: any): void {
    // You can show typing indicators in chat list if needed
  }

  // ==========================================
  // ✅ NOTIFICATION HELPERS
  // ==========================================

  /**
   * ✅ Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('⚠️ Could not play notification sound:', error);
    }
  }

  /**
   * ✅ Show browser notification (if permission granted)
   */
  private showBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.content,
          icon: '/assets/icons/notification-icon.png',
          badge: '/assets/icons/badge-icon.png',
          tag: notification._id,
          requireInteraction: false
        });
      } catch (error) {
        console.warn('⚠️ Could not show browser notification:', error);
      }
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }

  // ==========================================
  // ✅ DATA LOADING (HTTP)
  // ==========================================

  /**
   * ✅ Load chats from server
   */
  private loadChats(): void {
    console.log('📞 loadChats() called');
    
    if (!this.currentUserId) {
      console.error('❌ Cannot load chats: No user ID available');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID not found. Please refresh the page.',
        life: 5000
      });
      return;
    }

    if (this.isLoading) {
      console.warn('⚠️ Already loading chats, skipping duplicate request');
      return;
    }

    this.isLoading = true;
    console.log('📞 Calling messagingWrapper.getUserChats()...');

    this.messagingWrapper.getUserChats(this.currentUserId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('✅ getUserChats() finalized');
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (chats) => {
          this.chats = chats;
          this.hasLoadedInitialChats = true;
          
          if (chats.length === 0) {
            console.log('ℹ️ No chats found for this user');
            this.messageService.add({
              severity: 'info',
              summary: 'No Conversations',
              detail: 'You have no conversations yet. Start a new chat!',
              life: 4000
            });
          } else {
            console.log(`✅ Loaded ${chats.length} chat(s)`);
          }
        },
        error: (error) => {
          console.error('❌ Error loading chats:', error);
          this.chats = [];
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error Loading Chats',
            detail: error.message || 'Failed to load conversations. Please try again.',
            life: 5000
          });
        }
      });
  }

  // ==========================================
  // ✅ UI CONTROLS
  // ==========================================

  show(): void {
    this.isVisible = true;
    
    if (this.currentUserId && !this.hasLoadedInitialChats) {
      this.loadChats();
    }
  }

  hide(): void {
    this.isVisible = false;
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  onTabChange(tab: string): void {
    console.log('📑 Tab changed to:', tab);
  }

  // ==========================================
  // ✅ CHAT EVENT HANDLERS
  // ==========================================

  onSelectChat(chat: Chat): void {
    this.selectedChat = chat;
  }

  onChatCreated(chatData: any): void {
    this.loadChats();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Chat Created',
      detail: 'New conversation started successfully',
      life: 3000
    });
  }

  onChatUpdated(event: { chat: Chat; updates: any }): void {
    
    const index = this.chats.findIndex(c => c._id === event.chat._id);
    if (index !== -1) {
      this.chats[index] = { ...this.chats[index], ...event.updates };
    }
    
    this.messageService.add({
      severity: 'info',
      summary: 'Chat Updated',
      detail: 'Conversation settings updated',
      life: 3000
    });
  }

  onDeleteChat(chat: Chat): void {
    
    this.chats = this.chats.filter(c => c._id !== chat._id);
    
    if (this.selectedChat?._id === chat._id) {
      this.selectedChat = null;
    }
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Chat Deleted',
      detail: 'Conversation removed successfully',
      life: 3000
    });
  }
}