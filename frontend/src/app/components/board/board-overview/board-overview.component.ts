import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PostCardComponent } from '@components/post-card/post-card.component';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { PostsService } from '@gen-api/posts/posts.service';
import { finalize, take } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { API_ASSET_URL } from '@config/endpoints';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectUser } from '@store/auth/auth.selectors';

interface FilterOptions {
  creator: string;
  priority: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  academicPeriod: string;
}

interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-board-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DropdownModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    CalendarModule,
    ToastModule,
    TooltipModule,
    PostCardComponent,
    PrimaryDropdownComponent,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './board-overview.component.html',
  styleUrl: './board-overview.component.scss'
})
export class BoardOverviewComponent implements OnInit {
  #postsService = inject(PostsService);
  #messageService = inject(MessageService);
  #router = inject(Router);
  #store = inject(Store<AppState>);
  translate = inject(TranslateService);
  currentUserId: string = '';

  // Posts data
  posts: any[] = [];
  pinned: any[] = [];
  others: any[] = [];
  loadingPosts = false;

  // Pagination
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;
  first = 0;

  // Filters
  filters: FilterOptions = {
    creator: '',
    priority: '',
    dateFrom: null,
    dateTo: null,
    academicPeriod: ''
  };

  // Filter options
  creatorOptions = [
    { labelKey: 'board.filters.creator', value: '' },
    { labelKey: 'board.filters.all_creators', value: 'all' },
    { labelKey: 'board.filters.administrator', value: 'admin' },
    { labelKey: 'board.filters.teacher', value: 'teacher' }
  ];

  priorityOptions = [
    { labelKey: 'board.filters.priority', value: '' },
    { labelKey: 'board.create.priority.high', value: 'high' },
    { labelKey: 'board.create.priority.normal', value: 'normal' },
    { labelKey: 'board.create.priority.low', value: 'low' }
  ];

  academicPeriodOptions = [
    { labelKey: 'board.filters.academic_period', value: '' },
    { labelKey: '2024-2025', value: '2024-2025' },
    { labelKey: '2023-2024', value: '2023-2024' },
    { labelKey: '2022-2023', value: '2022-2023' }
  ];

  sortOptions: SortOption[] = [
    { label: 'board.sort.by.date', value: 'date' } as any,
    { label: 'board.sort.by.title', value: 'title' } as any,
    { label: 'board.sort.by.author', value: 'author' } as any
  ];

  selectedSort = 'date';

  // Computed options for primary-dropdown (with translated labels)
  get translatedCreatorOptions() {
    return this.creatorOptions.map(opt => ({
      label: this.translate.instant(opt.labelKey),
      value: opt.value
    }));
  }

  get translatedPriorityOptions() {
    return this.priorityOptions.map(opt => ({
      label: this.translate.instant(opt.labelKey),
      value: opt.value
    }));
  }

  get translatedAcademicPeriodOptions() {
    return this.academicPeriodOptions.map(opt => ({
      label: this.translate.instant(opt.labelKey),
      value: opt.value
    }));
  }

  get translatedSortOptions() {
    return this.sortOptions.map(opt => ({
      label: this.translate.instant(opt.label),
      value: opt.value
    }));
  }

  // View options
  viewModes = [
    { icon: 'pi pi-th-large', value: 'grid' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  currentViewMode = 'grid';


  // Default placeholder image for posts without a featured image
  readonly defaultPostImage = 'assets/images/no-image.png';

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return this.defaultPostImage;
    // If it's already a full URL or starts with assets/, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('assets/')) {
      return imagePath;
    }
    // Otherwise, prepend the asset URL (works for both local and production)
    return `${API_ASSET_URL}/${imagePath}`;
  }

  ngOnInit() {
    this.loadCurrentUserId();
    this.loadPosts();
  }

