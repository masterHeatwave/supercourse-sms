// new-chat-dialog.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectorRef, Renderer2, Inject } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

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
    TranslateModule,
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
  private userClassIds: string[] = [];
  private translate: TranslateService = inject(TranslateService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private renderer: Renderer2 = inject(Renderer2);

  store = inject(Store);

  isLoadingUsers = false;
  isLoadingClasses = false;

  constructor(
    private apiService: MessagingWrapperService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.store.select(selectAuthState).subscribe({
      next: (authState: any) => {
        this.userRole = authState.currentRoleTitle?.toLowerCase() || '';
        this.userBranchId = authState.currentBranchId || '';
        this.isActive = authState.is_active || false;
        this.userClassIds = authState.classIds || [];
      }
    });
  }

  ngOnInit() {

  }

  show() {
    // ✅ Clean up any lingering overlays before showing
    this.forceCleanupOverlays();
    
    this.visible = true;
    this.resetForm();
    this.loadUsers();
    this.loadClasses();
    this.cdr.detectChanges();
  }

  hide() {
    this.visible = false;
    this.cdr.detectChanges();

    // ✅ Multiple cleanup passes during and after animation
    this.forceCleanupOverlays();
    
    window.setTimeout(() => {
      this.forceCleanupOverlays();
    }, 50);

    window.setTimeout(() => {
      this.forceCleanupOverlays();
      this.dialogClosed.emit();
    }, 150);

    window.setTimeout(() => {
      this.forceCleanupOverlays();
      this.cdr.detectChanges();
    }, 300);
  }

  /**
   * ✅ CRITICAL: Comprehensive overlay cleanup function
   * Targets ALL PrimeNG overlay elements and removes them from DOM
   */
  private forceCleanupOverlays(): void {
    try {

      // ✅ Priority 1: Target all possible PrimeNG overlay selectors
      const selectors = [
        '.p-dialog-mask',           // Dialog backdrop
        '.p-treeselect-panel',      // TreeSelect dropdown panel
        '.p-tooltip',               // Tooltip overlays
        '.p-overlay'               // Generic overlays
      ];

      // ✅ Remove each overlay element
      selectors.forEach(selector => {
        const elements = this.document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          
          elements.forEach((el: any) => {
            try {
              // Use removeChild for better browser compatibility
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              } else if (el.remove && typeof el.remove === 'function') {
                el.remove();
              }
              console.log(`✅ Removed ${selector}`);
            } catch (e) {
              console.warn(`⚠️ Could not remove ${selector}:`, e);
            }
          });
        }
      });

      // ✅ Priority 2: Reset body scroll and overflow states
      try {
        this.document.body.style.overflow = '';
        this.document.body.style.position = '';
        this.document.body.style.width = '';
        this.document.body.style.height = '';
        this.document.body.style.top = '';
        
        // Remove all overflow-related classes
        const overflowClasses = [
          'p-overflow-hidden',
          'messaging-overlay-guard',
          'cdk-overlay-pane-container',
          'cdk-overlay-connected-position-bounding-box'
        ];
        
        overflowClasses.forEach(cls => {
          if (this.document.body.classList.contains(cls)) {
            this.document.body.classList.remove(cls);
          }
        });
      } catch (e) {
        console.warn('⚠️ Could not reset body styles:', e);
      }

      // ✅ Priority 3: Reset pointer events on any blocked elements
      try {
        const allElements = this.document.querySelectorAll('[style*="pointer-events"]');
        allElements.forEach((el: any) => {
          // Don't modify dialog or messaging panel elements
          if (
            !el.classList.contains('p-dialog') &&
            !el.classList.contains('messaging-panel') &&
            !el.classList.contains('messaging-overlay')
          ) {
            el.style.pointerEvents = '';
            el.style.zIndex = '';
          }
        });
      } catch (e) {
        console.warn('⚠️ Could not reset pointer events:', e);
      }

      // ✅ Priority 4: Force layout recalculation
      try {
        this.cdr.detectChanges();
        void this.document.body.getBoundingClientRect();
      } catch (e) {
        console.warn('⚠️ Could not force layout recalculation:', e);
      }

    } catch (error) {
      console.error('❌ [Dialog] Error during overlay cleanup:', error);
    }
  }

  /**
   * ✅ Remove lingering overlays that might have escaped first pass
   * Runs multiple times to catch delayed DOM removals
   */
  private removeLingeringOverlays(): void {
    const cleanupPass = (passNumber: number, delay: number) => {
      window.setTimeout(() => {
        try {

          // Check for hidden or disconnected overlays
          const overlays = this.document.querySelectorAll(
            '.p-dialog-mask, .p-treeselect-panel,  p-tooltip, .p-overlay,'
          );

          overlays.forEach((overlay: any) => {
            const isHidden =
              overlay.style.display === 'none' ||
              overlay.getAttribute('aria-hidden') === 'true' ||
              !overlay.isConnected ||
              overlay.offsetHeight === 0 ||
              overlay.offsetWidth === 0;

            if (isHidden) {
              try {
                if (overlay.parentNode) {
                  overlay.parentNode.removeChild(overlay);
                } else if (overlay.remove && typeof overlay.remove === 'function') {
                  overlay.remove();
                }
              } catch (e) {
                console.warn('⚠️ Could not remove lingering overlay:', e);
              }
            }
          });

          // Restore body scroll if needed
          if (this.document.body.style.overflow === 'hidden') {
            this.document.body.style.overflow = '';
          }
        } catch (e) {
          console.warn(`⚠️ Error in cleanup pass ${passNumber}:`, e);
        }
      }, delay);
    };

    // Multiple cleanup passes for safety
    cleanupPass(1, 50);
    cleanupPass(2, 150);
    cleanupPass(3, 300);
  }

  removeTreeSelectItemsWrapper() {
    try {
      const wrappers = this.document.querySelectorAll('.p-treeselect-items-wrapper');
  
      wrappers.forEach(el => {
        const element = el as HTMLElement;
  
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        } else if (typeof element.remove === 'function') {
          element.remove();
        }
      });
  
    } catch (e) {
      console.warn('Could not remove .p-treeselect-items-wrapper:', e);
    }
  }

  private resetForm() {
    this.selectedRecipients = [];
    this.groupName = '';
    this._cachedSelectedUsers = [];
    this._cachedSelectedUsersList = [];
    this._lastSelectionString = '';
  }

  /**
   * Role-based user filtering:
   * - Admin/Manager: Can chat with anyone
   * - Teacher: Can chat with admins, managers (same branch), students in their classes, parents
   * - Student: Can chat with managers, teachers in their classes, parents
   * - Parent: Same as student
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
          return true;

        case 'teacher':
          return (
            (userRole === 'admin' && userBranch === currentBranch) ||
            (userRole === 'manager' && userBranch === currentBranch) ||
            (userRole === 'student' && userBranch === currentBranch) ||
            (userRole === 'parent' && userBranch === currentBranch) ||
            userRole === 'teacher'
          );

        case 'student':
          return (
            (userRole === 'manager' && userBranch === currentBranch) ||
            (userRole === 'teacher' && userBranch === currentBranch) ||
            (userRole === 'parent' && userBranch === currentBranch)
          );

        case 'parent':
          return (
            (userRole === 'manager' && userBranch === currentBranch) ||
            (userRole === 'teacher' && userBranch === currentBranch) ||
            (userRole === 'student' && userBranch === currentBranch) ||
            (userRole === 'parent' && userBranch === currentBranch)
          );

        default:
          console.warn(`⚠️ Unknown role: ${currentRole}`);
          return false;
      }
    });

    return filtered;
  }

  private loadUsers() {
    if (!this.currentUserId) {
      console.error('❌ Cannot load users - no currentUserId provided');
      return;
    }

    this.isLoadingUsers = true;

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
    this.isLoadingClasses = true;

    this.apiService.getClasses().subscribe({
      next: (response: any) => {

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

  private canAccessClass(classItem: any): boolean {
    const role = this.userRole;
    const currentUserId = this.currentUserId;
    const currentBranch = this.userBranchId;

    if (role === 'admin') return true;

    if (role === 'manager') {
      return classItem.branchId === currentBranch;
    }

    if (role === 'teacher') {
      return classItem.teachers?.some((t: any) => t.user === currentUserId || t._id === currentUserId);
    }

    if (role === 'student') {
      return classItem.students?.some((s: any) => s.user === currentUserId || s._id === currentUserId);
    }

    if (role === 'parent') {
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

    // Build user type groups
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

    // Build class nodes
    const classNodes = this.classes.map(c => {
      const allMembers = [...c.students, ...c.teachers];
      const accessibleMembers = allMembers.filter(member => {
        if (member._id === this.currentUserId) return false;

        if (this.userRole === 'teacher' || this.userRole === 'student' || this.userRole === 'parent') {
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
    }).filter(classNode => classNode.children.length > 0);

    const classesParentNode: TreeNode = {
      key: 'classes',
      label: `Classes (${classNodes.length})`,
      selectable: false,
      expanded: false,
      type: 'category',
      icon: 'pi pi-book',
      children: classNodes
    };

    this.recipientTree = [
      ...groupedNodes,
      ...(classNodes.length > 0 ? [classesParentNode] : [])
    ];

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

    if (count === 0)
      return this.translate.instant('messages.chat_type.none');

    if (count === 1)
      return this.translate.instant('messages.chat_type.single');

    return this.translate.instant('messages.chat_type.group', { count });
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
    switch (role?.toLowerCase()) {
      case 'teacher': return 'info';
      case 'student': return 'success';
      case 'parent': return 'warning';
      case 'manager': return 'danger';
      case 'admin': return 'contrast';
      default: return 'secondary';
    }
  }

  onCancel() {
    this.forceCleanupOverlays();
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

    this.apiService.createChat({
      participants: allParticipants,
      type: chatType,
      name: chatName
    }).subscribe({
      next: (createdChat: any) => {
        this.chatCreated.emit({
          participants: allParticipants,
          type: chatType,
          name: chatName,
          chat: createdChat
        });

        // ✅ Aggressive cleanup before closing
        this.forceCleanupOverlays();
        this.removeLingeringOverlays();
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

  /**
   * ✅ Cleanup on component destruction
   */
  ngOnDestroy(): void {
    this.forceCleanupOverlays();
    this.removeLingeringOverlays();
  }
}