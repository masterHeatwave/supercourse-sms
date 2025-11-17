// services/messaging/chat-menu.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { Chat } from '../../components/messaging/models/chat.models';
import { MessagingWrapperService } from './messaging-wrapper.service';
import { SocketService } from '../socket/socket.service';
import { AuthStoreService } from './auth-store.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface ChatMenuActions {
  onChatUpdated?: (chat: Chat, updates: any) => void;
  onChatDeleted?: (chat: Chat) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ChatMenuService {
  // ✅ Inject services using inject()
  private api = inject(MessagingWrapperService);
  private socket = inject(SocketService);
  private authService = inject(AuthStoreService);
  private translate = inject(TranslateService);
  
  // Track chats being deleted/updated to prevent duplicates
  private deletingChats = new Set<string>();
  private updatingChats = new Set<string>();

  /**
   * Generate menu items for a chat with all the available actions
   */
  generateMenuItems(chat: Chat, actions: ChatMenuActions = {}): MenuItem[] {
    if (!chat) return [];

    // ✅ Get current user ID synchronously for immediate UI rendering
    const currentUserId = this.authService.getCurrentUserIDSync();
    const isDeleting = this.deletingChats.has(chat._id);
    const isUpdating = this.updatingChats.has(chat._id);
    const hasUnread = (chat.unreadCount?.[currentUserId] || 0) > 0;

    return [
      {
        label: this.translate.instant(
          hasUnread ? 'messages.actions.mark_as_read' : 'messages.actions.mark_as_unread'
        ),
        icon: hasUnread ? 'pi pi-check-circle' : 'pi pi-circle',
        command: () => this.toggleReadStatus(chat, actions),
        disabled: isDeleting || isUpdating
      },
      {
        label: this.translate.instant(
          chat.isStarred 
            ? 'messages.actions.remove_from_favorites' 
            : 'messages.actions.add_to_favorites'
        ),
        icon: chat.isStarred ? 'pi pi-star-fill' : 'pi pi-star',
        command: () => this.toggleFavorite(chat, actions),
        disabled: isDeleting || isUpdating
      },
      {
        label: this.translate.instant(
          chat.isPinned ? 'messages.actions.unpin_chat' : 'messages.actions.pin_chat'
        ),
        icon: chat.isPinned ? 'pi pi-thumbtack' : 'pi pi-thumbtack',
        command: () => this.togglePin(chat, actions),
        disabled: isDeleting || isUpdating
      },
      {
        label: this.translate.instant(
          chat.isMuted ? 'messages.actions.unmute' : 'messages.actions.mute'
        ),
        icon: chat.isMuted ? 'pi pi-volume-up' : 'pi pi-volume-off',
        command: () => this.toggleMute(chat, actions),
        disabled: isDeleting || isUpdating
      },
      {
        label: this.translate.instant(
          chat.isArchived ? 'messages.actions.unarchive' : 'messages.actions.archive'
        ),
        icon: chat.isArchived ? 'pi pi-inbox' : 'pi pi-folder',
        command: () => chat.isArchived 
          ? this.unarchiveChat(chat, actions) 
          : this.archiveChat(chat, actions),
        disabled: isDeleting || isUpdating
      },
      {
        separator: true
      },
      {
        label: this.translate.instant(
          isDeleting ? 'messages.actions.deleting' : 'messages.actions.delete_chat'
        ),
        icon: isDeleting ? 'pi pi-spin pi-spinner' : 'pi pi-trash',
        styleClass: 'text-red-500',
        command: () => this.confirmDeleteChat(chat, actions),
        disabled: isDeleting
      }
    ];
  }

  /**
   * Toggle read status of a chat
   */
  toggleReadStatus(chat: Chat, actions: ChatMenuActions = {}): void {
    // ✅ Use observable pattern with take(1) for one-time async operation
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) {
        console.error('Cannot toggle read status: No user ID');
        return;
      }

      const isCurrentlyUnread = (chat.unreadCount?.[currentUserId] || 0) > 0;
      const newUnreadCount = { ...chat.unreadCount };
      
      if (isCurrentlyUnread) {
        newUnreadCount[currentUserId] = 0;
      } else {
        newUnreadCount[currentUserId] = 1;
      }

      const updates = { unreadCount: newUnreadCount };
      this.updateChatAndNotify(chat, updates, actions);
    });
  }

  /**
   * Toggle favorite status of a chat
   */
  toggleFavorite(chat: Chat, actions: ChatMenuActions = {}): void {
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) return;
  
      const newIsStarred = !chat.isStarred;
      const updates = { isStarred: newIsStarred };
      
      console.log(newIsStarred ? '⭐ Added to favorites:' : '☆ Removed from favorites:', chat._id);
      
      this.updateChatAndNotify(chat, updates, actions);
    });
  }
  
  togglePin(chat: Chat, actions: ChatMenuActions = {}): void {
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) return;
  
      const newIsPinned = !chat.isPinned;
      const updates = { isPinned: newIsPinned };
      
      console.log(newIsPinned ? '📌 Pinned chat:' : '📍 Unpinned chat:', chat._id);
      
      this.updateChatAndNotify(chat, updates, actions);
    });
  }
  
  toggleMute(chat: Chat, actions: ChatMenuActions = {}): void {
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) return;
  
      const newIsMuted = !chat.isMuted;
      const updates = { isMuted: newIsMuted };
      
      console.log(newIsMuted ? '🔇 Muted chat:' : '🔊 Unmuted chat:', chat._id);
      
      this.updateChatAndNotify(chat, updates, actions);
    });
  }
  
  archiveChat(chat: Chat, actions: ChatMenuActions = {}): void {
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) return;
  
      const updates = { isArchived: true };
      
      console.log('📦 Archived chat:', chat._id);
      
      this.updateChatAndNotify(chat, updates, actions);
    });
  }
  
  unarchiveChat(chat: Chat, actions: ChatMenuActions = {}): void {
    this.authService.getCurrentUserID$().pipe(take(1)).subscribe(currentUserId => {
      if (!currentUserId) return;
  
      const updates = { isArchived: false };
      
      console.log('📂 Unarchived chat:', chat._id);
      
      this.updateChatAndNotify(chat, updates, actions);
    });
  }

  /**
   * Confirm and delete a chat
   */
  confirmDeleteChat(chat: Chat, actions: ChatMenuActions = {}): void {
    // Prevent duplicate deletion attempts
    if (this.deletingChats.has(chat._id)) {
      console.log('Chat deletion already in progress for:', chat._id);
      return;
    }

    const chatName = this.getChatName(chat);
    
    if (confirm(`Are you sure you want to delete the conversation with ${chatName}?`)) {
      this.deleteChat(chat, actions);
    }
  }

  /**
   * Delete a chat - delegates to parent component
   */
  deleteChat(chat: Chat, actions: ChatMenuActions = {}): void {
    console.log('🗑️ ChatMenuService requesting deletion for:', chat._id);
    
    // Just emit to parent component to handle the deletion
    if (actions.onChatDeleted) {
      actions.onChatDeleted(chat);
    }
  }

  /**
   * Method for parent components to call when deletion is complete
   */
  onChatDeletionComplete(chatId: string): void {
    this.deletingChats.delete(chatId);
  }

  /**
   * Method for parent components to call when deletion fails
   */
  onChatDeletionFailed(chatId: string): void {
    this.deletingChats.delete(chatId);
  }

  /**
   * Check if a chat is currently being deleted
   */
  isChatBeingDeleted(chatId: string): boolean {
    return this.deletingChats.has(chatId);
  }

  /**
   * Update chat properties and notify parent components
   * ✅ FIXED: Now accepts userId parameter for user-specific settings
   */
  private updateChatAndNotify(chat: Chat, updates: any, actions: ChatMenuActions): void {
    if (this.updatingChats.has(chat._id)) {
      console.log('⚠️ Chat update already in progress for:', chat._id);
      return;
    }
  
    this.updatingChats.add(chat._id);
  
    // Optimistic update
    Object.assign(chat, updates);
    
    if (actions.onChatUpdated) {
      actions.onChatUpdated(chat, updates);
    }
    
    console.log('📤 Sending update to API:', { chatId: chat._id, updates });
    
    // ✅ SIMPLIFIED: Don't pass userId
    this.api.updateChat(chat._id, updates).subscribe({
      next: (updatedChat) => {
        console.log('✅ Chat updated successfully:', updatedChat);
        
        Object.assign(chat, updatedChat);
        this.updatingChats.delete(chat._id);
        
        if (actions.onChatUpdated) {
          actions.onChatUpdated(chat, updatedChat);
        }
      },
      error: (error) => {
        console.error('❌ Error updating chat:', error);
        this.updatingChats.delete(chat._id);
        
        if (error.status === 404) {
          alert('This conversation no longer exists. Please refresh the page.');
        } else {
          alert('Failed to update conversation settings. Please try again.');
        }
      }
    });
  }

  /**
   * Get display name for a chat
   */
  private getChatName(chat: Chat): string {
    // ✅ Get current user ID for filtering
    const currentUserId = this.authService.getCurrentUserIDSync();
    
    if (chat.type === 'group' && chat.name) {
      return chat.name;
    }
  
    if (chat.participantsDetails && chat.participantsDetails.length > 0) {
      if (chat.type === 'direct') {
        // ✅ Fixed: use userId for comparison, not _id
        const otherUser = chat.participantsDetails.find(u => u.userId !== currentUserId);
        return otherUser
          ? (otherUser.displayName || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim())
          : 'Unknown User';
      }
  
      // For group chats, show all other participants
      return chat.participantsDetails
        .filter(u => u.userId !== currentUserId)
        .map(u => u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim())
        .join(', ');
    }
  
    // Fallback
    return chat.participants && chat.participants.length > 2 ? 'Group Chat' : 'Direct Chat';
  }
}