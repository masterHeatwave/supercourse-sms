// src/app/components/messaging/chat-window/chat-window.component.ts - FIXED VERSION
import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, OnChanges, 
  SimpleChanges, AfterViewInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chat, Message } from '../models/chat.models';
import { Attachment, AttachmentUtils, MessageAttachment } from '../models/attachment.models';
import { AttachmentComponent } from '../attachment/attachment.component';
import { AttachmentService } from '../../../services/messaging/attachment.service';
import { SocketService } from '../../../services/socket/socket.service';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';  
import { ChatMenuService, ChatMenuActions } from '../../../services/messaging/chat-menu.service';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ScrollPanel } from 'primeng/scrollpanel';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AvatarModule, ChipModule, ButtonModule, 
    ScrollPanelModule, TooltipModule, TagModule, MenuModule, CardModule, 
    AttachmentComponent, InputTextareaModule, TranslateModule
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  @Input() chat!: Chat;
  @Input() currentUserId: string = '';
  @Output() chatUpdated = new EventEmitter<{chat: Chat, updates: any}>();
  @Output() deleteChat = new EventEmitter<Chat>();

  @ViewChild('scrollPanel', { static: false }) scrollPanel!: ScrollPanel;

  private api = inject(MessagingWrapperService);  
  private socket = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);
  private chatMenuService = inject(ChatMenuService);
  private attachmentService = inject(AttachmentService); 
  private typingTimeout: any;

  messages: Message[] = [];
  newMessage = '';
  menuItems: MenuItem[] = [];
  messageMenuItems: MenuItem[] = [];

  // Reply state
  replyingToMessage: {
    _id: string;
    content: string;
    timestamp: Date;
    senderId: string;
    senderUsername?: string;
    senderFullName?: string;
  } | null = null;

  // ✅ Attachment state
  isUploadingAttachments = false;
  uploadingFiles: File[] = [];
  pendingAttachments: Attachment[] = [];

  private deletingChats = new Set<string>();
  private globalSubs: Subscription[] = []; 
  private chatSpecificSubs: Subscription[] = []; 
  private currentChatId: string | null = null;
  private isSocketReady = false; 
  
  // UI state
  typingFrom: string | null = null;
  online = false;

  AttachmentUtils = AttachmentUtils;

  ngOnInit() {
    this.setupGlobalSocketSubscriptions();
    this.setupSessionScrollListener();
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToBottom(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chat'] && changes['chat'].currentValue) {
      this.switchToChat();
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    if (this.currentChatId) {
      this.socket.leaveChat(this.currentChatId);
    }
    
    this.globalSubs.forEach(s => s.unsubscribe());
    this.cleanupChatSpecificSubscriptions();
    window.removeEventListener('scrollToSession', null as any);
  }

  // ========================================
  // SESSION SCROLL FUNCTIONALITY
  // ========================================
  private setupSessionScrollListener(): void {
    window.addEventListener('scrollToSession', (event: any) => {
      const { sessionId, timestamp } = event.detail;
      this.scrollToSessionInMessages(sessionId, timestamp);
    });
  }

  private scrollToSessionInMessages(sessionId: string, timestamp?: number): void {
    if (!this.messages || this.messages.length === 0) {
      console.warn('⚠️ No messages found to scroll to');
      return;
    }

    let targetIndex = 0;

    if (timestamp) {
      const targetDate = new Date(timestamp);
      let closestDistance = Infinity;
      let closestIndex = 0;

      this.messages.forEach((msg, idx) => {
        const msgDate = new Date(msg.timestamp);
        const distance = Math.abs(msgDate.getTime() - targetDate.getTime());

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });

      targetIndex = closestIndex;
    }

    setTimeout(() => {
      this.scrollToMessageIndex(targetIndex);
    }, 300);
  }

  private scrollToMessageIndex(index: number): void {
    try {
      const messageElements = document.querySelectorAll('app-chat-window .message-item');
      
      if (messageElements.length > index) {
        const targetElement = messageElements[index] as HTMLElement;
        
        targetElement.classList.add('highlight-message');
        setTimeout(() => {
          targetElement.classList.remove('highlight-message');
        }, 3000);

        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error scrolling to message:', error);
    }
  }

  // ========================================
  // SOCKET MANAGEMENT
  // ========================================
  private setupGlobalSocketSubscriptions() {
    this.ensureSocketAuthentication().then(() => {
      this.isSocketReady = true;
      
      this.globalSubs.push(
        this.socket.onNewMessage().subscribe((msg: Message & { chatId: string }) => {
          this.handleIncomingMessage(msg);
        }),
        
        this.socket.onMessageDelivered().subscribe((data: { messageId: string; userId: string; deliveredAt: Date }) => {
          this.updateMessageDeliveryStatus(data);
        }),

        this.socket.onMessageRead().subscribe((data: { messageId: string; userId: string; readAt: Date; chatId: string }) => {
          this.updateMessageReadStatus(data);
        }),
        
        this.socket.on('messagesRead').subscribe((data: { chatId: string; userId: string; readAt: Date; messageIds: string[] }) => {
          this.updateBulkMessageReadStatus(data);
        }),
        
        this.socket.onTyping().subscribe((data: { chatId: string; userId: string; isTyping: boolean }) => {
          this.handleTypingIndicator(data);
        }),
        
        this.socket.onUserOnline().subscribe((userId: string) => {
          this.handleUserOnline(userId);
        }),
        
        this.socket.onUserOffline().subscribe((userId: string) => {
          this.handleUserOffline(userId);
        }),
        
        this.socket.onChatUpdated().subscribe(event => {
          this.handleChatUpdate(event);
        })
      );
      
      if (this.chat) {
        this.switchToChat();
      }
    });
  }

  private async ensureSocketAuthentication(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket.isConnected()) {
        resolve();
        return;
      }

      const authHandler = (data: any) => {
        this.socket.socket.off('authenticated', authHandler);
        resolve();
      };

      this.socket.socket.on('authenticated', authHandler);
      this.socket.authenticate(this.currentUserId).catch(() => resolve());
      
      setTimeout(() => {
        this.socket.socket.off('authenticated', authHandler);
        resolve();
      }, 3000);
    });
  }

  private switchToChat() {
    if (!this.chat || !this.chat._id || this.currentChatId === this.chat._id) {
      return;
    }
    
    this.cleanupChatSpecificSubscriptions();
    
    if (this.currentChatId) {
      this.socket.leaveChat(this.currentChatId);
    }
  
    this.currentChatId = this.chat._id;
    
    this.messages = [];
    this.typingFrom = null;
    this.online = false;
    this.cancelReply();
    this.clearPendingAttachments();

    this.cdr.detectChanges();
  
    if (this.isSocketReady) {
      this.finalizeChatSwitch();
    } else {
      const checkReady = () => {
        if (this.isSocketReady) {
          this.finalizeChatSwitch();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    }
  }

  private async finalizeChatSwitch() {
    if (!this.chat?._id) return;
    
    try {
      await this.socket.waitForConnection();
      
      const joined = this.socket.joinChat(this.chat._id);
      if (!joined) {
        console.warn('⚠️ Failed to join chat initially, retrying...');
        
        setTimeout(async () => {
          try {
            await this.socket.waitForConnection();
            const retryJoin = this.socket.joinChat(this.chat._id);
            if (retryJoin) {
              this.loadChatMessages();
              this.markChatAsRead();
            }
          } catch (error) {
            console.error('❌ Retry failed:', error);
          }
        }, 1000);
        return;
      }
      
      this.loadChatMessages();
      this.markChatAsRead();
    } catch (error) {
      console.error('❌ Error in finalizeChatSwitch:', error);
      
      this.loadChatMessages();
      this.markChatAsRead();
    }
  }

  private cleanupChatSpecificSubscriptions() {
    this.chatSpecificSubs.forEach(s => s.unsubscribe());
    this.chatSpecificSubs = [];
  }

  // ========================================
  // MESSAGE LOADING & MANAGEMENT
  // ========================================
  private loadChatMessages() {
    if (!this.chat?._id) return;
    
    this.api.getMessages(this.chat._id).subscribe({
      next: (msgs: Message[]) => {
        
        this.messages = msgs;
        setTimeout(() => this.scrollToBottom(), 100);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading messages:', err);
        
        if (err.status === 404) {
          console.error('❌ Chat not found. Notifying parent to remove it.');
          this.deleteChat.emit(this.chat);
          alert('This conversation no longer exists. It will be removed from your chat list.');
        } else {
          alert('Failed to load messages. Please try again.');
        }
      }
    });
  }

  private markChatAsRead() {
    if (!this.chat?._id || !this.currentUserId) return;
    
    this.api.markChatAsRead(this.chat._id, this.currentUserId).subscribe({
      next: () => {
        if (this.chat.unreadCount) {
          this.chat.unreadCount[this.currentUserId] = 0;
        }
        
        this.chatUpdated.emit({
          chat: this.chat,
          updates: { unreadCount: this.chat.unreadCount }
        });
        
        this.updateLocalMessageReadStatus();
      },
      error: (err) => {
        console.error('Error marking chat as read:', err);
        
        if (err.status === 404) {
          console.error('❌ Chat not found. Notifying parent to remove it.');
          this.deleteChat.emit(this.chat);
          alert('This conversation no longer exists.');
        }
      }
    });
  }

  private updateLocalMessageReadStatus() {
    this.messages.forEach(msg => {
      if (msg.senderId !== this.currentUserId) {
        if (!msg.readBy) msg.readBy = [];
        const alreadyRead = msg.readBy.some(r => r.userId === this.currentUserId);
        if (!alreadyRead) {
          msg.readBy.push({
            userId: this.currentUserId,
            readAt: new Date()
          });
        }
      }
    });
  }

  // ========================================
  // MESSAGE HANDLERS (SOCKET EVENTS)
  // ========================================
  private handleIncomingMessage(msg: Message & { chatId: string }) {
    if (!this.chat || msg.chatId !== this.chat._id) {
      return;
    }
  
    if (typeof msg.timestamp === 'string') {
      msg.timestamp = new Date(msg.timestamp);
    }
  
    if (msg.replyToMessage && typeof msg.replyToMessage.timestamp === 'string') {
      msg.replyToMessage.timestamp = new Date(msg.replyToMessage.timestamp);
    }
  
    const existingMessage = this.messages.find(m => m._id === msg._id);
    if (existingMessage) {
      return;
    }
  
    this.messages.push(msg);
    
    // Handle last message content with attachments
    if (msg.content) {
      this.chat.lastMessageContent = msg.content;
    } else if (msg.attachments && msg.attachments.length > 0) {
      this.chat.lastMessageContent = `📎 ${msg.attachments.length} attachment(s)`;
    } else {
      this.chat.lastMessageContent = '[Message]';
    }
    
    this.chat.lastMessageDate = msg.timestamp;
  
    if (msg.senderId !== this.currentUserId) {
      setTimeout(() => {
        this.api.markChatAsRead(this.chat._id, this.currentUserId).subscribe({
          next: () => {
            if (!this.chat.unreadCount) {
              this.chat.unreadCount = {};
            }
            this.chat.unreadCount[this.currentUserId] = 0;
            
            this.chatUpdated.emit({
              chat: this.chat,
              updates: { unreadCount: this.chat.unreadCount }
            });
            
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Error marking chat as read:', err);
          }
        });
      }, 500);
    }
  
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private updateMessageDeliveryStatus(data: { messageId: string; userId: string; deliveredAt: Date }) {
    const message = this.messages.find(m => m._id === data.messageId);
    if (!message) return;

    if (!message.deliveredTo) message.deliveredTo = [];
    
    const alreadyDelivered = message.deliveredTo.some(d => d.userId === data.userId);
    if (!alreadyDelivered) {
      message.deliveredTo.push({
        userId: data.userId,
        deliveredAt: data.deliveredAt
      });
      this.cdr.detectChanges();
    }
  }

  private updateMessageReadStatus(data: { messageId: string; userId: string; readAt: Date; chatId: string }) {
    if (!this.chat || data.chatId !== this.chat._id) {
      return;
    }
    
    if (data.userId === this.currentUserId) {
      return;
    }
  
    const message = this.messages.find(m => m._id === data.messageId);
    if (!message) {
      return;
    }
    
    if (message.senderId !== this.currentUserId) {
      return;
    }
  
    if (!message.readBy) message.readBy = [];
    
    const alreadyRead = message.readBy.some(r => r.userId === data.userId);
    if (!alreadyRead) {
      message.readBy.push({
        userId: data.userId,
        readAt: data.readAt
      });
      this.cdr.detectChanges();
    }
  }

  private updateBulkMessageReadStatus(data: { chatId: string; userId: string; readAt: Date; messageIds: string[] }): void {
    if (!this.chat || data.chatId !== this.chat._id) return;
    
    if (data.userId === this.currentUserId) return;
    
    let updatedCount = 0;
    
    this.messages.forEach(msg => {
      if (data.messageIds.includes(msg._id) && msg.senderId === this.currentUserId) {
        if (!msg.readBy) msg.readBy = [];
        
        const alreadyRead = msg.readBy.some(r => r.userId === data.userId);
        if (!alreadyRead) {
          msg.readBy.push({
            userId: data.userId,
            readAt: data.readAt
          });
          updatedCount++;
        }
      }
    });
    
    if (updatedCount > 0) {
      this.cdr.detectChanges();
    }
  }

  private handleTypingIndicator(data: { chatId: string; userId: string; isTyping: boolean }) {
    if (!this.chat || data.chatId !== this.chat._id || data.userId === this.currentUserId) return;

    if (data.isTyping) {
      this.typingFrom = data.userId;
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 10);
    
      setTimeout(() => {
        if (this.typingFrom === data.userId) {
          this.typingFrom = null;
          this.cdr.detectChanges();
        }
      }, 1000);
    } else {
      this.typingFrom = null;
    }
    
    this.cdr.detectChanges();
  }

  private handleUserOnline(userId: string) {
    if (this.chat?.participants.includes(userId)) {
      this.online = true;
      this.cdr.detectChanges();
    }
  }

  private handleUserOffline(userId: string) {
    if (this.chat?.participants.includes(userId)) {
      this.online = false;
      this.cdr.detectChanges();
    }
  }

  private handleChatUpdate(event: { chatId: string; userId: string; updates: any; timestamp: Date }) {
    if (!this.chat || event.chatId !== this.chat._id || event.userId === this.currentUserId) return;

    Object.assign(this.chat, event.updates);
    this.cdr.detectChanges();
  }

  // ========================================
  // ATTACHMENT HANDLERS
  // ========================================
  onUploadStart(files: File[]): void {
    this.isUploadingAttachments = true;
    this.uploadingFiles = [...files];
    this.cdr.detectChanges();
  }

  onUploadComplete(attachments: Attachment[]): void {
    
    // ✅ Validate attachment structure
    attachments.forEach((att, index) => {
    
      
      if (!att._id || !att.filename || !att.key) {
        console.error('❌ Invalid attachment structure:', att);
      }
    });
    
    this.isUploadingAttachments = false;
    this.uploadingFiles = [];
    
    // ✅ Add to pending attachments
    this.pendingAttachments.push(...attachments);
    
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  onUploadError(error: string): void {
    console.error('❌ Upload error:', error);
    this.isUploadingAttachments = false;
    this.uploadingFiles = [];
    this.cdr.detectChanges();
    alert(`Upload failed: ${error}`);
  }

  openAttachment(att: MessageAttachment | Attachment) {
    if (!att || !att.key) {
      console.error('❌ No key available for attachment');
      alert('Cannot open attachment: No file key');
      return;
    }
    
    // ✅ Get a FRESH signed URL from the backend
    this.attachmentService.downloadFile(att.key).subscribe({
      next: (response) => {
        if (response.url) {
          window.open(response.url, '_blank');
        } else {
          alert('Failed to open attachment');
        }
      },
      error: (err) => {
        console.error('❌ Error:', err);
        if (err.status === 404) {
          alert('Attachment not found');
        } else {
          alert('Failed to open attachment');
        }
      }
    });
  }

  clearPendingAttachments(): void {
    this.pendingAttachments = [];
    this.cdr.detectChanges();
  }

  removePendingAttachment(attachment: Attachment): void {
    this.pendingAttachments = this.pendingAttachments.filter(a => a._id !== attachment._id);
    this.cdr.detectChanges();
  }

  // ========================================
  // MESSAGE SENDING
  // ========================================
  canSendMessage(): boolean {
    const hasContent = this.newMessage && this.newMessage.trim().length > 0;
    const hasAttachments = this.pendingAttachments.length > 0;
    return hasContent || hasAttachments;
  }

  sendMessage() {
    const content = this.newMessage.trim();
    
    // ✅ Allow sending if there's content OR pending attachments
    if (!content && this.pendingAttachments.length === 0) {
      console.warn('⚠️ Cannot send empty message without attachments');
      return;
    }
    
    if (!this.chat || !this.chat._id) {
      console.error('❌ Chat is not defined');
      alert('Cannot send message: No chat selected');
      return;
    }
    
    if (!this.currentUserId) {
      console.error('❌ Current user ID is not defined');
      alert('Cannot send message: User not authenticated');
      return;
    }
  
    const currentUserIdStr = String(this.currentUserId);
    const participantIds = this.chat.participants.map(id => String(id));
    const recipientIds = participantIds.filter(id => id !== currentUserIdStr);
    const replyToMessageId = this.replyingToMessage ? this.replyingToMessage._id : undefined;
    
    if (recipientIds.length === 0) {
      console.error('❌ No recipients found');
      alert('Cannot send message: No recipients in this chat');
      return;
    }

    // ✅ Prepare attachments array - Map _id to fileId
    const attachments = this.pendingAttachments.length > 0 
      ? this.pendingAttachments.map(att => {
          // ✅ Validate required fields
          if (!att._id) {
            console.error('❌ Attachment missing _id:', att);
            throw new Error('Attachment missing ID');
          }
          if (!att.key) {
            console.error('❌ Attachment missing key:', att);
            throw new Error('Attachment missing storage key');
          }
          
          return {
            fileId: att._id,
            filename: att.filename || 'unknown',
            key: att.key,
            size: att.size || 0,
            contentType: att.contentType || 'application/octet-stream'
          };
        })
      : undefined;

    // ✅ Send message with attachments
    this.api.sendMessageWithAttachments(
      this.currentUserId, 
      recipientIds, 
      content, 
      this.chat._id, 
      attachments,
      replyToMessageId
    ).subscribe({
      next: (sentMessage) => {
        const existingMessage = this.messages.find(m => m._id === sentMessage._id);
        
        if (!existingMessage) {
          this.messages.push(sentMessage);
        } else {
          const index = this.messages.findIndex(m => m._id === sentMessage._id);
          if (index !== -1) {
            this.messages[index] = sentMessage;
          }
        }
        
        // Update last message content
        if (content) {
          this.chat.lastMessageContent = content;
        } else if (attachments && attachments.length > 0) {
          this.chat.lastMessageContent = `📎 ${attachments.length} attachment(s)`;
        }
        this.chat.lastMessageDate = new Date();
        
        // ✅ Clear form
        this.newMessage = '';
        this.pendingAttachments = [];
        this.cancelReply(); 
        
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('❌ Error sending message:', error);
        console.error('❌ Error response:', error.error);
        console.error('❌ Error status:', error.status);
        
        if (error.status === 404) {
          alert('Chat not found. Please refresh the page.');
        } else if (error.status === 403) {
          alert('You do not have permission to send messages in this chat.');
        } else if (error.status === 400) {
          const errorMsg = error.error?.error || error.error?.message || 'Invalid message';
          alert(`Cannot send message: ${errorMsg}`);
        } else {
          alert('Failed to send message. Please check your connection and try again.');
        }
      }
    });
  }

  onMessageInput(): void {
    if (!this.chat?._id || !this.currentUserId) return;
    
    this.socket.emitTyping(this.chat._id, this.currentUserId, true);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.socket.emitTyping(this.chat._id, this.currentUserId, false);
    }, 2000);
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    
    if (event.key === 'Escape' && this.replyingToMessage) {
      this.cancelReply();
    }
  }

  // ========================================
  // REPLY FUNCTIONALITY
  // ========================================
  startReply(message: Message) {
    this.replyingToMessage = {
      _id: message._id,
      content: message.content,
      timestamp: message.timestamp,
      senderId: message.senderId,
      senderUsername: message.senderUsername,
      senderFullName: message.senderFullName
    };
    
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }, 100);
    
    this.cdr.detectChanges();
  }

  cancelReply() {
    this.replyingToMessage = null;
    this.cdr.detectChanges();
  }

  getReplyToSenderName(replyMessage: any): string {
    if (replyMessage.senderId === this.currentUserId) return 'You';
    if (replyMessage.senderUsername) return replyMessage.senderUsername.split('@')[0];
    if (replyMessage.senderFullName) return replyMessage.senderFullName;
    
    if (this.chat.participantsDetails && replyMessage.senderId) {
      const sender = this.chat.participantsDetails.find(u => u.userId === replyMessage.senderId);
      if (sender) {
        return sender.displayName || `${sender.firstname || ''} ${sender.lastname || ''}`.trim() || 'Unknown User';
      }
    }
    
    return 'Unknown User';
  }

  // ========================================
  // MESSAGE OPERATIONS
  // ========================================
  deleteMessage(message: Message) {
    if (message.senderId !== this.currentUserId || !confirm('Delete this message?')) return;
  
    this.api.deleteMessage(message._id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m._id !== message._id);
        if (this.replyingToMessage && this.replyingToMessage._id === message._id) {
          this.cancelReply();
        }
        this.updateChatLastMessage();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting message:', error);
      }
    });
  }

  private updateChatLastMessage(): void {
    if (!this.chat) return;
  
    const sortedMessages = [...this.messages].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  
    if (sortedMessages.length > 0) {
      const lastMessage = sortedMessages[0];
      this.chat.lastMessageContent = lastMessage.content;
      this.chat.lastMessageDate = lastMessage.timestamp;
    } else {
      this.chat.lastMessageContent = 'No messages yet';
      this.chat.lastMessageDate = this.chat.createdAt || new Date();
    }
  
    this.chatUpdated.emit({
      chat: this.chat,
      updates: {
        lastMessageContent: this.chat.lastMessageContent,
        lastMessageDate: this.chat.lastMessageDate
      }
    });
  }

  // ========================================
  // MENU OPERATIONS
  // ========================================
  showChatMenu(event: Event, menu: Menu) {
    event.stopPropagation();
    if (!this.chat) return;

    const menuActions: ChatMenuActions = {
      onChatUpdated: (updatedChat, updates) => {
        this.chatUpdated.emit({ chat: updatedChat, updates });
        this.cdr.detectChanges();
      },
      onChatDeleted: (deletedChat) => {
        this.handleChatDeletion(deletedChat);
      }
    };

    this.menuItems = this.chatMenuService.generateMenuItems(this.chat, menuActions);
    menu.toggle(event);
  }

  showMessageContextMenu(event: Event, message: Message, menu: Menu) {
    event.preventDefault();
    event.stopPropagation();

    this.messageMenuItems = [
      {
        label: 'Reply',
        icon: 'pi pi-reply',
        command: () => this.startReply(message)
      }
    ];

    if (this.isSent(message)) {
      this.messageMenuItems.push(
        { separator: true },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          styleClass: 'text-red-500',
          command: () => this.deleteMessage(message)
        }
      );
    }

    menu.toggle(event);
  }

  private handleChatDeletion(chat: Chat): void {
    if (this.deletingChats.has(chat._id)) return;

    this.deletingChats.add(chat._id);

    this.api.deleteChat(chat._id).subscribe({
      next: () => {
        this.deletingChats.delete(chat._id);
        this.deleteChat.emit(chat);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.deletingChats.delete(chat._id);
        if (error.status === 404) {
          this.deleteChat.emit(chat);
          this.cdr.detectChanges();
        }
      }
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================
  private scrollToBottom() {
    setTimeout(() => {
      try {
        if (this.scrollPanel) {
          const scrollElement = this.scrollPanel.contentViewChild?.nativeElement;
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
            return;
          }
  
          const container = this.scrollPanel.el?.nativeElement;
          if (container) {
            const content = container.querySelector('.p-scrollpanel-content');
            if (content) {
              content.scrollTop = content.scrollHeight;
              return;
            }
          }
  
          if (this.scrollPanel.el?.nativeElement) {
            const wrapper = this.scrollPanel.el.nativeElement.querySelector('.p-scrollpanel-wrapper');
            if (wrapper) {
              wrapper.scrollTop = wrapper.scrollHeight;
            }
          }
        }
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
      }
    }, 100);
  }

  // ========================================
  // MESSAGE STATUS METHODS
  // ========================================
  getMessageStatus(msg: Message): 'sent' | 'delivered' | 'read' {
    if (!this.isSent(msg)) return 'sent';
    if (msg.readBy && msg.readBy.length > 0) return 'read';
    if (msg.deliveredTo && msg.deliveredTo.length > 0) return 'delivered';
    return 'sent';
  }

  // ========================================
  // UI HELPER METHODS
  // ========================================
  getChatName(): string {
    if (this.chat.type === 'group' && this.chat.name) return this.chat.name;

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      if (this.chat.type === 'direct') {
        const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
        return otherUser ? (otherUser.displayName || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim()) : 'Unknown User';
      }
      return this.chat.participantsDetails
        .filter(u => u.userId !== this.currentUserId)
        .map(u => u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim())
        .join(', ');
    }

    return this.chat.type === 'group' ? 'Group Chat' : 'Direct Chat';
  }

  getChatSubtitle(): string {
    if (this.chat.type === 'group') {
      return `${this.chat.participants.length} members`;
    }

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser?.userType || 'User';
    }

    return 'Direct Message';
  }

  getSenderName(msg: Message): string {
    if (msg.senderUsername) return msg.senderUsername;
    if (msg.senderFullName) return msg.senderFullName;
  
    if (this.chat.participantsDetails && msg.senderId) {
      const sender = this.chat.participantsDetails.find(u => u.userId === msg.senderId);
      if (sender) {
        return sender.displayName || `${sender.firstname || ''} ${sender.lastname || ''}`.trim() || 'Unknown User';
      }
    }
  
    return msg.senderId === this.currentUserId ? 'You' : 'Unknown User';
  }

  getTypingUserName(): string {
    if (!this.typingFrom) return 'Someone';

    if (this.chat.participantsDetails) {
      const typingUser = this.chat.participantsDetails.find(u => u.userId === this.typingFrom);
      if (typingUser) {
        const firstname = typingUser.firstname || typingUser.displayName?.split(' ')[0];
        return firstname || 'Someone';
      }
    }

    return 'Someone';
  }

  getAvatarInitials(): string {
    if (this.chat.type === 'group') {
      if (this.chat.name) {
        const words = this.chat.name.split(' ');
        return words.length > 1 
          ? words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
          : this.chat.name.substring(0, 2).toUpperCase();
      }
      return 'GRP';
    }

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
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

    return 'CH';
  }

  getAvatarColor(): string {
    const colors = [
      '#4F8A8B', '#6B73FF', '#9B59B6', '#E74C3C', 
      '#F39C12', '#27AE60', '#34495E', '#E67E22'
    ];
    const index = (this.chat._id || '').length % colors.length;
    return colors[index];
  }

  isOnline(): boolean {
    if (this.chat.type === 'group') return this.online;

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser?.isOnline || false;
    }

    return this.online;
  }

  getUserRole(): string {
    if (this.chat.type === 'group') return 'Group';

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser?.userType || 'User';
    }

    return 'User';
  }

  getRoleSeverity(): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const role = this.getUserRole();
    switch(role.toLowerCase()) {
      case 'teacher': return 'info';
      case 'student': return 'success';
      case 'parent': return 'warning';
      case 'manager': return 'danger';
      case 'admin': return 'contrast';
      case 'group': return 'secondary';
      default: return 'secondary';
    }
  }

  isSent = (m: Message) => m.senderId === this.currentUserId;
  isSentUser = (uid: string) => uid === this.currentUserId;

  trackByMessageId(index: number, message: Message): string {
    return message._id;
  }
}