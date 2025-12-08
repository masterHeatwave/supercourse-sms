import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { PostCardComponent } from '@components/post-card/post-card.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { SafeResourceUrlPipe } from '@pipes/safe-resource-url.pipe';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { selectAuthState } from '@store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { IAuthState } from '@store/auth/auth.model';
import { CustomersService } from '@gen-api/customers/customers.service';
import { Customer, Post, Session } from '@gen-api/schemas';
import { DashboardService } from '@gen-api/dashboard/dashboard.service';
import { AbsencesService } from '@gen-api/absences/absences.service';
import { PostsService } from '@gen-api/posts/posts.service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { ActivityService } from '@gen-api/activity/activity.service';
import { finalize, forkJoin } from 'rxjs';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  datetime: string;
  icon: string;
  entityType: EntityType;
}

type EntityType = 'user' | 'student' | 'taxi' | 'post' | 'session' | 'classroom' | 'absence';

@Component({
  selector: 'app-dashboard-index',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ToastModule, SafeResourceUrlPipe, FullCalendarModule, PostCardComponent, TranslateModule],
  providers: [MessageService],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class DashboardIndexComponent implements OnInit {
  #store = inject(Store);
  #dashboardService = inject(DashboardService);
  #absencesService = inject(AbsencesService);
  #postsService = inject(PostsService);
  #sessionsService = inject(SessionsService);
  #activityService = inject(ActivityService);
  #messageService = inject(MessageService);

  posts: Post[] = [];
  loadingPosts = false;

  activities: ActivityItem[] = [];
  loadingActivities = false;

  sessions: Session[] = [];
  loadingSessions = false;
  calendarEvents: EventInput[] = [];

  currentCustomerId: string | null = null;
  currentCustomer: Customer | null = null;

  // Dashboard stats with initial values
  stats = [
    { value: 0, label: 'dashboard.stats.enrolled_students', color: 'teal', icon: 'pi pi-users' },
    { value: 0, label: 'dashboard.stats.staff_members', color: 'teal', icon: 'pi pi-user' },
    { value: 0, label: 'dashboard.stats.classes', color: 'teal', icon: 'pi pi-book' },
    { value: 0, label: 'dashboard.stats.ongoing_sessions', color: 'red', icon: 'pi pi-clock' }
  ];

  // Date-related properties that will be updated from the dashboard data
  currentDate = new Date();
  currentDayName = this.currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  currentMonthDay = this.currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  currentWeekNumber = this.getWeekNumber(this.currentDate);

  // Entity type to icon mapping
  entityTypeIcons: Record<EntityType, string> = {
    user: 'pi pi-user',
    student: 'pi pi-user',
    taxi: 'pi pi-car',
    post: 'pi pi-file',
    session: 'pi pi-calendar',
    classroom: 'pi pi-home',
    absence: 'pi pi-calendar-minus'
  };

  private readonly defaultIcon = 'pi pi-info-circle';

  // Calendar options
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth'
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

  // Helper method to get week number
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  ngOnInit() {
    this.#store.select(selectAuthState).subscribe((authState: IAuthState) => {
      this.currentCustomerId = authState.currentCustomerId;

      if (this.currentCustomerId) {
        // Fetch dashboard data which includes customer info and statistics
        this.#dashboardService.getDashboardCustomerId(this.currentCustomerId).subscribe({
          next: (response: any) => {
            if (response.data) {
              const dashboardData = response.data;
              this.currentCustomer = dashboardData.customer as Customer;

              // Update date information if available
              if (dashboardData.date) {
                this.currentDate = new Date(dashboardData.date);
                const locale = this.translate.currentLang === 'el' ? 'el-GR' : 'en-US';
                this.currentDayName = this.currentDate.toLocaleDateString(locale, { weekday: 'long' });
                this.currentMonthDay = this.currentDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
              }

              if (dashboardData.currentWeek) {
                this.currentWeekNumber = dashboardData.currentWeek;
              }

              // Update dashboard stats with actual counts
              this.stats = [
                { value: dashboardData.students_count || 0, label: 'dashboard.stats.enrolled_students', color: 'teal', icon: 'pi pi-users' },
                { value: dashboardData.staff_count || 0, label: 'dashboard.stats.staff_members', color: 'teal', icon: 'pi pi-user' },
                { value: dashboardData.taxis_count || 0, label: 'dashboard.stats.classes', color: 'teal', icon: 'pi pi-book' },
                { value: dashboardData.ongoing_sessions || 0, label: 'dashboard.stats.ongoing_sessions', color: 'red', icon: 'pi pi-clock' }
              ];

              console.log('Dashboard data:', dashboardData);
            }
          },
          error: (error) => {
            console.error('Error fetching dashboard data:', error);
            this.#messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to fetch dashboard data'
            });
          }
        });

        // Fetch all other data
        this.fetchActivities();
        this.fetchAbsences();
        this.fetchPosts();
        this.fetchSessions();
      }
    });
  }

  fetchSessions() {
    this.loadingSessions = true;
    this.#sessionsService
      .getSessions()
      .pipe(finalize(() => (this.loadingSessions = false)))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            // Handle both array and object with results property
            const sessionsData = Array.isArray(response.data) 
              ? response.data 
              : (response.data.results || response.data.data || []);
            
            this.sessions = sessionsData;
            
            // Only process if we have an array
            if (Array.isArray(this.sessions)) {
              this.processSessionsForCalendar(this.sessions);
            } else {
              console.error('Sessions data is not an array:', this.sessions);
            }
          } else {
            console.error('Failed to fetch sessions:', response);
          }
        },
        error: (error) => {
          console.error('Error fetching sessions:', error);
          this.#messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch sessions'
          });
        }
      });
  }

  processSessionsForCalendar(sessions: Session[]) {
    // Reset events
    this.calendarEvents = [];

    // Validate sessions is an array
    if (!Array.isArray(sessions)) {
      console.error('processSessionsForCalendar: sessions is not an array', sessions);
      return;
    }

    // Create events from sessions
    sessions.forEach((session) => {
      try {
        const startDate = new Date(session.start_date);
        const endDate = new Date(session.end_date);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const event: EventInput = {
            id: session.id,
            title: `Class: ${session.taxi?.name || 'Unnamed Class'}`,
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
    let className = 'Unnamed Class';
    if (session.taxi) {
      if (typeof session.taxi === 'object') {
        className = session.taxi.name || session.taxi.title || 'Unnamed Class';
      } else if (typeof session.taxi === 'string') {
        className = session.taxi;
      }
    }

    // Show session details in a toast notification with HTML
    this.#messageService.add({
      severity: 'info',
      summary: `Class: ${className}`,
      detail: `Date: ${date}<br>Time: ${startTime} - ${endTime}<br>Classroom: ${classroomName}<br>Students: ${session.students?.length || 0}`,
      life: 5000,
      sticky: false
    });
  }

  fetchActivities() {
    this.loadingActivities = true;
    // Use the dedicated dashboard activities endpoint
    this.#activityService
      .getActivityDashboard({ limit: 10 })
      .pipe(finalize(() => (this.loadingActivities = false)))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.processActivities(response.data);
          } else {
            this.activities = [];
            this.#messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Could not load activities'
            });
          }
        },
        error: (error) => {
          console.error('Error fetching activities:', error);
          this.activities = [];
          this.#messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch activities'
          });
        }
      });
  }

  processActivities(activitiesData: any[]): void {
    this.activities = activitiesData.map((activity) => {
      // Get user information
      const user = activity.performed_by || {};
      const userName = user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : 'Unknown User';

      // Generate title based on activity type and action
      let title = '';
      let description = '';

      const entityType = (activity.entity_type as EntityType) || 'user';

      switch (entityType) {
        case 'user':
        case 'student':
          title = `${this.capitalizeFirstLetter(activity.action_type)}d ${activity.entity_type}`;
          description = `${userName} ${activity.action_type}d ${activity.entity_type}: ${activity.entity_name}`;
          break;
        case 'post':
          title = `${this.capitalizeFirstLetter(activity.action_type)}d post`;
          description = activity.details || `${userName} ${activity.action_type}d post: ${activity.entity_name}`;
          break;
        case 'taxi':
          title = `${this.capitalizeFirstLetter(activity.action_type)}d class`;
          description = activity.details || `${userName} ${activity.action_type}d class: ${activity.entity_name}`;
          break;
        default:
          title = `${this.capitalizeFirstLetter(activity.action_type)}d ${activity.entity_type}`;
          description = activity.details || `${userName} ${activity.action_type}d ${activity.entity_type}: ${activity.entity_name}`;
      }

      return {
        id: activity._id,
        title,
        description,
        datetime: this.formatDateTime(activity.createdAt),
        icon: this.entityTypeIcons[entityType] || this.defaultIcon,
        entityType
      };
    });
  }

  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      // Yesterday
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      // Within the last week
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Older than a week
      return (
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
    }
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
            this.#messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Could not load posts'
            });
          }
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
          this.posts = [];
          this.#messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch posts'
          });
        }
      });
  }

  fetchAbsences() {
    this.#absencesService.getAbsences().subscribe({
      next: (response) => {
        // Handle both array response and object response with data property
        const absencesData = Array.isArray(response) ? response : response.data || [];

        if (absencesData.length > 0) {
          console.log('Absences data:', absencesData);

          // Map the absence data to the format needed for display
          this.absences = absencesData.map((absence) => {
            // Extract student name
            const student = absence.student as any;
            let studentName = 'Unknown Student';

            if (student && typeof student === 'object') {
              studentName = `${student.firstname || ''} ${student.lastname || ''}`.trim() || 'Unnamed Student';
            }

            // Format session time if available
            const session = absence.session as any;
            let timeRange = 'N/A';

            try {
              if (session && typeof session !== 'string' && session.start_date && session.end_date) {
                const startDate = new Date(session.start_date);
                const endDate = new Date(session.end_date);

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                  timeRange = `${startDate.getHours()}:${startDate.getMinutes().toString().padStart(2, '0')}-${endDate.getHours()}:${endDate
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`;
                }
              }
            } catch (e) {
              console.error('Error formatting session time:', e);
            }

            // Get student phone from the student object if it exists
            let phone = 'N/A';
            if (student && typeof student === 'object' && student.phone) {
              phone = student.phone;
            }

            // Format the absence date
            let absenceDate = 'N/A';
            try {
              if (absence.date) {
                absenceDate = new Date(absence.date).toLocaleDateString();
              }
            } catch (e) {
              console.error('Error formatting date:', e);
            }

            return {
              name: studentName,
              time: timeRange,
              phone: phone,
              date: absenceDate
            };
          });
        } else {
          console.log('No absences found or request failed');
          this.absences = [];
        }
      },
      error: (error) => {
        console.error('Error fetching absences:', error);
        this.absences = [];
        this.#messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch absence data'
        });
      }
    });
  }

  get branchDetails() {
    if (!this.currentCustomer) return null;
    const customer = this.currentCustomer as any;

    // Get administrator and manager names if they exist
    let administratorName = 'N/A';
    let administratorEmail = 'N/A';
    let managerName = 'N/A';
    let managerEmail = 'N/A';

    if (customer.administrator && typeof customer.administrator === 'object') {
      const admin = customer.administrator;
      administratorName = admin.firstname && admin.lastname ? `${admin.firstname} ${admin.lastname}` : 'N/A';
      administratorEmail = admin.email || 'N/A';
    }
    if (administratorName === 'N/A' && typeof customer.administrator_name === 'string') {
      administratorName = customer.administrator_name;
    }
    if (typeof customer.nickname === 'string' && customer.nickname.trim()) {
      administratorName = customer.nickname;
    }
    if (administratorEmail === 'N/A' && typeof customer.administrator_email === 'string') {
      administratorEmail = customer.administrator_email;
    }
    if (typeof customer.customer_email === 'string') {
      administratorEmail = customer.customer_email;
    }

    if (customer.manager && typeof customer.manager === 'object') {
      const manager = customer.manager;
      managerName = manager.firstname && manager.lastname ? `${manager.firstname} ${manager.lastname}` : 'N/A';
      managerEmail = manager.email || 'N/A';
    }
    if (managerName === 'N/A' && typeof customer.manager_name === 'string') {
      managerName = customer.manager_name;
    }
    if (managerEmail === 'N/A' && typeof customer.manager_email === 'string') {
      managerEmail = customer.manager_email;
    }
    if (typeof customer.email === 'string') {
      managerEmail = customer.email;
    }

    return {
      website: customer.website || 'N/A',
      administrator: administratorName,
      manager: managerName,
      address: customer.address || 'N/A',
      branchEmail: customer.email || customer.customer_email || 'N/A',
      administratorEmail: administratorEmail,
      managerEmail: managerEmail,
      phone: customer.phone || 'N/A',
      code: customer.code || customer.slug || 'N/A',
      vat: customer.vat || 'N/A',
      mapLocation: `https://maps.google.com/maps?q=${encodeURIComponent(customer.address || 'Athens, Greece')}&z=15&output=embed`
    };
  }

  absences: {
    name: string;
    time: string;
    phone: string;
    date: string;
  }[] = [];

  readonly finances = [
    { code: 'PPS002', name: 'James A. Baughman', amount: 315, highlight: false },
    { code: 'PPS008', name: 'Norman M. Alexander', amount: 1409, highlight: false },
    { code: 'PPS010', name: 'Joseph E. Ash', amount: 1020, highlight: true },
    { code: 'PPS016', name: 'Patrick A. Smith', amount: 4242, highlight: false },
    { code: 'PPS018', name: 'Aubrey C. Spurlock', amount: 2535, highlight: false },
    { code: 'PPS024', name: 'Socorro R. Martinez', amount: 3402, highlight: true },
    { code: 'PPS026', name: 'Kevin L. Parris', amount: 4261, highlight: false },
    { code: 'PPS032', name: 'Nicholas I. Ivey', amount: 1990, highlight: false },
    { code: 'PPS034', name: 'Mary G. Oneal', amount: 778, highlight: false },
    { code: 'PPS040', name: 'Christina W. Knisely', amount: 1126, highlight: true }
  ];

  // Default placeholder image for posts without a featured image
  readonly defaultPostImage = 'assets/images/dashboard-background.png';

  constructor(private translate: TranslateService) {}

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const locale = this.translate.currentLang === 'el' ? 'el-GR' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }
}
