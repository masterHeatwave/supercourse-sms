import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ClassroomService, ClassroomWithFormatted } from '@services/classroom.service';
import { ClassroomFormComponent } from '@components/classroom-form/classroom-form.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Classroom } from '@gen-api/schemas';
import { ExtendedClassroom } from '@gen-api/schemas/extendedClassroom';
import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-classrooms',
  standalone: true,
  imports: [
    CommonModule, 
    PrimaryTableComponent, 
    ButtonModule, 
    InputTextModule, 
    FormsModule,
    TooltipModule,
    DialogModule,
    ClassroomFormComponent,
    TranslateModule
  ],
  templateUrl: './classrooms.component.html',
  styleUrl: './classrooms.component.scss'
})
export class ClassroomsComponent implements OnInit {
  searchValue: string = '';
  classrooms: ClassroomWithFormatted[] = [];
  totalRecords: number = 0;
  loading = true;
  error = false;
  showCreateDialog = false;
  showEditDialog = false;
  selectedClassroom: ExtendedClassroom | null = null;

  constructor(private classroomService: ClassroomService, private translate: TranslateService) {}

  ngOnInit() {
    this.setupPaginatedStream();
  }

  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(10);

  private setupPaginatedStream() {
    this.loading = true;
    this.error = false;

    combineLatest([this.pageSubject, this.limitSubject])
      .pipe(
        switchMap(([page, limit]) =>
          this.classroomService.getClassroomsPaginated(page, limit).pipe(
            catchError((error) => {
              console.error('Error loading classrooms:', error);
              this.error = true;
              this.loading = false;
              return of({ classrooms: [], totalResults: 0 });
            })
          )
        )
      )
      .subscribe(({ classrooms, totalResults }) => {
        this.loading = false;
        this.classrooms = classrooms;
        this.totalRecords = totalResults;
      });
  }

  tableColumns = [
    {
      field: 'name',
      header: 'classrooms.table.name',
      sortable: true
    },
    {
      field: 'branch',
      header: 'classrooms.table.branch',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => {
        if (rowData.customer && typeof rowData.customer === 'object') {
          return rowData.customer.name || this.translate.instant('classrooms.unknown_branch');
        }
        return this.translate.instant('common.unknown');
      }
    },
    {
      field: 'capacity',
      header: 'classrooms.table.capacity',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => rowData.capacity ? rowData.capacity.toString() : this.translate.instant('common.unknown')
    },
    {
      field: 'location',
      header: 'classrooms.table.location',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => rowData.location || this.translate.instant('common.unknown')
    },
    {
      field: 'formattedEquipment',
      header: 'classrooms.table.equipment',
      sortable: false
    },
    {
      field: 'formattedAvailability',
      header: 'classrooms.table.availability',
      sortable: false
    }
  ];

  get filteredData() {
    const term = (this.searchValue || '').trim().toLowerCase();
    if (!term) return this.classrooms;
    return this.classrooms.filter((classroom) => {
      const name = (classroom.name || '').toLowerCase();
      const location = (classroom.location || '').toLowerCase();
      const equipment = Array.isArray(classroom.equipment) ? classroom.equipment.map((e: string) => (e || '').toLowerCase()) : [];
      return (
        name.includes(term) ||
        (!!location && location.includes(term)) ||
        equipment.some((e: string) => e.includes(term))
      );
    });
  }

  onEdit(classroom: ClassroomWithFormatted) {
    console.log('Edit classroom:', classroom);
    
    // Fetch the complete classroom data from the API
    this.classroomService.getClassroomById(classroom.id)
      .pipe(
        catchError((error) => {
          console.error('Error fetching classroom:', error);
          alert('Failed to load classroom data');
          return of(null);
        })
      )
      .subscribe((classroomData) => {
        if (classroomData) {
          this.selectedClassroom = classroomData as any; // Type assertion to handle the API response
          this.showEditDialog = true;
        }
      });
  }

  onDelete(classroom: ClassroomWithFormatted) {
    console.log('Delete classroom:', classroom);
    if (confirm(`Are you sure you want to delete the classroom "${classroom.name}"?`)) {
      this.classroomService.deleteClassroom(classroom.id)
        .pipe(
          catchError((error) => {
            console.error('Error deleting classroom:', error);
            alert('Failed to delete classroom');
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response !== null) {
            this.pageSubject.next(1); // Reload the first page
          }
        });
    }
  }

  onView(classroom: ClassroomWithFormatted) {
    console.log('View classroom:', classroom);
    this.selectedClassroom = classroom;
    this.showEditDialog = true;
  }

  onAdd() {
    console.log('Add new classroom');
    this.selectedClassroom = null;
    this.showCreateDialog = true;
  }

  toggleViewMode() {
    console.log('Toggle view mode');
    // TODO: Implement view mode toggle
  }

  onExport() {
    console.log('Export data');
    // TODO: Implement export functionality
  }

  onFormSubmitted(result: any) {
    console.log('Form submitted:', result);
    this.showCreateDialog = false;
    this.showEditDialog = false;
    this.selectedClassroom = null;
    this.pageSubject.next(1); // Reload the first page
  }

  onFormCancelled() {
    this.showCreateDialog = false;
    this.showEditDialog = false;
    this.selectedClassroom = null;
  }

  onPageChange(event: { page: number; rows: number }) {
    this.pageSubject.next(event.page);
    this.limitSubject.next(event.rows);
  }

  onRowsPerPageChange(rows: number) {
    this.limitSubject.next(rows);
    this.pageSubject.next(1);
  }

  onRetry() {
    this.pageSubject.next(this.pageSubject.value);
  }

  // Trigger pagination refresh when search input changes
  onSearchChange(value: string) {
    this.searchValue = value;
    this.pageSubject.next(1);
  }
}
