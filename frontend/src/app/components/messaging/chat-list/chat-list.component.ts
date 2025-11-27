// chat-list.component.ts 
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { Chat, Message, User } from '../models/chat.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuItem } from 'primeng/api';
import { NewChatDialogComponent, NewChatData } from '../new-chat-dialog/new-chat-dialog.component';
import { Menu } from 'primeng/menu';
import { ChatMenuService, ChatMenuActions } from '../../../services/messaging/chat-menu.service';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';
import { SocketService } from '../../../services/socket/socket.service';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface ChatFilters {
  recent: boolean;
  alphabetical: boolean;
  archived: boolean;
  favorites: boolean;
  read: boolean;
  unread: boolean;
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    SkeletonModule,
    ScrollPanelModule,
    RippleModule,
    TooltipModule,
    MenuModule,
    CardModule,
    DividerModule,
    TagModule,
    OverlayPanelModule,
    CheckboxModule,
    TranslateModule,
    NewChatDialogComponent
  ],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnChanges, OnInit, OnDestroy {
  @Input() chats: Chat[] = [];
  @Input() isLoading: boolean = false;
  @Input() currentUserId: string = ''; 
  
  @Output() selectChat = new EventEmitter<Chat>();
  @Output() newChatClicked = new EventEmitter<void>();
  @Output() deleteChat = new EventEmitter<Chat>();
  @Output() chatCreated = new EventEmitter<NewChatData>();
  @Output() chatUpdated = new EventEmitter<{ chat: Chat, updates: any }>();

  @ViewChild('newChatDialog') newChatDialog!: NewChatDialogComponent;

  query = '';
  selectedChat: Chat | null = null;
  menuItems: MenuItem[] = [];
  currentMenuChat: Chat | null = null;

  filters: ChatFilters = {
    recent: false,
    alphabetical: false,
    archived: false,
    favorites: false,
    read: false,
    unread: false
  };

  private deletingChats = new Set<string>();
  private destroy$ = new Subject<void>();
  private pendingUnreadIncrements = new Map<string, number>();

  constructor(
    private cdr: ChangeDetectorRef,
    private chatMenuService: ChatMenuService,
    private api: MessagingWrapperService,
    private socketService: SocketService,
    private translate: TranslateService,
  ) {}
  ngOnInit(): void {
    console.log('🚀 ChatListComponent initialized with userId:', this.currentUserId);
    
    // Set up Socket.IO listeners for real-time updates
    this.setupSocketListeners();
  }
  
  /**
   * Set up Socket.IO event listeners for real-time chat updates
   */
  private setupSocketListeners(): void {
    // ✅ FIX: Use onNewMessage() instead of on('onNewMessage')
    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message & { chatId: string }) => {
        console.log('📨 ChatList: New message received via socket', message);
        this.handleIncomingMessage(message);
      });
  
    // ✅ FIX: Use onChatUpdated() instead of on('chatUpdated')
    this.socketService.onChatUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: any) => {
        console.log('🔄 ChatList: Chat updated via socket', event);
        this.handleChatUpdate(event);
      });
  
    // ✅ FIX: Use onUserOnline() instead of on('userOnline')
    this.socketService.onUserOnline()
      .pipe(takeUntil(this.destroy$))
      .subscribe((userId: string) => {
        console.log('🟢 ChatList: User online', userId);
        this.updateUserOnlineStatus(userId, true);
      });
  
    // ✅ FIX: Use onUserOffline() instead of on('userOffline')
    this.socketService.onUserOffline()
      .pipe(takeUntil(this.destroy$))
      .subscribe((userId: string) => {
        console.log('🔴 ChatList: User offline', userId);
        this.updateUserOnlineStatus(userId, false);
      });
  
    // ✅ FIX: Use onTyping() instead of on('userTyping')
    this.socketService.onTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: { userId: string; chatId: string; isTyping: boolean }) => {
        console.log('⌨️ ChatList: User typing', data);
        // Handle typing indicator if needed
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ✅ ADD THIS METHOD if missing (should be around line 148)
  private updateUserOnlineStatus(userId: string, isOnline: boolean): void {
    this.chats.forEach(chat => {
      const user = chat.participantsDetails?.find(u => u.userId === userId);
      if (user) {
        user.isOnline = isOnline;
        if (!isOnline) {
          user.lastSeen = new Date();
        }
      }
    });
    this.cdr.detectChanges();
  }
  
  // ✅ FIX: Change the chatType line in handleIncomingMessage to suppress warning
  private handleIncomingMessage(message: Message & { chatId: string }) {
    
    const chatId = message.chatId;
    const existingIndex = this.chats.findIndex(c => c._id === chatId);
    const currentUser = String(this.currentUserId);
    const senderId = message.senderId ? String(message.senderId) : null;
    const isFromCurrentUser = senderId === currentUser;
  
    if (existingIndex !== -1) {
      const oldChat = this.chats[existingIndex];
      
      // ✅ FIX: Calculate new unread count
      const newUnreadCount = { ...oldChat.unreadCount };
      if (!isFromCurrentUser) {
        // Increment unread count for current user
        const currentCount = newUnreadCount[currentUser] || 0;
        newUnreadCount[currentUser] = currentCount + 1;
      }
      
      const updatedChat: Chat = {
        ...oldChat,
        lastMessageContent: message.content,
        lastMessageDate: message.timestamp || new Date(),
        unreadCount: newUnreadCount
      };
  
      // Move chat to top of list
      this.chats.splice(existingIndex, 1);
      this.chats = [updatedChat, ...this.chats];
  
      // Update selected chat if it's the same one
      if (this.selectedChat?._id === chatId) {
        this.selectedChat = updatedChat;
        this.selectChat.emit(updatedChat);
      }
  
      this.cdr.detectChanges();
      return;
    }
    
    this.api.getChatById(chatId).subscribe({
      next: (fetchedChat) => {
        
        // ✅ Set unread count if message is not from current user
        if (!isFromCurrentUser) {
          if (!fetchedChat.unreadCount) {
            fetchedChat.unreadCount = {};
          }
          fetchedChat.unreadCount[currentUser] = 1;
        }
        
        // Add the fetched chat to the list
        this.chats = [fetchedChat, ...this.chats];
        
        // If no chat is selected, select this one
        if (!this.selectedChat) {
          this.selectedChat = fetchedChat;
          this.selectChat.emit(fetchedChat);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Failed to fetch chat from server:', error);
      }
    });
  }

  private handleChatUpdate(event: any) {
    
    const chatId = event.chatId || event._id;
    const chatIndex = this.chats.findIndex(c => c._id === chatId);
  
    if (chatIndex !== -1) {
      const oldChat = this.chats[chatIndex];
      const isSelected = this.selectedChat?._id === chatId;
  
      console.log('📊 Old chat before update:', {
        _id: oldChat._id,
        type: oldChat.type,
        hasParticipantsDetails: !!oldChat.participantsDetails,
        participantCount: oldChat.participantsDetails?.length || 0,
        name: this.getChatName(oldChat)
      });
  
      // ✅ Start with a copy of the old chat to preserve all properties
      const updatedChat: Chat = {
        ...oldChat
      };
  
      // ✅ Get updates - if event has participantsDetails at top level, use event itself
      const updates = event.updates || event;
  
      // Update each field only if it exists in the update
      if (updates.hasOwnProperty('lastMessageContent')) {
        updatedChat.lastMessageContent = updates.lastMessageContent;
      }
      if (updates.hasOwnProperty('lastMessageDate')) {
        updatedChat.lastMessageDate = new Date(updates.lastMessageDate);
      }
      if (updates.hasOwnProperty('unreadCount')) {
        updatedChat.unreadCount = updates.unreadCount;
      }
      if (updates.hasOwnProperty('name')) {
        updatedChat.name = updates.name;
      }
      if (updates.hasOwnProperty('participantsDetails')) {
        updatedChat.participantsDetails = updates.participantsDetails;
        console.log('✅ Updated participantsDetails:', updatedChat.participantsDetails);
      }
      if (updates.hasOwnProperty('type')) {
        updatedChat.type = updates.type;
        console.log('✅ Updated type:', updatedChat.type);
      }
      if (updates.hasOwnProperty('updatedAt')) {
        updatedChat.updatedAt = new Date(updates.updatedAt);
      }
      if (updates.hasOwnProperty('isStarred')) {
        updatedChat.isStarred = updates.isStarred;
      }
      if (updates.hasOwnProperty('isPinned')) {
        updatedChat.isPinned = updates.isPinned;
      }
      if (updates.hasOwnProperty('isMuted')) {
        updatedChat.isMuted = updates.isMuted;
      }
      if (updates.hasOwnProperty('isArchived')) {
        updatedChat.isArchived = updates.isArchived;
      }
  
      // Replace chat in list
      this.chats.splice(chatIndex, 1);
      this.chats = [updatedChat, ...this.chats];
  
      // Update selected chat if it matches
      if (isSelected) {
        this.selectedChat = updatedChat;
        this.selectChat.emit(updatedChat);
      }
  
      this.cdr.detectChanges();
      
    } else if (event._id) {
      const newChat = this.convertToChat(event);
      this.chats = [newChat, ...this.chats];
      this.cdr.detectChanges();
    }
  }

  private findUserKey(unreadCount: any, userId: string): string | null {
    if (!unreadCount) return null;
    return Object.keys(unreadCount).find(k => String(k) === String(userId)) || null;
  }

  private convertToChat(event: any): Chat {
    return {
      _id: event._id || event.chatId,
      participants: event.participants || [],
      participantsDetails: event.participantsDetails || [],
      lastMessageContent: event.lastMessageContent || '',
      lastMessageDate: new Date(event.lastMessageDate || event.updatedAt || Date.now()),
      unreadCount: event.unreadCount || {},
      type: event.type,
      name: event.name,
      createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
      updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
      isStarred: event.isStarred || false,
      isPinned: event.isPinned || false,
      isMuted: event.isMuted || false,
      isArchived: event.isArchived || false
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chats']) {
      if (this.selectedChat) {
        const stillExists = this.chats.some(chat => chat._id === this.selectedChat?._id);
        if (!stillExists) {
          this.selectedChat = null;
          this.cdr.detectChanges();
        }
      }
    }
  }

  onSelectChat(chat: Chat) {
    this.selectedChat = chat;
  
    // ✅ FIX: Validate chat exists before trying to reset unread count
    // Only reset unread count if the chat has unread messages
    if (chat.unreadCount && this.getUnreadCount(chat) > 0) {
      const userKey = this.findUserKey(chat.unreadCount, this.currentUserId);
      if (userKey) {
        chat.unreadCount[userKey] = 0;
      } else {
        chat.unreadCount[this.currentUserId] = 0;
      }
      this.cdr.detectChanges();
    }
  
    this.selectChat.emit(chat);
  }

  showChatMenu(event: Event, chat: Chat, menu: Menu) {
    event.stopPropagation();
    this.currentMenuChat = chat;

    const menuActions: ChatMenuActions = {
      onChatUpdated: (updatedChat, updates) => {
        this.chatUpdated.emit({ chat: updatedChat, updates });
        this.cdr.detectChanges();
      },
      onChatDeleted: (deletedChat) => {
        this.handleChatDeletion(deletedChat);
      }
    };

    this.menuItems = this.chatMenuService.generateMenuItems(chat, menuActions);
    menu.toggle(event);
  }

  private handleChatDeletion(chat: Chat): void {
    if (this.deletingChats.has(chat._id)) {
      return;
    }
  
    this.deletingChats.add(chat._id);
  
    this.api.deleteChat(chat._id).subscribe({
      next: (response) => {
        this.deletingChats.delete(chat._id);
        
        const chatsBefore = this.chats.length;
        this.chats = this.chats.filter(c => c._id !== chat._id);
        const chatsAfter = this.chats.length;
        
        this.deleteChat.emit(chat);
  
        if (this.selectedChat?._id === chat._id) {
          this.selectedChat = null;
        }
  
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error deleting chat:', error);
        this.deletingChats.delete(chat._id);
  
        if (error.status === 404) {
          this.chats = this.chats.filter(c => c._id !== chat._id);
          this.deleteChat.emit(chat);
          
          if (this.selectedChat?._id === chat._id) {
            this.selectedChat = null;
          }
          this.cdr.detectChanges();
        } else {
          alert('Failed to delete conversation. Please try again.');
        }
      }
    });
  }

  onNewChatClick() {
    this.newChatDialog.show();
  }

  onDialogClosed() {}

  onChatCreated(newChatData: NewChatData & { chat?: any }) {
    
    if (newChatData.chat) {
      
      // Add the new chat to the beginning of the list
      this.chats = [newChatData.chat, ...this.chats];
      
      // Optionally select the new chat
      this.selectedChat = newChatData.chat;
      this.selectChat.emit(newChatData.chat);
      
      this.cdr.detectChanges();
    } else {
      // ✅ If only data is provided, refetch chats from server
      this.refreshChats();
    }
  }
  
  /**
   * Refresh chats from server
   */
  private refreshChats() {
    if (!this.currentUserId) return;
    
    // You'll need to implement this method in your service
    this.api.getUserChats(this.currentUserId).subscribe({
      next: (chats: Chat[]) => {
        this.chats = chats;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Failed to refresh chats:', error);
      }
    });
  }

  onDeleteChat(chat: Chat, event?: Event) {
    if (event) event.stopPropagation();
    this.handleChatDeletion(chat);
  }

  isSelected(chat: Chat): boolean {
    return this.selectedChat === chat;
  }

  getFilteredChats(): Chat[] {
    const q = this.query.trim().toLowerCase();

    let filteredChats = q
      ? this.chats.filter(chat =>
        this.getChatName(chat).toLowerCase().includes(q) ||
        this.getLastMessagePreview(chat).toLowerCase().includes(q)
      )
      : [...this.chats];

    filteredChats = this.applyActiveFilters(filteredChats);
    return this.applySorting(filteredChats);
  }

  private applyActiveFilters(chats: Chat[]): Chat[] {
    let filtered = chats;

    if (this.filters.archived) {
      filtered = filtered.filter(chat => chat.isArchived === true);
    } else {
      filtered = filtered.filter(chat => chat.isArchived !== true);
    }

    if (this.filters.recent) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      filtered = filtered.filter(chat => {
        const chatDate = new Date(chat.lastMessageDate || chat.updatedAt || 0);
        return chatDate >= twoDaysAgo;
      });
    }

    if (this.filters.favorites) {
      filtered = filtered.filter(chat => chat.isStarred === true);
    }

    if (this.filters.read) {
      filtered = filtered.filter(chat => this.getUnreadCount(chat) === 0);
    }

    if (this.filters.unread) {
      filtered = filtered.filter(chat => this.getUnreadCount(chat) > 0);
    }

    return filtered;
  }

  private applySorting(chats: Chat[]): Chat[] {
    if (this.filters.alphabetical) {
      return chats.sort((a, b) => {
        const nameA = this.getChatName(a).toLowerCase();
        const nameB = this.getChatName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      return chats.sort((a, b) => {
        const aPinned = a.isPinned || false;
        const bPinned = b.isPinned || false;

        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        let aDate: Date;
        let bDate: Date;

        if (aPinned && bPinned) {
          aDate = new Date(a.updatedAt || a.lastMessageDate || 0);
          bDate = new Date(b.updatedAt || b.lastMessageDate || 0);
        } else {
          aDate = new Date(a.lastMessageDate || a.updatedAt || 0);
          bDate = new Date(b.lastMessageDate || b.updatedAt || 0);
        }

        return bDate.getTime() - aDate.getTime();
      });
    }
  }

  applyFilters(): void {
    this.cdr.detectChanges();
  }

  getActiveFiltersCount(): number {
    return Object.values(this.filters).filter(value => value === true).length;
  }

  clearAllFilters(): void {
    this.filters = {
      recent: false,
      alphabetical: false,
      archived: false,
      favorites: false,
      read: false,
      unread: false
    };
    this.cdr.detectChanges();
  }

  getChatName(chat: Chat): string {
    if (chat.type === 'group' && chat.name) {
      return chat.name;
    }

    if (chat.participantsDetails && chat.participantsDetails.length > 0) {
      if (chat.type === 'direct') {
        const otherUser = chat.participantsDetails.find(u => u.userId !== this.currentUserId);
        return otherUser ? (otherUser.displayName || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim()) : 'Unknown User';
      }
      return chat.participantsDetails
        .filter(u => u.userId !== this.currentUserId)
        .map(u => u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim())
        .join(', ');
    }

    return chat.participants && chat.participants.length > 2 ? `Group Chat` : 'Direct Chat';
  }

  getAvatarInitials(chat: Chat): string {
    if (chat.type === 'group') {
      if (chat.name) {
        const words = chat.name.split(' ');
        return words.length > 1
          ? words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
          : chat.name.substring(0, 2).toUpperCase();
      }
      return 'GRP';
    }

    if (chat.participantsDetails && chat.participantsDetails.length > 0) {
      const otherUser = chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      if (otherUser) {
        if (otherUser.displayName) {
          const names = otherUser.displayName.split(/[\.\s]/);
          const firstInitial = names[0]?.[0] || '';
          const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
          return (firstInitial + lastInitial).toUpperCase() || 'U';
        }
        const firstInitial = otherUser.firstname?.[0] || '';
        const lastInitial = otherUser.lastname?.[0] || '';
        return (firstInitial + lastInitial).toUpperCase() || 'U';
      }
    }

    return 'U';
  }

  isOnline(chat: Chat): boolean {
    if (chat.participantsDetails && chat.participantsDetails.length > 0) {
      const otherUser = chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser?.isOnline || false;
    }
    return false;
  }

  getUserRole(chat: Chat): string {
    if (chat.type === 'group') {
      return 'Group';
    }

    if (chat.participantsDetails && chat.participantsDetails.length > 0) {
      const otherUser = chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser?.userType || 'User';
    }

    return 'User';
  }

  getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessageContent) return 'No messages yet';

    const maxLength = 60;
    const content = chat.lastMessageContent;
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  getUnreadCount(chat: Chat): number {
    if (!chat.unreadCount) return 0;
    const key = this.findUserKey(chat.unreadCount, this.currentUserId);
    return key ? (chat.unreadCount[key] || 0) : 0;
  }

  hasUnreadMessages(chat: Chat): boolean {
    return this.getUnreadCount(chat) > 0;
  }

  getAvatarColor(chat: Chat): string {
    const colors = [
      '#4F8A8B', '#6B73FF', '#9B59B6', '#E74C3C',
      '#F39C12', '#27AE60', '#34495E', '#E67E22'
    ];
    const index = (chat._id || '').length % colors.length;
    return colors[index];
  }

  formatTime(date: Date): string {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffDays <= 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric'
      });
    }
  }

  getRoleSeverity(role: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    switch (role.toLowerCase()) {
      case 'teacher': return 'info';
      case 'student': return 'success';
      case 'parent': return 'warning';
      case 'manager': return 'danger';
      case 'admin': return 'contrast';
      case 'group': return 'secondary';
      default: return 'secondary';
    }
  }

  trackByChatId(index: number, chat: Chat): string {
    return chat._id;
  }
}