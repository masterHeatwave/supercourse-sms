// new-chat-dialog.component.ts - FIXED TypeScript errors
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TreeSelectModule } from 'primeng/treeselect';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';
import { Chat, ParticipantDetail } from '../models/chat.models';

export interface NewChatData {
  participants: string[];
  type: 'direct' | 'group';
  name?: string;
  chat?: any; 
}

interface UserInTaxi {
  _id: string;
  user: string;
  username: string;
  userType: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

interface User {
  _id: string;
  user: string;
  username: string;
  userType: string;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  level: string;
  students: UserInTaxi[];
  teachers: UserInTaxi[];
}

// ✅ API Response types
interface ApiUserResponse {
  _id: string;
  user: string;
  username: string;
  user_type: string;
}

interface ApiClassResponse {
  _id: string;
  name: string;
  subject?: string;
  level?: string;
  students?: ApiUserInClassResponse[];
  teachers?: ApiUserInClassResponse[];
}

interface ApiUserInClassResponse {
  _id: string;
  user: string;
  username: string;
  userType: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

@Component({
  selector: 'app-new-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TreeSelectModule,
    ButtonModule,
    InputTextModule,
    TagModule
  ],
  templateUrl: './new-chat-dialog.component.html',
  styleUrls: ['./new-chat-dialog.component.scss']
})
export class NewChatDialogComponent implements OnInit {
  @Input() currentUserId: string = ''; 
  @Output() chatCreated = new EventEmitter<NewChatData>();
  @Output() dialogClosed = new EventEmitter<void>();

  visible = false;
  recipientTree: TreeNode[] = [];
  selectedRecipients: TreeNode[] = [];
  groupName = '';
  users: User[] = [];
  classes: Class[] = [];

  // Cache to prevent endless loops
  private _cachedSelectedUsers: TreeNode[] = [];
  private _cachedSelectedUsersList: any[] = [];
  private _lastSelectionString: string = '';
  
  // Loading states
  isLoadingUsers = false;
  isLoadingClasses = false;

  constructor(private apiService: MessagingWrapperService) {}

  ngOnInit() {
    console.log('🎬 NewChatDialogComponent initialized with userId:', this.currentUserId);
  }

  show() {
    console.log('📖 Opening new chat dialog...');
    this.visible = true;
    this.resetForm();
    
    // Always reload data when dialog opens to ensure fresh data
    this.loadUsers();
    this.loadClasses();
  }

  hide() {
    console.log('📕 Closing new chat dialog...');
    this.visible = false;
    this.dialogClosed.emit();
  }

  private resetForm() {
    this.selectedRecipients = [];
    this.groupName = '';
    this._cachedSelectedUsers = [];
    this._cachedSelectedUsersList = [];
    this._lastSelectionString = '';
  }

  private loadUsers() {
    if (!this.currentUserId) {
      console.error('❌ Cannot load users - no currentUserId provided');
      return;
    }
  
    console.log('👥 Loading users...');
    this.isLoadingUsers = true;
  
    this.apiService.getUsers().subscribe({
      next: (response: any) => {
        console.log('✅ Users loaded:', response);
        
        // ✅ The service now returns the transformed array directly
        // No need to extract from response.data anymore
        this.users = response
          .filter((user: any) => {
            const userId = user._id || user.user;
            return userId && userId.toString() !== this.currentUserId;
          })
          .map((user: any) => ({
            _id: user._id,
            user: user._id, // Just use _id, they're the same
            username: user.username,
            userType: user.userType || user.user_type || 'user'
          }));
        
        console.log(`📊 Processed ${this.users.length} users after filtering`);
        console.log('🔍 Sample user:', this.users[0]);
        this.isLoadingUsers = false;
        this.buildRecipientTreeIfReady();
      },
      error: (err: any) => {
        console.error('❌ Error fetching users:', err);
        this.users = [];
        this.isLoadingUsers = false;
        this.buildRecipientTreeIfReady();
      }
    });
  }

