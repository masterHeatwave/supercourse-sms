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
import { finalize } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

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
  imports: [OutlineButtonComponent, CommonModule, PostCardComponent, FullCalendarModule, RouterModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  @Input() overviewInfo: OverviewInfo | undefined;
  @Input() classId: string | null = null;

  #postsService = inject(PostsService);
  #sessionsService = inject(SessionsService);
  #router = inject(Router);

  posts: Post[] = [];
  loadingPosts = false;

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

  readonly defaultPostImage = 'assets/images/dashboard-background.png';

  ngOnInit() {
    this.fetchPosts();
    this.fetchSessions();
  }

  fetchPosts() {
    this.loadingPosts = true;
    this.#postsService
      .getPosts()
      .pipe(finalize(() => (this.loadingPosts = false)))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            // Map the API response to the expected format
            this.posts = response.data.map((post: any) => ({
              title: post.title,
              content: post.content,
              author: post.author || 'Unknown',
              tags: post.tags || [],
              status: post.status,
              published_at: post.published_at,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              id: post.id
            }));
          } else {
            this.posts = [];
          }
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.posts = [];
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
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  navigateToEdit() {
    if (this.classId) {
      this.#router.navigate(['/dashboard/classes/edit', this.classId]);
    }
  }
}
