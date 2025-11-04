import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { TranslateModule } from '@ngx-translate/core';

interface EventRow {
  id: string;
  code: string;
  title: string;
  starts: Date;
  ends: Date;
  allDay: boolean;
  category: { name: string; color: string };
  invitees: string;
  content: string;
}

@Component({
  selector: 'app-calendar-events',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, TagModule, TooltipModule, PrimaryTableComponent, TranslateModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class CalendarEventsComponent {
  #router = inject(Router);

  academicPeriods = [
    { label: 'calendar.filters.academic_period', value: 'ap' },
    { label: 'calendar.filters.period_a', value: 'a' },
    { label: 'calendar.filters.period_b', value: 'b' }
  ];
  selectedPeriod = this.academicPeriods[0].value;

  loading = false;

  rows = 10;
  totalRecords = 24;

  data: EventRow[] = this.generateDummyRows();

  columns = [
    { field: 'code', header: 'Code', sortable: true },
    {
      field: 'title',
      header: 'calendar.form.title',
      sortable: true,
      getValue: (row: EventRow) => row.title
    },
    { field: 'starts', header: 'calendar.details.start', sortable: true, getValue: (r: EventRow) => this.formatDate(r.starts) },
    { field: 'ends', header: 'calendar.details.end', sortable: true, getValue: (r: EventRow) => this.formatDate(r.ends) },
    { field: 'allDay', header: 'calendar.form.all_day', sortable: true, getValue: (r: EventRow) => (r.allDay ? 'Yes' : 'No') },
    {
      field: 'category',
      header: 'calendar.categories.generic',
      sortable: true,
      getValue: (r: EventRow) => r.category.name
    },
    { field: 'invitees', header: 'calendar.details.invitees', sortable: true },
    { field: 'content', header: 'calendar.form.description' },
    {
      field: 'actions',
      header: '',
      buttonConfig: {
        label: 'common.edit',
        icon: 'pi pi-pencil',
        class: 'p-button-text p-button-sm',
        onClick: (row: EventRow) => this.onEdit(row)
      }
    }
  ];

  onEdit(row: EventRow) {
    // Navigate to calendar page for now
    this.#router.navigate(['/dashboard/calendar']);
  }

  onDelete(row: EventRow) {
    console.log('Delete event (dummy):', row.id);
  }

  onCreate() {
    this.#router.navigate(['/dashboard/calendar']);
  }

  onDownload() {
    console.log('Download events (dummy)');
  }

  private formatDate(d: Date): string {
    return new Date(d).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private generateDummyRows(): EventRow[] {
    const now = new Date();
    const mk = (i: number, title: string, color: string, catName: string, allDay = false): EventRow => ({
      id: 'id' + i,
      code: 'CE' + (100 + i),
      title,
      starts: new Date(now.getFullYear(), now.getMonth(), 10 + (i % 10), 9, 0),
      ends: new Date(now.getFullYear(), now.getMonth(), 10 + (i % 10), 11, 0),
      allDay,
      category: { name: catName, color },
      invitees: i % 2 ? 'All Students' : 'All Staff',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    });

    return [
      mk(1, 'Event Title', '#ef9a9a', 'Category 1'),
      mk(2, 'Event Title', '#ffd166', 'Category 2'),
      mk(3, 'Event Title', '#06d6a0', 'Category 3', true),
      mk(4, 'Event Title', '#118ab2', 'Category 4'),
      mk(5, 'Event Title', '#f4a261', 'Category 5'),
      mk(6, 'Event Title', '#2a9d8f', 'Category 6', true),
      mk(7, 'Event Title', '#ffb703', 'Category 7'),
      mk(8, 'Event Title', '#90be6d', 'Category 3')
    ];
  }
}