  private loadClasses() {
    console.log('🏫 Loading classes...');
    this.isLoadingClasses = true;
  
    this.apiService.getClasses().subscribe({
      next: (response: any) => {
        console.log('✅ Classes loaded:', response);
        
        // ✅ The service returns transformed classes directly
        this.classes = response.map((classItem: any) => ({
          _id: classItem._id,
          name: classItem.name,
          subject: classItem.subject || '',
          level: classItem.level || '',
          students: classItem.students || [],
          teachers: classItem.teachers || []
        }));
        
        console.log(`📊 Processed ${this.classes.length} classes`);
        console.log('🔍 Sample class:', this.classes[0]);
        this.isLoadingClasses = false;
        this.buildRecipientTreeIfReady();
      },
      error: (err: any) => {
        console.error('❌ Error fetching classes:', err);
        this.classes = [];
        this.isLoadingClasses = false;
        this.buildRecipientTreeIfReady();
      }
    });
  }

  /**
   * Only build tree when BOTH users and classes are loaded
   */
  private buildRecipientTreeIfReady() {
    if (this.isLoadingUsers || this.isLoadingClasses) {
      console.log('⏳ Waiting for data to load...', {
        loadingUsers: this.isLoadingUsers,
        loadingClasses: this.isLoadingClasses
      });
      return;
    }

    console.log('🌳 Building recipient tree with:', {
      users: this.users.length,
      classes: this.classes.length
    });

    this.buildRecipientTree();
  }

  private buildRecipientTree() {

    console.log('🔍 All users:', this.users);
    console.log('🔍 User types:', [...new Set(this.users.map(u => u.userType))]);

    const makeUserNode = (user: User | UserInTaxi): TreeNode => {
      const userKey = user.user || user._id;
      const username = user.username;
      const userType = user.userType;
      
      return {
        key: userKey.toString(),
        label: this.extractDisplayName(username),
        selectable: true,
        leaf: true,
        type: 'user',
        data: user
      };
    };
  
    const makeParentNode = (
      key: string, 
      label: string, 
      children: TreeNode[], 
      icon?: string, 
      selectable = true,
      type = 'category'
    ): TreeNode => ({
      key,
      label,
      selectable,
      expanded: false,
      children,
      type,
      icon: icon || this.getUserTypeIcon(key)
    });
  
    // Build user categories - ✅ Explicit type for filter predicate
    const teacherNodes = this.users
      .filter((u: User) => u.userType?.toLowerCase() === 'teacher')
      .map((u: User) => makeUserNode(u));
      
    const studentNodes = this.users
      .filter((u: User) => u.userType?.toLowerCase() === 'student')
      .map((u: User) => makeUserNode(u));
      
    const parentNodes = this.users
      .filter((u: User) => u.userType?.toLowerCase() === 'parent')
      .map((u: User) => makeUserNode(u));
      
    const managerNodes = this.users
      .filter((u: User) => u.userType?.toLowerCase() === 'manager')
      .map((u: User) => makeUserNode(u));
      
    const adminNodes = this.users
      .filter((u: User) => u.userType?.toLowerCase() === 'admin')
      .map((u: User) => makeUserNode(u));
  
    // Build classes category - ✅ Explicit type for map
    const classNodes = this.classes.map((classItem: Class) => {
      const classUsers: (User | UserInTaxi)[] = [
        ...classItem.students,
        ...classItem.teachers
      ];
  
      const classUserNodes = classUsers
        .filter((user: User | UserInTaxi) => {
          const userId = user.user || user._id;
          return userId.toString() !== this.currentUserId;
        })
        .map((user: User | UserInTaxi) => makeUserNode(user));
  
      return makeParentNode(
        `class-${classItem._id}`,
        `${classItem.name} - ${classItem.subject} (${classItem.level}) • ${classUserNodes.length} users`,
        classUserNodes,
        'pi pi-book',
        true,
        'class'
      );
    });
  
    // Build the complete tree
    this.recipientTree = [];
  
    if (teacherNodes.length > 0) {
      this.recipientTree.push(makeParentNode('teachers', `Teachers (${teacherNodes.length})`, teacherNodes));
    }
    if (studentNodes.length > 0) {
      this.recipientTree.push(makeParentNode('students', `Students (${studentNodes.length})`, studentNodes));
    }
    if (parentNodes.length > 0) {
      this.recipientTree.push(makeParentNode('parents', `Parents (${parentNodes.length})`, parentNodes));
    }
    if (managerNodes.length > 0) {
      this.recipientTree.push(makeParentNode('managers', `Managers (${managerNodes.length})`, managerNodes));
    }
    if (adminNodes.length > 0) {
      this.recipientTree.push(makeParentNode('admins', `Admins (${adminNodes.length})`, adminNodes));
    }
  
    if (classNodes.length > 0) {
      this.recipientTree.push(
        makeParentNode(
          'classes', 
          `Classes (${classNodes.length})`, 
          classNodes,
          'pi pi-building',
          false,
          'category'
        )
      );
    }
  }

