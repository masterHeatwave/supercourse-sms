// new-chat-dialog.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TreeSelectModule } from 'primeng/treeselect';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';
import { Chat } from '../models/chat.models';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';

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
  branchId?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
}

interface User {
  _id: string;
  user: string;
  username: string;
  userType: string;
  branchId?: string;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  level: string;
  branchId?: string;
  students: UserInTaxi[];
  teachers: UserInTaxi[];
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
export class NewChatDialogComponent implements OnInit, OnDestroy {
  @Input() currentUserId: string = '';
  @Output() chatCreated = new EventEmitter<NewChatData>();
  @Output() dialogClosed = new EventEmitter<void>();

  visible = false;
  recipientTree: TreeNode[] = [];
  selectedRecipients: TreeNode[] = [];
  groupName = '';
  users: User[] = [];
  classes: Class[] = [];

  private _cachedSelectedUsers: TreeNode[] = [];
  private _cachedSelectedUsersList: any[] = [];
  private _lastSelectionString: string = '';

  
  private userRole: string = '';
  private userBranchId: string = '';
  private isActive: boolean = false;
  private userClassIds: string[] = []; // Track user's class memberships

  store = inject(Store);

  isLoadingUsers = false;
  isLoadingClasses = false;

  constructor(private apiService: MessagingWrapperService) {
    this.store.select(selectAuthState).subscribe({
      next: (authState: any) => {
        console.log('🏢 Auth State:', {
          role: authState.currentRoleTitle,
          branch: authState.currentBranchId,
          userId: authState.userId,
          isActive: authState.is_active
        });
        
        
        this.userRole = authState.currentRoleTitle?.toLowerCase() || '';
        this.userBranchId = authState.currentBranchId || '';
        this.isActive = authState.is_active || false;
        
        // ✅ IMPORTANT: Store user's class IDs for filtering
        this.userClassIds = authState.classIds || [];
      }
    });
  }

  ngOnInit() {
    console.log('🎬 Initialized NewChatDialogComponent', {
      userId: this.currentUserId,
      role: this.userRole,
      branch: this.userBranchId,
      isActive: this.isActive
    });
  }

  show() {
    this.visible = true;
    this.resetForm();
    this.loadUsers();
    this.loadClasses();
  }

