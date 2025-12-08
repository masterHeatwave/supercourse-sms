import { Component, Input, OnInit, inject } from '@angular/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { CommonModule } from '@angular/common';
import { PostCardComponent } from '@components/post-card/post-card.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PostsService } from '@gen-api/posts/posts.service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { Post, Session } from '@gen-api/schemas';
import { finalize, take } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { mapSubjectToCode, mapLevelToLabel } from '../../../utils/subject-mapping.util';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectUser } from '@store/auth/auth.selectors';
import { API_ASSET_URL } from '@config/endpoints';

interface OverviewInfo {
  class: string;
  level: string;
  cefr: string;
  subject: string;
  classSize: number;
  materials: string;
  teacher: string;
  phone: string;
  email: string;
  createdBy: string;
  creationDate: string;
  lastUpdated: string;
  sessionDuration: string;
  sessionsPerWeek: number;
  totalHoursPerWeek: string;
  weekTimetable: { day: string; startTime: string; endTime: string }[];
  notes?: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    OutlineButtonComponent, 
    CommonModule, 
    PostCardComponent, 
    FullCalendarModule, 
    RouterModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  @Input() overviewInfo: OverviewInfo | undefined;
  @Input() classId: string | null = null;

  #postsService = inject(PostsService);
  #sessionsService = inject(SessionsService);
  #router = inject(Router);
  #messageService = inject(MessageService);
  #translate = inject(TranslateService);
  #store = inject(Store<AppState>);

  posts: any[] = [];
  pinned: any[] = [];
  others: any[] = [];
  loadingPosts = false;
  currentUserId: string = '';
  currentViewMode: 'grid' | 'list' = 'grid';

  sessions: Session[] = [];
  loadingSessions = false;
  calendarEvents: EventInput[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    events: [],
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    eventClick: this.handleEventClick.bind(this)
  };

  readonly defaultPostImage = 'assets/images/no-image.png';

