// messaging/messaging-container/messaging-container.component.ts

import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
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
    NotificationsComponent,
    TabMenuModule
],
  providers: [MessageService],
  templateUrl: './messaging-container.component.html',
  styleUrls: ['./messaging-container.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MessagingContainerComponent implements OnInit, OnDestroy {
  currentUserId: string = '';
  selectedChat: Chat | null = null;
  chats: Chat[] = [];
  isVisible: boolean = false;
  isLoading: boolean = false;
  items: MenuItem[] = [];
  activeItem: MenuItem | undefined;
  
  private destroy$ = new Subject<void>();
  private hasLoadedInitialChats = false;

  constructor(
    private authStore: AuthStoreService, 
    private messageService: MessageService,
    private messagingWrapper: MessagingWrapperService
  ) {
    console.log('🏗️ MessagingContainerComponent constructed');
  }

  ngOnInit(): void {
    console.log('🚀 MessagingContainerComponent ngOnInit started');

    this.items = [
      { 
        label: 'Chats', 
        icon: 'pi pi-comments',
        command: () => this.onTabChange('chats')
      },
      { 
        label: 'Files', 
        icon: 'pi pi-file',
        command: () => this.onTabChange('files')
      }
    ];

    this.activeItem = this.items[0];
    
    // Subscribe to user ID changes from auth store
    this.authStore.getCurrentUserID$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => {
        console.log('💬 getCurrentUserID$() emitted:', userId);
        console.log('💬 Previous userId:', this.currentUserId);
        console.log('💬 Has changed:', userId !== this.currentUserId);
        
        this.currentUserId = userId;
        
      });
  }

  onTabChange(tab: string) {
    console.log('Tab changed to:', tab);
    // Implement tab switching logic here
    // For now, Files tab can show a message or different view
  }

  ngOnDestroy(): void {
    console.log('🧹 MessagingContainerComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ NEW: Refresh chats when panel is opened
  show(): void {
    
    this.isVisible = true;
    
    // ✅ Reload chats every time panel is opened
    if (this.currentUserId) {
      console.log('👁️ Reloading chats on panel open');
      this.loadChats();
    } else {
      console.warn('👁️ Cannot load chats - no userId');
    }
  }

  hide(): void {
    console.log('👁️ hide() called - closing messaging panel');
    this.isVisible = false;
  }

  toggle(): void {
    console.log('👁️ toggle() called');
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private loadChats(): void {
    console.log('📞 loadChats() called');
    // ✅ CHECK FIRST 2 CHATS
    console.log('First chat:', {
      _id: this.chats[0]?._id,
      lastMessageContent: this.chats[0]?.lastMessageContent,
      lastMessageDate: this.chats[0]?.lastMessageDate
    });
    console.log('Second chat:', {
      _id: this.chats[1]?._id,
      lastMessageContent: this.chats[1]?.lastMessageContent,
      lastMessageDate: this.chats[1]?.lastMessageDate
    });
    
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
    console.log('📞 API URL will be constructed for userId:', this.currentUserId);

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
            this.messageService.add({
              severity: 'success',
              summary: 'Chats Loaded',
              detail: `Found ${chats.length} conversation(s)`,
              life: 3000
            });
          }
        },
        error: (error) => {
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error:', JSON.stringify(error, null, 2));
          
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

  onSelectChat(chat: Chat): void {
    console.log('💬 Chat selected:', chat._id);
    this.selectedChat = chat;
  }

  onChatCreated(chatData: any): void {
    console.log('💬 Chat created:', chatData);
    this.loadChats(); // Reload to get the new chat
    
    this.messageService.add({
      severity: 'success',
      summary: 'Chat Created',
      detail: 'New conversation started successfully',
      life: 3000
    });
  }

  onChatUpdated(event: { chat: Chat; updates: any }): void {
    console.log('💬 Chat updated:', event);
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
    console.log('💬 Chat deleted:', chat._id);
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