  loadCurrentUserId() {
    this.#store.select(selectUser).pipe(take(1)).subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
      }
    });
  }

  loadPosts() {
    this.loadingPosts = true;

    // Build query parameters according to the API schema
    const params: any = {};

    // Add filters to params based on available API parameters
    if (this.filters.creator && this.filters.creator !== 'all') {
      params.author = this.filters.creator;
    }

    if (this.filters.dateFrom) {
      params.from_date = this.filters.dateFrom.toISOString().split('T')[0]; // Send as YYYY-MM-DD
    }

    if (this.filters.dateTo) {
      params.to_date = this.filters.dateTo.toISOString().split('T')[0]; // Send as YYYY-MM-DD
    }

    // For now, we'll handle pagination and sorting on the frontend
    // since the API might not support these parameters yet

    this.#postsService
      .getPosts(params)
      .pipe(finalize(() => (this.loadingPosts = false)))
      .subscribe({
        next: (response: any) => {
          if (response && response.success !== false) {
            // Handle both direct array response and object response with data property
            const postsData = Array.isArray(response) ? response : response.data || [];

            // Map the posts to our expected format
            const allPosts = postsData.map((post: any) => {
              // Check if current user is in likedBy array
              const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
              const isLiked = this.currentUserId && likedBy.some((id: any) => id.toString() === this.currentUserId);
              
              return {
                title: post.title,
                content: post.content,
                author: post.author, // Keep the full author object for formatAuthor method
                tags: post.tags || [],
                status: post.status,
                published_at: post.published_at,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                id: post.id || post._id,
                featured_image: post.featured_image,
                priority: post.priority,
                pinned: post.pinned || false, // Use the actual pinned field from the backend
                like: isLiked, // Check if current user is in likedBy array
                likedBy: likedBy, // Keep the full likedBy array for reference
                allow_reactions: post.allow_reactions !== undefined ? post.allow_reactions : true // Default to true if not set
              };
            });

            // Apply client-side filtering for priority and academic period
            let filteredPosts = allPosts;
            
            if (this.filters.priority) {
              filteredPosts = filteredPosts.filter((post: any) => 
                post.priority?.toLowerCase() === this.filters.priority.toLowerCase()
              );
            }

            if (this.filters.academicPeriod) {
              filteredPosts = filteredPosts.filter((post: any) => 
                post.academic_period === this.filters.academicPeriod
              );
            }

            // Apply client-side sorting
            if (this.selectedSort === 'date') {
              filteredPosts.sort(
                (a: any, b: any) => new Date(b.published_at || b.createdAt).getTime() - new Date(a.published_at || a.createdAt).getTime()
              );
            } else if (this.selectedSort === 'title') {
              filteredPosts.sort((a: any, b: any) => a.title.localeCompare(b.title));
            } else if (this.selectedSort === 'author') {
              filteredPosts.sort((a: any, b: any) => this.formatAuthor(a).localeCompare(this.formatAuthor(b)));
            }

            // Split posts into pinned (max 3) and others with overflow
            const all = filteredPosts ?? [];
            const pinnedAll = all.filter((p: any) => p.pinned === true);
            this.pinned = pinnedAll.slice(0, 3);
            const overflowPinned = pinnedAll.slice(3);
            this.others = all.filter((p: any) => !p.pinned).concat(overflowPinned);

            // Apply client-side pagination
            this.updatePaginatedPosts();
          } else {
            this.posts = [];
            this.pinned = [];
            this.others = [];
            this.#messageService.add({
              severity: 'error',
              summary: this.translate.instant('api_messages.error_title'),
              detail: this.translate.instant('board.messages.could_not_load')
            });
          }
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.posts = [];
          this.pinned = [];
          this.others = [];
          this.#messageService.add({
            severity: 'error',
            summary: this.translate.instant('api_messages.error_title'),
            detail: this.translate.instant('board.messages.failed_to_fetch')
          });
        }
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.first = event.first;
    this.updatePaginatedPosts();
  }

  updatePaginatedPosts() {
    // Calculate total records including both pinned and unpinned posts
    this.totalRecords = this.pinned.length + this.others.length;
    
    // Calculate how many "other" posts to show based on page size and pinned posts count
    // If we're on the first page and have pinned posts, reduce the number of "other" posts shown
    let availableSlots = this.pageSize;
    if (this.currentPage === 0 && this.pinned.length > 0) {
      availableSlots = Math.max(0, this.pageSize - this.pinned.length);
    }
    
    const startIndex = this.currentPage === 0 ? 0 : (this.currentPage * this.pageSize) - this.pinned.length;
    const endIndex = startIndex + availableSlots;
    this.posts = this.others.slice(startIndex, endIndex);
  }

  onFilterChange() {
    console.log('Filter changed:', this.filters);
    this.currentPage = 0;
    this.first = 0;
    this.loadPosts();
  }

  onSortChange() {
    this.currentPage = 0;
    this.first = 0;
    this.loadPosts();
  }

  clearFilters() {
    this.filters = {
      creator: '',
      priority: '',
      dateFrom: null,
      dateTo: null,
      academicPeriod: ''
    };
    this.selectedSort = 'date';
    this.onFilterChange();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = this.translate.currentLang === 'el' ? 'el-GR' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

  setViewMode(mode: string) {
    this.currentViewMode = mode;
  }

  goToPost(id: string) {
    if (!id) return;
    this.#router.navigate(['/dashboard/board', id]);
  }

  editPost(id: string) {
    if (!id) return;
    this.#router.navigate(['/dashboard/board/edit', id]);
  }

  togglePin(id: string, currentPinStatus: boolean) {
    if (!id) return;
    
    // Find the post to get its current data - search in all arrays
    const post = [...this.pinned, ...this.others, ...this.posts].find(p => p.id === id);
    if (!post) return;
    
    // Check the actual current pin status from the post object
    const actualCurrentStatus = post.pinned || false;
    const newPinStatus = !actualCurrentStatus;
    
    console.log('Toggle Pin - ID:', id, 'Current:', actualCurrentStatus, 'New:', newPinStatus);
    
    // Update local state immediately for better UX
    post.pinned = newPinStatus;
    
    // Also update in all arrays to ensure consistency
    this.posts.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    this.pinned.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    this.others.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    
    // Update the post via API with all required fields
    const updateData = {
      id: id,
      title: post.title,
      content: post.content,
      pinned: newPinStatus,
      tags: post.tags || [],
      status: post.status
    };
    
    this.#postsService.putPostsId(id, updateData as any).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.#messageService.add({
          severity: 'success',
          summary: this.translate.instant('api_messages.success_title'),
          detail: newPinStatus 
            ? this.translate.instant('board.messages.post_pinned')
            : this.translate.instant('board.messages.post_unpinned')
        });
        
        // Reload posts to reflect the change in sections (pinned vs others)
        this.loadPosts();
      },
      error: (error) => {
        console.error('Error toggling pin status:', error);
        // Revert local state on error in all arrays
        post.pinned = actualCurrentStatus;
        this.posts.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        this.pinned.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        this.others.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        
        this.#messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: this.translate.instant('board.messages.pin_toggle_failed')
        });
      }
    });
  }

  toggleLike(id: string, currentLikeStatus: boolean) {
    if (!id || !this.currentUserId) return;
    
    // Find the post to get its current data - search in all arrays
    const post = [...this.pinned, ...this.others, ...this.posts].find(p => p.id === id);
    if (!post) return;
    
    // Check the actual current like status from the post object
    const actualCurrentStatus = post.like || false;
    const newLikeStatus = !actualCurrentStatus;
    
    console.log('Toggle Like - ID:', id, 'Current:', actualCurrentStatus, 'New:', newLikeStatus);
    
    // Store original likedBy for error reversion
    const originalLikedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    
    // Update local state immediately for better UX
    post.like = newLikeStatus;
    
    // Update likedBy array in local state
    let likedBy = [...originalLikedBy];
    if (newLikeStatus) {
      // Add current user to likedBy if not already there
      if (!likedBy.some((userId: any) => userId.toString() === this.currentUserId)) {
        likedBy.push(this.currentUserId);
      }
    } else {
      // Remove current user from likedBy
      likedBy = likedBy.filter((userId: any) => userId.toString() !== this.currentUserId);
    }
    post.likedBy = likedBy;
    
    // Also update in all arrays to ensure consistency
    this.posts.forEach(p => { 
      if (p.id === id) {
        p.like = newLikeStatus;
        p.likedBy = likedBy;
      }
    });
    this.pinned.forEach(p => { 
      if (p.id === id) {
        p.like = newLikeStatus;
        p.likedBy = likedBy;
      }
    });
    this.others.forEach(p => { 
      if (p.id === id) {
        p.like = newLikeStatus;
        p.likedBy = likedBy;
      }
    });
    
    // Use the correct like/unlike endpoints
    const apiCall = newLikeStatus 
      ? this.#postsService.postPostsIdLike(id)
      : this.#postsService.postPostsIdUnlike(id);
    
    apiCall.subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.#messageService.add({
          severity: 'success',
          summary: this.translate.instant('api_messages.success_title'),
          detail: newLikeStatus 
            ? this.translate.instant('board.messages.post_liked')
            : this.translate.instant('board.messages.post_unliked')
        });
        
        // Optionally reload the post to get the updated likedBy array from backend
        // this.loadPosts();
      },
      error: (error) => {
        console.error('Error toggling like status:', error);
        // Revert local state on error - use the original likedBy we stored
        post.like = actualCurrentStatus;
        post.likedBy = [...originalLikedBy];
        
        this.posts.forEach(p => { 
          if (p.id === id) {
            p.like = actualCurrentStatus;
            p.likedBy = originalLikedBy;
          }
        });
        this.pinned.forEach(p => { 
          if (p.id === id) {
            p.like = actualCurrentStatus;
            p.likedBy = originalLikedBy;
          }
        });
        this.others.forEach(p => { 
          if (p.id === id) {
            p.like = actualCurrentStatus;
            p.likedBy = originalLikedBy;
          }
        });
        
        this.#messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: this.translate.instant('board.messages.like_toggle_failed')
        });
      }
    });
  }

  // Utility methods
  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html ?? '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  getExcerpt(content: string, max = 140): string {
    const text = this.stripHtml(content);
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  formatAuthor(post: any): string {
    const a = post?.author;
    if (!a) return 'Unknown';
    if (a.firstname || a.lastname) return `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim();
    return a.username || 'Unknown';
  }

  getInitials(post: any): string {
    const a = post?.author;
    if (!a) return '??';
    
    const firstname = a.firstname || '';
    const lastname = a.lastname || '';
    
    if (firstname || lastname) {
      const firstInitial = firstname.charAt(0).toUpperCase() || '';
      const lastInitial = lastname.charAt(0).toUpperCase() || '';
      return (firstInitial + lastInitial) || '??';
    }
    
    // Fallback to username if no firstname/lastname
    if (a.username) {
      return a.username.substring(0, 2).toUpperCase();
    }
    
    return '??';
  }

  // Check if there are any posts (pinned or regular)
  get hasPosts(): boolean {
    return !this.loadingPosts && (this.pinned.length > 0 || this.others.length > 0);
  }
}