  // View options
  viewModes = [
    { icon: 'pi pi-th-large', value: 'grid' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  // Getter for formatted level
  get formattedLevel(): string {
    if (!this.overviewInfo?.level) return '';
    return mapLevelToLabel(this.overviewInfo.level);
  }

  // Getter for formatted subject
  get formattedSubject(): string {
    if (!this.overviewInfo?.subject) return '';
    return mapSubjectToCode(this.overviewInfo.subject);
  }

  ngOnInit() {
    this.loadCurrentUserId();
    this.fetchPosts();
    this.fetchSessions();
  }

  loadCurrentUserId() {
    this.#store.select(selectUser).pipe(take(1)).subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
      }
    });
  }

  fetchPosts() {
    this.loadingPosts = true;
    
    // Filter posts by class if classId is available
    const params: any = {};
    if (this.classId) {
      params.taxi = this.classId;
    }

    this.#postsService
      .getPosts(params)
      .pipe(finalize(() => (this.loadingPosts = false)))
      .subscribe({
        next: (response: any) => {
          if (response && response.success !== false) {
            const postsData = Array.isArray(response) ? response : response.data || [];

            // Map the posts to our expected format
            const allPosts = postsData.map((post: any) => {
              const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
              const isLiked = this.currentUserId && likedBy.some((id: any) => id.toString() === this.currentUserId);
              
              return {
                title: post.title,
                content: post.content,
                author: post.author,
                tags: post.tags || [],
                status: post.status,
                published_at: post.published_at,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                id: post.id || post._id,
                featured_image: post.featured_image,
                priority: post.priority,
                pinned: post.pinned || false,
                like: isLiked,
                likedBy: likedBy,
                allow_reactions: post.allow_reactions !== undefined ? post.allow_reactions : true,
                poll: post.poll
              };
            });

            // Combine all posts (pinned first, then others)
            const all = allPosts ?? [];
            const pinnedAll = all.filter((p: any) => p.pinned === true);
            const unpinnedAll = all.filter((p: any) => !p.pinned);
            // Sort: pinned posts first, then unpinned, both sorted by date
            this.posts = [
              ...pinnedAll.sort((a: any, b: any) => 
                new Date(b.published_at || b.createdAt).getTime() - new Date(a.published_at || a.createdAt).getTime()
              ),
              ...unpinnedAll.sort((a: any, b: any) => 
                new Date(b.published_at || b.createdAt).getTime() - new Date(a.published_at || a.createdAt).getTime()
              )
            ];
            // Keep pinned and others arrays for compatibility but they won't be used in template
            this.pinned = [];
            this.others = [];
          } else {
            this.posts = [];
            this.pinned = [];
            this.others = [];
          }
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.posts = [];
          this.pinned = [];
          this.others = [];
        }
      });
  }

  fetchSessions() {
    this.loadingSessions = true;
    const params = this.classId ? { taxi: this.classId } : {};

    this.#sessionsService
      .getSessions(params)
      .pipe(finalize(() => (this.loadingSessions = false)))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data && response.data.results && Array.isArray(response.data.results)) {
            this.sessions = response.data.results;
            this.processSessionsForCalendar(this.sessions);
          } else {
            console.error('Failed to fetch sessions:', response);
            this.sessions = [];
          }
        },
        error: (error) => {
          console.error('Error fetching sessions:', error);
        }
      });
  }

  processSessionsForCalendar(sessions: Session[]) {
    // Reset events
    this.calendarEvents = [];

    // Create events from sessions
    sessions.forEach((session) => {
      try {
        const startDate = new Date(session.start_date);
        const endDate = new Date(session.end_date);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const event: EventInput = {
            id: session.id,
            title: `Class: ${session.taxi?.name || this.overviewInfo?.class || 'Unnamed Class'}`,
            start: startDate,
            end: endDate,
            backgroundColor: this.getRandomColor(session.taxi?.name || 'default'),
            extendedProps: {
              classroom: session.classroom,
              students: session.students?.length || 0,
              teachers: session.teachers?.length || 0,
              sessionData: session
            }
          };

          this.calendarEvents.push(event);
        }
      } catch (error) {
        console.error('Error processing session for calendar:', error);
      }
    });

    // Update calendar events
    this.calendarOptions.events = this.calendarEvents;
  }

  getRandomColor(seed: string): string {
    // Generate a color based on the taxi name for consistency
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use a set of predefined colors for better contrast and visibility
    const colors = [
      '#3498db', // Blue
      '#2ecc71', // Green
      '#e74c3c', // Red
      '#9b59b6', // Purple
      '#f1c40f', // Yellow
      '#1abc9c', // Teal
      '#d35400', // Orange
      '#34495e' // Dark Blue
    ];

    // Ensure positive hash
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  }

  handleEventClick(info: any) {
    const session = info.event.extendedProps.sessionData;

    // Format times for display
    const startTime = new Date(session.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(session.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(session.start_date).toLocaleDateString();

    // Extract classroom name
    const classroomName = session.classroom?.name || session.classroom?.title || 'N/A';

    // Extract taxi/class name - handle both object and string cases
    let className = this.overviewInfo?.class || 'Unnamed Class';
    if (session.taxi) {
      if (typeof session.taxi === 'object') {
        className = session.taxi.name || session.taxi.title || 'Unnamed Class';
      } else if (typeof session.taxi === 'string') {
        className = session.taxi;
      }
    }

    // You could show a toast or modal here
    console.log(`Session Details:
      Class: ${className}
      Date: ${date}
      Time: ${startTime} - ${endTime}
      Classroom: ${classroomName}
      Students: ${session.students?.length || 0}`);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return this.defaultPostImage;
    if (imagePath.startsWith('http') || imagePath.startsWith('assets/')) {
      return imagePath;
    }
    return `${API_ASSET_URL}/${imagePath}`;
  }

  getExcerpt(content: string, max = 140): string {
    const text = this.stripHtml(content);
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html ?? '';
    return (tmp.textContent || tmp.innerText || '').trim();
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
    
    if (a.username) {
      return a.username.substring(0, 2).toUpperCase();
    }
    
    return '??';
  }

  setViewMode(mode: string) {
    this.currentViewMode = mode as 'grid' | 'list';
  }

  goToPost(id: string) {
    if (!id) return;
    this.#router.navigate(['/dashboard/board', id]);
  }

  togglePin(id: string, currentPinStatus: boolean) {
    if (!id) return;
    
    const post = [...this.pinned, ...this.others, ...this.posts].find(p => p.id === id);
    if (!post) return;
    
    const actualCurrentStatus = post.pinned || false;
    const newPinStatus = !actualCurrentStatus;
    
    post.pinned = newPinStatus;
    this.posts.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    this.pinned.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    this.others.forEach(p => { if (p.id === id) p.pinned = newPinStatus; });
    
    const updateData = {
      id: id,
      title: post.title,
      content: post.content,
      pinned: newPinStatus,
      tags: post.tags || [],
      status: post.status
    };
    
    this.#postsService.putPostsId(id, updateData as any).subscribe({
      next: () => {
        this.#messageService.add({
          severity: 'success',
          summary: this.#translate.instant('api_messages.success_title'),
          detail: newPinStatus 
            ? this.#translate.instant('board.messages.post_pinned')
            : this.#translate.instant('board.messages.post_unpinned')
        });
        this.fetchPosts();
      },
      error: () => {
        post.pinned = actualCurrentStatus;
        this.posts.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        this.pinned.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        this.others.forEach(p => { if (p.id === id) p.pinned = actualCurrentStatus; });
        
        this.#messageService.add({
          severity: 'error',
          summary: this.#translate.instant('api_messages.error_title'),
          detail: this.#translate.instant('board.messages.pin_toggle_failed')
        });
      }
    });
  }

  toggleLike(id: string, currentLikeStatus: boolean) {
    if (!id || !this.currentUserId) return;
    
    const post = [...this.pinned, ...this.others, ...this.posts].find(p => p.id === id);
    if (!post) return;
    
    const actualCurrentStatus = post.like || false;
    const newLikeStatus = !actualCurrentStatus;
    const originalLikedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    
    post.like = newLikeStatus;
    
    let likedBy = [...originalLikedBy];
    if (newLikeStatus) {
      if (!likedBy.some((userId: any) => userId.toString() === this.currentUserId)) {
        likedBy.push(this.currentUserId);
      }
    } else {
      likedBy = likedBy.filter((userId: any) => userId.toString() !== this.currentUserId);
    }
    post.likedBy = likedBy;
    
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
    
    const apiCall = newLikeStatus 
      ? this.#postsService.postPostsIdLike(id)
      : this.#postsService.postPostsIdUnlike(id);
    
    apiCall.subscribe({
      next: () => {
        this.#messageService.add({
          severity: 'success',
          summary: this.#translate.instant('api_messages.success_title'),
          detail: newLikeStatus 
            ? this.#translate.instant('board.messages.post_liked')
            : this.#translate.instant('board.messages.post_unliked')
        });
      },
      error: () => {
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
          summary: this.#translate.instant('api_messages.error_title'),
          detail: this.#translate.instant('board.messages.like_toggle_failed')
        });
      }
    });
  }

  get hasPosts(): boolean {
    return !this.loadingPosts && this.posts.length > 0;
  }

  navigateToEdit() {
    if (this.classId) {
      this.#router.navigate(['/dashboard/classes/edit', this.classId]);
    }
  }
}