  private extractDisplayName(username: string): string {
    if (username && username.includes('@')) {
      const localPart = username.split('@')[0];
      return localPart.split('.').map((part: string) => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    return username || 'Unknown';
  }

  private getUserTypeIcon(userType: string): string {
    const icons: { [key: string]: string } = {
      teachers: 'pi pi-user-plus',
      students: 'pi pi-user',
      parents: 'pi pi-users',
      managers: 'pi pi-briefcase',
      admins: 'pi pi-shield',
      classes: 'pi pi-book'
    };
    return icons[userType] || 'pi pi-user';
  }

  /**
   * CACHED: Prevents endless loop by caching results
   */
  getSelectedUserCount(): number {
    const selectionString = JSON.stringify(this.selectedRecipients.map((n: TreeNode) => n.key));
    
    if (selectionString === this._lastSelectionString && this._cachedSelectedUsers.length > 0) {
      return this._cachedSelectedUsers.length;
    }
    
    this._lastSelectionString = selectionString;
    this._cachedSelectedUsers = this.getActualSelectedUsers();
    this._cachedSelectedUsersList = [];
    
    return this._cachedSelectedUsers.length;
  }

  /**
   * CACHED: Uses cached selected users
   */
  getSelectedUsersList(): any[] {
    if (this._cachedSelectedUsersList.length > 0) {
      return this._cachedSelectedUsersList;
    }
    
    const actualUsers = this._cachedSelectedUsers.length > 0 
      ? this._cachedSelectedUsers 
      : this.getActualSelectedUsers();
    
    this._cachedSelectedUsersList = actualUsers.map((node: TreeNode) => {
      const userId = node.key!;
      
      let user = this.users.find((u: User) => u.user === userId || u._id === userId);
      
      if (!user) {
        for (const classItem of this.classes) {
          const allClassUsers = [...classItem.students, ...classItem.teachers];
          const foundUser = allClassUsers.find((u: UserInTaxi) => u._id === userId || u.user === userId);
          if (foundUser) {
            user = {
              _id: foundUser._id,
              user: foundUser.user,
              username: foundUser.username,
              userType: foundUser.userType
            } as User;
            break;
          }
        }
      }
  
      if (user) {
        return {
          userId: user.user || user._id,
          displayName: this.extractDisplayName(user.username),
          userType: user.userType,
          username: user.username
        };
      }
  
      if (node.data) {
        const nodeData = node.data as any;
        return {
          userId: nodeData._id || nodeData.user || userId,
          displayName: this.extractDisplayName(nodeData.username),
          userType: nodeData.userType,
          username: nodeData.username
        };
      }
  
      return null;
    }).filter((user: any) => user !== null);

    return this._cachedSelectedUsersList;
  }

  private getActualSelectedUsers(): TreeNode[] {
    const userNodes: TreeNode[] = [];
    const seenUserIds = new Set<string>();
    
    const findNodeInTree = (treeNodes: TreeNode[], key: string): TreeNode | null => {
      for (const treeNode of treeNodes) {
        if (treeNode.key === key) {
          return treeNode;
        }
        if (treeNode.children) {
          const found = findNodeInTree(treeNode.children, key);
          if (found) return found;
        }
      }
      return null;
    };
  
    const addUniqueUser = (node: TreeNode) => {
      if (node.type === 'user' && node.leaf && node.key) {
        if (!seenUserIds.has(node.key)) {
          seenUserIds.add(node.key);
          userNodes.push(node);
        }
      }
    };
  
    this.selectedRecipients.forEach((selectedNode: TreeNode) => {
      const fullNode = findNodeInTree(this.recipientTree, selectedNode.key!);
      
      if (fullNode) {
        if (fullNode.type === 'user' && fullNode.leaf) {
          addUniqueUser(fullNode);
        } else if (fullNode.children && (fullNode.type === 'class' || fullNode.type === 'category')) {
          const addUserChildren = (node: TreeNode) => {
            if (node.type === 'user' && node.leaf) {
              addUniqueUser(node);
            } else if (node.children) {
              node.children.forEach((child: TreeNode) => addUserChildren(child));
            }
          };
          fullNode.children.forEach((child: TreeNode) => addUserChildren(child));
        }
      }
    });
  
    return userNodes;
  }

  getChatTypeInfo(): string {
    const count = this.getSelectedUserCount();
    if (count === 0) return 'Select users to start chatting';
    if (count === 1) return 'Direct conversation with 1 person';
    return `Group conversation with ${count} people`;
  }

  getRoleSeverity(role: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    switch(role?.toLowerCase()) {
      case 'teacher': return 'info';
      case 'student': return 'success';
      case 'parent':  return 'warning';
      case 'manager': return 'danger';
      case 'admin':   return 'contrast';
      default: return 'secondary';
    }
  }

  onCancel() {
    this.hide();
  }

  onCreate() {
    if (!this.currentUserId) {
      console.error('❌ Cannot create chat - no currentUserId');
      return;
    }

    const actualUsers = this._cachedSelectedUsers.length > 0 
      ? this._cachedSelectedUsers 
      : this.getActualSelectedUsers();
      
    if (actualUsers.length === 0) {
      console.warn('⚠️ No users selected');
      alert('Please select at least one recipient');
      return;
    }

    const participantIds = actualUsers.map((node: TreeNode) => node.key!);
    const allParticipants = [this.currentUserId, ...participantIds];
    const chatType = participantIds.length === 1 ? 'direct' : 'group';
    
    // ✅ FIX 3: Auto-generate group name if empty
    let chatName = chatType === 'group' ? this.groupName.trim() : '';
    if (chatType === 'group' && !chatName) {
      const selectedUsersList = this.getSelectedUsersList();
      const userNames = selectedUsersList.slice(0, 3).map(u => u.displayName);
      chatName = userNames.join(', ') + (selectedUsersList.length > 3 ? '...' : '');
      console.log('🏷️ Auto-generated group name:', chatName);
    }

    console.log('📨 Creating chat via API:', {
      participants: allParticipants,
      type: chatType,
      name: chatName
    });

    // ✅ FIX 4: Remove duplicate code and properly create chat
    this.apiService.createChat({
      participants: allParticipants,
      type: chatType,
      name: chatName
    }).subscribe({
      next: (createdChat: any) => {
        console.log('✅ Chat created successfully:', createdChat);
        
        // ✅ FIX 5: Emit the complete data including the created chat
        const newChatData: NewChatData = {
          participants: allParticipants,
          type: chatType,
          name: chatName,
          chat: createdChat // Now this matches the interface
        };
        
        this.chatCreated.emit(newChatData);
        this.hide();
      },
      error: (error: any) => {
        console.error('❌ Failed to create chat:', error);
        alert('Failed to create chat. Please try again.');
      }
    });
  }

  getEmptyMessage(): string {
    if (this.isLoadingUsers || this.isLoadingClasses) {
      return 'Loading...';
    }
    if (this.recipientTree.length === 0) {
      return 'No users or classes available';
    }
    return 'No users found';
  }

  private removeLingeringOverlays(): void {
    // Give Angular time to clean up
    setTimeout(() => {
      // Find all PrimeNG modal overlays
      const overlays = document.querySelectorAll('.p-dialog-mask, .p-component-overlay');
      
      overlays.forEach(overlay => {
        // Check if this overlay belongs to a hidden dialog
        const dialog = overlay.querySelector('.p-dialog');
        if (!dialog || dialog.getAttribute('aria-hidden') === 'true') {
          overlay.remove();
        }
      });
      
      // Also clean up any orphaned treeselect panels
      const treePanels = document.querySelectorAll('.p-treeselect-panel');
      treePanels.forEach(panel => {
        if ((panel as HTMLElement).style.display === 'none' || !panel.isConnected) {
          panel.remove();
        }
      });
      
      // Re-enable body scroll if it was disabled
      document.body.style.overflow = '';
      document.body.classList.remove('p-overflow-hidden');
    }, 100);
  }

  private cleanup(): void {
    console.log('🧹 Cleaning up new chat dialog state');
    
    // Reset all state
    this.selectedRecipients = [];
    this.groupName = '';
    this._cachedSelectedUsers = [];
    
    // ✅ CRITICAL: Remove any lingering PrimeNG overlays
    this.removeLingeringOverlays();
  }

  ngOnDestroy(): void {
    // ✅ CRITICAL: Clean up on destroy
    this.cleanup();
  }

}