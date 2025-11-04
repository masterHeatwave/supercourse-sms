import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { TranslateModule } from '@ngx-translate/core';

interface CalendarCategory { id: string; name: string; color: string; }
interface InviteeOption { label: string; value: string; }

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    DropdownModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    CheckboxModule,
    CalendarModule,
    TagModule,
    TranslateModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  #router = inject(Router);
  #fb = inject(FormBuilder);

  // Toolbar/dummy filters
  academicPeriods = [
    { label: 'calendar.filters.academic_period', value: 'ap' },
    { label: 'calendar.filters.period_a', value: 'a' },
    { label: 'calendar.filters.period_b', value: 'b' }
  ];
  selectedPeriod = this.academicPeriods[0].value;

  categories: CalendarCategory[] = [
    { id: 'cat-a', name: 'calendar.categories.a', color: '#f2b6b6' },
    { id: 'cat-b', name: 'calendar.categories.b', color: '#ffd166' },
    { id: 'cat-c', name: 'calendar.categories.c', color: '#06d6a0' },
    { id: 'cat-d', name: 'calendar.categories.d', color: '#118ab2' }
  ];

  inviteeOptions: InviteeOption[] = [
    { label: 'calendar.invitees.all_students', value: 'students' },
    { label: 'calendar.invitees.all_staff', value: 'staff' },
    { label: 'calendar.invitees.all', value: 'all' }
  ];

  // Dialog state
  showCreateDialog = false;
  showDetailsDialog = false;

  createForm!: FormGroup;
  selectedEvent: any = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false },
    eventClick: (arg) => this.onEventClick(arg.event),
  };

  ngOnInit() {
    this.createForm = this.#fb.group({
      title: ['', Validators.required],
      location: [''],
      description: ['', Validators.required],
      start: [new Date(), Validators.required],
      end: [new Date(), Validators.required],
      allDay: [false],
      invitees: [this.inviteeOptions[0].value, Validators.required],
      category: [this.categories[0].id, Validators.required]
    });

    // Seed with dummy events
    const dummy = this.generateDummyEvents();
    this.calendarOptions.events = dummy;
  }

  // Buttons
  onDownloadCalendar() {
    // Stub: replace with real export later
    console.log('Download calendar clicked');
  }

  goToMyEvents() {
    this.#router.navigate(['/dashboard/calendar/events']);
  }

  openCreateDialog() {
    this.showCreateDialog = true;
  }

  saveEvent() {
    if (this.createForm.invalid) return;

    const form = this.createForm.value;
    const cat = this.categories.find(c => c.id === form.category);

    const newEvent: EventInput = {
      id: 'evt_' + Math.random().toString(36).slice(2, 9),
      title: form.title,
      start: form.start,
      end: form.end,
      allDay: !!form.allDay,
      backgroundColor: cat?.color || '#7c3aed',
      extendedProps: {
        location: form.location,
        description: form.description,
        invitees: form.invitees,
         category: cat?.name || 'calendar.categories.generic',
        creator: 'John Smith',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const current = (this.calendarOptions.events as EventInput[]) || [];
    this.calendarOptions = { ...this.calendarOptions, events: [...current, newEvent] };
    this.showCreateDialog = false;
    this.createForm.reset({
      title: '', location: '', description: '', start: new Date(), end: new Date(), allDay: false,
      invitees: this.inviteeOptions[0].value, category: this.categories[0].id
    });
  }

  // Event click -> open details dialog
  onEventClick(event: any) {
    this.selectedEvent = event;
    this.showDetailsDialog = true;
  }

  private generateDummyEvents(): EventInput[] {
    const now = new Date();
    const baseMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const toDate = (d: Date, dayOffset: number, hour: number) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + dayOffset);
      nd.setHours(hour, 0, 0, 0);
      return nd;
    };

    return [
      {
        id: 'evt1',
        title: 'Seminar Days',
        start: toDate(baseMonth, 10, 9),
        end: toDate(baseMonth, 12, 17),
        backgroundColor: this.categories[0].color,
        allDay: false,
        extendedProps: {
          location: 'Tsimiski 153, Thessaloniki Center',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          invitees: 'All Students',
          category: 'Category A',
          creator: 'John Smith',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'evt2',
        title: 'Event title',
        start: toDate(baseMonth, 7, 0),
        end: toDate(baseMonth, 7, 1),
        backgroundColor: '#3b82f6'
      },
      {
        id: 'evt3',
        title: 'Event title',
        start: toDate(baseMonth, 17, 13),
        end: toDate(baseMonth, 17, 14),
        backgroundColor: '#3b82f6'
      },
      {
        id: 'evt4',
        title: 'Event title',
        start: toDate(baseMonth, 23, 15),
        end: toDate(baseMonth, 23, 16),
        backgroundColor: '#3b82f6'
      }
    ];
  }
}
