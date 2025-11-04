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
import { MessageService } from 'primeng/api';
import { PostCardComponent } from '@components/post-card/post-card.component';
import { PostsService } from '@gen-api/posts/posts.service';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  selector: 'app-board',
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
    PostCardComponent,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  #postsService = inject(PostsService);
  #messageService = inject(MessageService);
  #router = inject(Router);
  #translate = inject(TranslateService);

  // Posts data
  posts: any[] = [];
  pinnedPosts: any[] = [];
  loadingPosts = false;

  // Pagination
  totalRecords = 0;
  currentPage = 0;
  pageSize = 9; // 3x3 grid
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

  selectedSort = this.sortOptions[0];

  // View options
  viewModes = [
    { icon: 'pi pi-th-large', value: 'grid' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  currentViewMode = 'grid';

  // Store all posts for client-side operations
  allRegularPosts: any[] = [];

  // Default placeholder image for posts without a featured image
  readonly defaultPostImage = 'assets/images/dashboard-background.png';

  ngOnInit() {
    this.loadPosts();
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
            const allPosts = postsData.map((post: any) => ({
              title: post.title,
              content: post.content,
              // Normalize author display name
              authorName:
                typeof post.author === 'object' && post.author !== null
                  ? (post.author.name || this.#translate.instant('common.unknown'))
                  : (post.author || this.#translate.instant('common.unknown')),
              tags: post.tags || [],
              status: post.status,
              published_at: post.published_at,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              id: post.id || post._id,
              featured_image: post.featured_image,
              // Consider posts with certain tags as pinned (e.g., 'featured' or 'important')
              isPinned: Array.isArray(post.tags) && (post.tags.includes('featured') || post.tags.includes('important'))
            }));

            // Apply client-side filtering for priority and academic period
            if (this.filters.priority) {
              // This would need to be implemented based on how priority is stored in posts
              // For now, we'll skip this filter
            }

            if (this.filters.academicPeriod) {
              // This would need to be implemented based on how academic period is stored in posts
              // For now, we'll skip this filter
            }

            // Apply client-side sorting
            if (this.selectedSort.value === 'date') {
              allPosts.sort(
                (a: any, b: any) => new Date(b.published_at || b.createdAt).getTime() - new Date(a.published_at || a.createdAt).getTime()
              );
            } else if (this.selectedSort.value === 'title') {
              allPosts.sort((a: any, b: any) => a.title.localeCompare(b.title));
            } else if (this.selectedSort.value === 'author') {
              allPosts.sort((a: any, b: any) => (a.authorName || '').localeCompare(b.authorName || ''));
            }

            // Separate pinned and regular posts
            this.pinnedPosts = allPosts.filter((post: any) => post.isPinned);
            this.allRegularPosts = allPosts.filter((post: any) => !post.isPinned);

            // Apply client-side pagination
            this.updatePaginatedPosts();
          } else {
            this.posts = [];
            this.pinnedPosts = [];
            this.#messageService.add({
              severity: 'error',
              summary: this.#translate.instant('api_messages.error_title'),
              detail: this.#translate.instant('board.messages.could_not_load')
            });
          }
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.posts = [];
          this.pinnedPosts = [];
          this.#messageService.add({
            severity: 'error',
            summary: this.#translate.instant('api_messages.error_title'),
            detail: this.#translate.instant('board.messages.failed_to_fetch')
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
    this.totalRecords = this.allRegularPosts.length;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.posts = this.allRegularPosts.slice(startIndex, endIndex);
  }

  onFilterChange() {
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
    this.selectedSort = this.sortOptions[0];
    this.onFilterChange();
  }

  exportPosts() {
    // Implement export functionality
    this.#messageService.add({
      severity: 'info',
      summary: this.#translate.instant('common.export'),
      detail: this.#translate.instant('board.messages.export_detail')
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
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
}