  hide() {
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

  /**
   * Role-based user filtering :
   * - Admin/Manager: Can chat with anyone
   * - Teacher: Can chat with admins, managers (same branch), students in their classes, parents of those students
   * - Student: Can chat with admins, managers (same branch), teachers in their classes, parents in their classes
   * - Parent: Same as student (admins, managers in branch, teachers/students in child's classes)
   */
  private filterUsersByRole(users: any[]): any[] {
    const currentRole = this.userRole;
    const currentBranch = this.userBranchId;
    const currentUserId = this.currentUserId;

    const filtered = users.filter((user) => {
      // Never show yourself
      if (user._id === currentUserId) return false;

      const userRole = (user.userType || '').toLowerCase();
      const userBranch = user.branchId || '';

      switch (currentRole) {
        case 'admin':
        case 'manager':
          //   Admins and Managers can chat with everyone
          return true;

        case 'teacher':
          //  Teachers can chat with:
          // - All admins (any branch)
          // - Managers in their branch
          // - Students in their classes (handled by class membership)
          // - Parents of students in their classes (handled by class membership)
          return (
            (userRole === 'admin' && userBranch === currentBranch) ||
            (userRole === 'manager' && userBranch === currentBranch) ||
            (userRole === 'student' && userBranch === currentBranch) || // Will be further filtered by class membership
            (userRole === 'parent' && userBranch === currentBranch) || // Will be further filtered by class membership
             userRole === 'teacher'  
          );

        case 'student':
          //  Students can chat with:
          // - Managers in their branch
          // - Teachers in their classes
          // - Other students in their classes
          // - Parents in their classes
          return (
            // (userRole === 'admin' && userBranch === currentBranch) ||  To be deleted ? 
            (userRole === 'manager' && userBranch === currentBranch ) ||
            (userRole ===  'teacher' && userBranch === currentBranch) || // Will be further filtered by class membership
            // (userRole ===  'student' && userBranch === currentBranch) || Students won't communicate with each other ? Really ?
            (userRole ===  'parent' && userBranch === currentBranch)
          );

        case 'parent':
          //  Parents have same rights as students
          return (
            // (userRole === 'admin' && userBranch === currentBranch) ||
            (userRole === 'manager' && userBranch === currentBranch ) ||
            (userRole ===  'teacher' && userBranch === currentBranch) || // Will be further filtered by class membership
            (userRole ===  'student' && userBranch === currentBranch) ||
            (userRole ===  'parent' && userBranch === currentBranch)
          );

        default:
          console.warn(`⚠️ Unknown role: ${currentRole}`);
          return false;
      }
    });

    console.log(`✅ Filtered to ${filtered.length} users for role "${currentRole}"`);
    return filtered;
  }

  private loadUsers() {
    if (!this.currentUserId) {
      console.error('❌ Cannot load users - no currentUserId provided');
      return;
    }

    this.isLoadingUsers = true;

    // ✅ Use limit parameter (1000 users max)
    this.apiService.getUsers(1000).subscribe({
      next: (response: any) => {

        const activeUsers = response.filter((u: any) => u.is_active !== false);

        const filtered = this.filterUsersByRole(activeUsers);

        this.users = filtered.map((user: any) => ({
          _id: user._id,
          user: user._id,
          username: user.username,
          userType: user.userType,
          branchId: user.branchId || ''
        }));

        console.log(`📊 Final user count: ${this.users.length}`);
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

  /**
   * ✅ ENHANCED: Load classes with limit and proper filtering
   */
  private loadClasses() {
    this.isLoadingClasses = true;

    // ✅ Use limit parameter (1000 classes max)
    this.apiService.getClasses().subscribe({
      next: (response: any) => {
        console.log('✅ Classes loaded:', response.length);

        // ✅ Filter classes based on role and membership
        this.classes = response
          .filter((c: any) => this.canAccessClass(c))
          .map((classItem: any) => ({
            _id: classItem._id,
            name: classItem.name,
            subject: classItem.subject || '',
            level: classItem.level || '',
            branchId: classItem.branchId || '',
            students: classItem.students || [],
            teachers: classItem.teachers || []
          }));

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
   * ✅ ENHANCED: Determines if user can access a specific class
   */
  private canAccessClass(classItem: any): boolean {
    const role = this.userRole;
    const currentUserId = this.currentUserId;
    const currentBranch = this.userBranchId;

    // ✅ Admin/Manager: Access all classes
    if (role === 'admin') return true;
    
    // ✅ Manager: Access classes in their branch
    if (role === 'manager') {
      return classItem.branchId === currentBranch;
    }

    // ✅ Teacher: Access only classes they teach
    if (role === 'teacher') {
      return classItem.teachers?.some((t: any) => t.user === currentUserId || t._id === currentUserId);
    }

    // ✅ Student: Access only classes they're enrolled in
    if (role === 'student') {
      return classItem.students?.some((s: any) => s.user === currentUserId || s._id === currentUserId);
    }

    // ✅ Parent: Access classes where their child is enrolled
    if (role === 'parent') {
      // Check if any student in the class has this parent
      return classItem.students?.some((s: any) => 
        s.parents?.some((p: any) => p.user === currentUserId || p._id === currentUserId)
      );
    }

    return false;
  }

  private buildRecipientTreeIfReady() {
    if (this.isLoadingUsers || this.isLoadingClasses) return;
    this.buildRecipientTree();
  }

  /**
   * ✅ ENHANCED: Build tree with proper class-based filtering
   */
  private buildRecipientTree() {
    const makeUserNode = (user: User | UserInTaxi): TreeNode => ({
      key: (user.user || user._id).toString(),
      label: this.extractDisplayName(user.username),
      selectable: true,
      leaf: true,
      type: 'user',
      data: user
    });

    const makeParentNode = (key: string, label: string, children: TreeNode[]): TreeNode => ({
      key,
      label,
      selectable: true,
      expanded: false,
      children,
      type: 'category',
      icon: this.getUserTypeIcon(key)
    });

    // ✅ Build user type groups (Teachers, Students, Parents, Managers, Admins)
    const types = ['teacher', 'student', 'parent', 'manager', 'admin'];
    const groupedNodes: TreeNode[] = [];

    for (const type of types) {
      const nodes = this.users
        .filter(u => u.userType.toLowerCase() === type)
        .map(u => makeUserNode(u));

      if (nodes.length > 0) {
        groupedNodes.push(
          makeParentNode(
            `${type}s`, 
            `${type[0].toUpperCase() + type.slice(1)}s (${nodes.length})`, 
            nodes
          )
        );
      }
    }

    // ✅ Build class nodes with filtered members
    const classNodes = this.classes.map(c => {
      // ✅ Filter class members based on role-based access
      const allMembers = [...c.students, ...c.teachers];
      const accessibleMembers = allMembers.filter(member => {
        if (member._id === this.currentUserId) return false;
        
        // Additional filtering based on role
        if (this.userRole === 'teacher' || this.userRole === 'student' || this.userRole === 'parent') {
          // Only show members from accessible classes
          return this.canAccessClass(c);
        }
        
        return true;
      });

      const memberNodes = accessibleMembers.map(u => makeUserNode(u));
    
      return {
        key: `class-${c._id}`,
        label: `${c.name} - ${c.subject} (${c.level}) • ${memberNodes.length} members`,
        selectable: false,
        expanded: false,
        children: memberNodes,
        type: 'class',
        icon: 'pi pi-book',
        data: c
      };
    }).filter(classNode => classNode.children.length > 0); // Only show classes with accessible members
    
    // ✅ Classes parent node
    const classesParentNode: TreeNode = {
      key: 'classes',
      label: `Classes (${classNodes.length})`,
      selectable: false,
      expanded: false,
      type: 'category',
      icon: 'pi pi-book',
      children: classNodes
    };
    
    // ✅ Combine user groups + classes
    this.recipientTree = [
      ...groupedNodes, 
      ...(classNodes.length > 0 ? [classesParentNode] : [])
    ];

    console.log('📊 Recipient tree built:', {
      userGroups: groupedNodes.length,
      classes: classNodes.length,
      totalNodes: this.recipientTree.length
    });
  }

  private extractDisplayName(username: string): string {
    if (username?.includes('@')) {
      const name = username.split('@')[0];
      return name.split('.').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
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

  getChatTypeInfo(): string {
    const count = this.getSelectedUserCount();
    if (count === 0) return 'Select users to start chatting';
    if (count === 1) return 'Direct conversation with 1 person';
    return `Group conversation with ${count} people`;
  }

  getSelectedUserCount(): number {
    return this.getSelectedUsersList().length;
  }

  getSelectedUsersList(): any[] {
    const actualUsers = this.getActualSelectedUsers();
    return actualUsers.map(node => ({
      userId: node.key!,
      displayName: this.extractDisplayName(node.data.username),
      userType: node.data.userType
    }));
  }

  private getActualSelectedUsers(): TreeNode[] {
    const userNodes: TreeNode[] = [];
    const seen = new Set<string>();

    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'user' && node.leaf && node.key && !seen.has(node.key)) {
          seen.add(node.key);
          userNodes.push(node);
        } else if (node.children) {
          traverse(node.children);
        }
      }
    };

    traverse(this.selectedRecipients);
    return userNodes;
  }

  getRoleSeverity(role: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" { 
    switch(role?.toLowerCase()) {
      case 'teacher': return 'info'; 
      case 'student': return 'success'; 
      case 'parent': return 'warning'; 
      case 'manager': return 'danger'; 
      case 'admin': return 'contrast'; 
      default: return 'secondary'; 
    } 
  }

  onCancel() {
    this.hide();
  }

  onCreate() {
    if (!this.currentUserId) {
      console.error('❌ No currentUserId available');
      return;
    }

    const actualUsers = this.getActualSelectedUsers();
    if (actualUsers.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    const participantIds = actualUsers.map(n => n.key!);
    const allParticipants = [this.currentUserId, ...participantIds];
    const chatType = participantIds.length === 1 ? 'direct' : 'group';

    let chatName = this.groupName.trim();
    if (chatType === 'group' && !chatName) {
      const names = actualUsers.slice(0, 3).map(n => this.extractDisplayName(n.data.username));
      chatName = names.join(', ') + (actualUsers.length > 3 ? '...' : '');
    }

    console.log('📤 Creating chat:', {
      type: chatType,
      participants: allParticipants.length,
      name: chatName
    });

    this.apiService.createChat({ 
      participants: allParticipants, 
      type: chatType, 
      name: chatName 
    }).subscribe({
      next: (createdChat: any) => {
        console.log('✅ Chat created successfully:', createdChat);
        this.chatCreated.emit({ 
          participants: allParticipants, 
          type: chatType, 
          name: chatName, 
          chat: createdChat 
        });
        this.hide();
      },
      error: (err: any) => {
        console.error('❌ Failed to create chat:', err);
        alert('Failed to create chat. Please try again.');
      }
    });
  }

  getEmptyMessage(): string {
    if (this.isLoadingUsers || this.isLoadingClasses) return 'Loading...';
    if (this.recipientTree.length === 0) return 'No users or classes available';
    return 'No users found';
  }

  private removeLingeringOverlays(): void {
    setTimeout(() => {
      const overlays = document.querySelectorAll('.p-dialog-mask, .p-component-overlay');
      
      overlays.forEach(overlay => {
        const dialog = overlay.querySelector('.p-dialog');
        if (!dialog || dialog.getAttribute('aria-hidden') === 'true') {
          overlay.remove();
        }
      });
      
      const treePanels = document.querySelectorAll('.p-treeselect-panel');
      treePanels.forEach(panel => {
        if ((panel as HTMLElement).style.display === 'none' || !panel.isConnected) {
          panel.remove();
        }
      });
      
      document.body.style.overflow = '';
      document.body.classList.remove('p-overflow-hidden');
    }, 100);
  }

  private cleanup(): void {
    console.log('🧹 Cleaning up new chat dialog state');
    
    this.selectedRecipients = [];
    this.groupName = '';
    this._cachedSelectedUsers = [];
    
    this.removeLingeringOverlays();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}