import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PostsService } from '@gen-api/posts/posts.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { API_BASE_URL, API_ASSET_URL } from '@config/endpoints';

@Component({
  selector: 'app-single-board',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, TranslateModule, OutlineButtonComponent, ConfirmDialogComponent],
  providers: [MessageService],
  templateUrl: './single-board.component.html',
  styleUrl: './single-board.component.scss'
})
export class SingleBoardComponent implements OnInit {
  @Input() postId!: string;
  @Output() backClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<string>();
  @Output() pollVoteSubmitted = new EventEmitter<void>();
  @Output() postDeleted = new EventEmitter<string>();

  @ViewChild(ConfirmDialogComponent) confirmDialog!: ConfirmDialogComponent;

  #posts = inject(PostsService);
  #msg = inject(MessageService);
  #translate = inject(TranslateService);
  #router = inject(Router);
  #http = inject(HttpClient);

  loading = false;
  post: any | null = null;
  isTogglingPin = false;
  isDeleting = false;
  selectedPollOption: string | null = null;
  hasUserVoted = false;
  userVoteOptions: string[] = [];

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    // If it's already a full URL or starts with assets/, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('assets/')) {
      return imagePath;
    }
    // Otherwise, prepend the asset URL (works for both local and production)
    return `${API_ASSET_URL}/${imagePath}`;
  }

  ngOnInit(): void {
    if (!this.postId) {
      this.#msg.add({ 
        severity: 'error', 
        summary: this.#translate.instant('api_messages.error_title'), 
        detail: 'Invalid post id' 
      });
      this.onBackClicked();
      return;
    }
    this.fetch(this.postId);
  }

  fetch(id: string) {
    this.loading = true;
    this.#posts.getPostsId(id).subscribe({
      next: (data: any) => {
        // API returns an envelope { data, success, status }
        const raw = data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
        // Normalize for template
        this.post = {
          ...raw,
          id: raw?.id || raw?._id,
          authorName: this.formatAuthor(raw),
        };
        
        // Fetch poll results to check if user has voted
        if (this.post.poll) {
          this.fetchPollResults(id);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.#msg.add({ 
          severity: 'error', 
          summary: this.#translate.instant('api_messages.error_title'), 
          detail: this.#translate.instant('board.messages.failed_to_fetch') 
        });
      },
    });
  }

  fetchPollResults(postId: string) {
    this.#http.get(`${API_BASE_URL}/posts/${postId}/results`).subscribe({
      next: (response: any) => {
        const pollData = response?.data || response;
        if (pollData) {
          this.hasUserVoted = pollData.userVoted || false;
          this.userVoteOptions = pollData.userVoteOptions || [];
          
          // Set selected option if user has voted
          if (this.hasUserVoted && this.userVoteOptions.length > 0) {
            this.selectedPollOption = this.userVoteOptions[0];
          }
          
          // Update poll options with accurate vote counts from results
          if (pollData.options && this.post?.poll?.options) {
            pollData.options.forEach((resultOption: any) => {
              const postOption = this.post.poll.options.find((opt: any) => opt.id === resultOption.id);
              if (postOption) {
                postOption.voteCount = resultOption.voteCount || 0;
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Error fetching poll results:', err);
        // Don't show error to user, just continue without vote info
      }
    });
  }

  formatDate(date?: string) {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '';
    }
  }

  formatDateLong(date?: string): string {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return dateObj.toLocaleDateString('en-US', options);
    } catch {
      return '';
    }
  }

  formatAuthor(post: any): string {
    const a = post?.author;
    if (!a) return 'Unknown';
    if (a.firstname || a.lastname) return `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim();
    return a.username || 'Unknown';
  }

  onBackClicked() {
    this.backClicked.emit();
  }

  onEditClicked() {
    if (!this.post?.id) return;
    this.editClicked.emit(this.post.id);
  }

  onPollVoteSubmitted() {
    // Optionally refresh the post data to get updated poll results
    if (this.post?.id) {
      this.fetch(this.post.id);
    }
    this.pollVoteSubmitted.emit();
  }

  isOptionSelected(optionId: string): boolean {
    return this.selectedPollOption === optionId;
  }

  onPollOptionChange(optionId: string) {
    if (!this.post?.id || !optionId || this.hasUserVoted) return;
    
    this.selectedPollOption = optionId;
    
    // Submit vote to API
    this.#http.post(`${API_BASE_URL}/posts/${this.post.id}/vote`, {
      optionIds: [optionId]
    }).subscribe({
      next: (response: any) => {
        // Update local state with new vote counts
        if (response?.data?.poll?.options) {
          this.post.poll = response.data.poll;
        }
        this.hasUserVoted = true;
        this.userVoteOptions = [optionId];
        
        // Refresh poll results to get accurate vote counts
        this.fetchPollResults(this.post.id);
        
        this.#msg.add({
          severity: 'success',
          summary: this.#translate.instant('api_messages.success_title'),
          detail: 'Vote recorded successfully'
        });
        this.onPollVoteSubmitted();
      },
      error: (error) => {
        console.error('Error submitting vote:', error);
        this.selectedPollOption = this.userVoteOptions[0] || null;
        
        // If user already voted, show info message instead of error
        if (error.error?.message?.includes('already voted')) {
          this.#msg.add({
            severity: 'info',
            summary: this.#translate.instant('api_messages.info_title') || 'Info',
            detail: 'You have already voted on this poll'
          });
          this.hasUserVoted = true;
        } else {
          this.#msg.add({
            severity: 'error',
            summary: this.#translate.instant('api_messages.error_title'),
            detail: error.error?.message || 'Failed to submit vote'
          });
        }
      }
    });
  }

  togglePin() {
    if (!this.post?.id || this.isTogglingPin) return;

    this.isTogglingPin = true;
    const newPinStatus = !this.post.pinned;

    const updateData = {
      pinned: newPinStatus
    };

    this.#posts.putPostsId(this.post.id, updateData as any).subscribe({
      next: () => {
        this.post.pinned = newPinStatus;
        this.#msg.add({
          severity: 'success',
          summary: this.#translate.instant('api_messages.success_title'),
          detail: newPinStatus 
            ? this.#translate.instant('board.messages.post_pinned')
            : this.#translate.instant('board.messages.post_unpinned')
        });
        this.isTogglingPin = false;
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
        this.#msg.add({
          severity: 'error',
          summary: this.#translate.instant('api_messages.error_title'),
          detail: this.#translate.instant('board.messages.pin_toggle_failed')
        });
        this.isTogglingPin = false;
      }
    });
  }

  getPriorityConfig(priority: string): { label: string; color: string; bgColor: string } {
    const priorityMap: { [key: string]: { label: string; color: string; bgColor: string } } = {
      high: { label: 'High', color: '#ef4444', bgColor: '#fee2e2' },
      normal: { label: 'Normal', color: '#22c55e', bgColor: '#dcfce7' },
      low: { label: 'Low', color: '#3b82f6', bgColor: '#dbeafe' }
    };
    return priorityMap[priority?.toLowerCase()] || priorityMap['normal'];
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      published: 'Published',
      draft: 'Draft',
      scheduled: 'Scheduled'
    };
    return statusMap[status?.toLowerCase()] || status;
  }

  getLikeCount(): number {
    if (!this.post?.likedBy) return 0;
    const likedBy = Array.isArray(this.post.likedBy) ? this.post.likedBy : [];
    return likedBy.length;
  }

  getRecipientsLabel(): string {
    if (!this.post?.recipients) return 'All Staff';
    
    const recipients = this.post.recipients;
    
    // Check if "all" is selected (empty arrays or all empty)
    const hasBranches = recipients.branches && recipients.branches.length > 0;
    const hasTaxis = recipients.taxis && recipients.taxis.length > 0;
    const hasUsers = recipients.users && recipients.users.length > 0;
    
    // If no specific recipients selected, show "All Staff"
    if (!hasBranches && !hasTaxis && !hasUsers) {
      return 'All Staff';
    }
    
    // Show specific counts or names
    const parts: string[] = [];
    if (hasBranches) {
      parts.push(`${recipients.branches.length} Branch${recipients.branches.length > 1 ? 'es' : ''}`);
    }
    if (hasTaxis) {
      parts.push(`${recipients.taxis.length} Class${recipients.taxis.length > 1 ? 'es' : ''}`);
    }
    if (hasUsers) {
      parts.push(`${recipients.users.length} User${recipients.users.length > 1 ? 's' : ''}`);
    }
    
    // If we have multiple parts, join them; otherwise show "All Staff" as fallback
    return parts.length > 0 ? parts.join(', ') : 'All Staff';
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      published: '#14b8a6', // Teal green
      draft: '#6b7280', // Gray
      scheduled: '#3b82f6' // Blue
    };
    return statusColors[status?.toLowerCase()] || '#6b7280';
  }

  onDeleteClicked() {
    if (!this.post?.id || this.isDeleting) return;

    const header = this.#translate.instant('confirm-dialog.title');
    const message = this.#translate.instant('board.messages.confirm_delete', { title: this.post.title });
    
    this.confirmDialog.confirm(header, message);
  }

  onConfirmDelete(confirmed: boolean) {
    if (confirmed) {
      this.deletePost();
    }
  }

  deletePost() {
    if (!this.post?.id || this.isDeleting) return;

    this.isDeleting = true;
    this.#posts.deletePostsId(this.post.id).subscribe({
      next: () => {
        this.#msg.add({
          severity: 'success',
          summary: this.#translate.instant('api_messages.success_title'),
          detail: this.#translate.instant('board.messages.post_deleted')
        });
        this.isDeleting = false;
        this.postDeleted.emit(this.post.id);
        
        // Redirect to board overview after successful deletion
        setTimeout(() => {
          this.#router.navigate(['/dashboard/board']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.#msg.add({
          severity: 'error',
          summary: this.#translate.instant('api_messages.error_title'),
          detail: this.#translate.instant('board.messages.delete_failed')
        });
        this.isDeleting = false;
      }
    });
  }
}

