import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { ClassroomService, ClassroomWithFormatted } from '@services/classroom.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, combineLatest, forkJoin } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClassroomFormComponent } from '@components/classroom-form/classroom-form.component';
import { Router } from '@angular/router';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { CustomerService } from '@services/customer.service';

export interface CustomerWithClassrooms {
  customer: { label: string; value: string };
  classrooms: ClassroomWithFormatted[];
  totalRecords: number;
}

@Component({
  selector: 'app-classrooms-settings',
  standalone: true,
  imports: [
    CommonModule, 
    PrimaryTableComponent, 
    TranslateModule,
    SpinnerComponent,
    ButtonModule,
    DialogModule,
    TooltipModule,
    ConfirmDialogModule,
    ClassroomFormComponent
  ],
  templateUrl: './classrooms-settings.component.html',
  styleUrl: './classrooms-settings.component.scss',
  providers: [ConfirmationService, MessageService]
})

export class ClassroomsSettingsComponent implements OnInit {
  customersWithClassrooms: CustomerWithClassrooms[] = [];
  isLoading: boolean = false;
  showCreateDialog = false;
  showEditDialog = false;
  selectedClassroom: ClassroomWithFormatted | null = null;
  branches: { label: string; value: string }[] = [];

  constructor(
    private classroomService: ClassroomService,
    private classroomsService: ClassroomsService,
    private customerService: CustomerService,
    private translate: TranslateService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCustomersWithClassrooms();
  }

  private loadCustomersWithClassrooms() {
    this.isLoading = true;
    
    // Get user customers and filter out main customers
    this.customerService.getCurrentUserCustomers().pipe(
      switchMap((customers) => {
        // Filter out main customers (is_main_customer = true)
        const filteredCustomers = customers.filter(customer => !customer.is_main_customer);
        
        if (filteredCustomers.length === 0) {
          console.warn('No non-main customer branches found');
          this.isLoading = false;
          return of([]);
        }
        
        // Map to branches format
        const branches = filteredCustomers.map((customer) => ({
          label: customer.name,
          value: customer.id
        }));
        
        this.branches = branches;
        
        // For each branch, fetch their classrooms
        const classroomRequests = branches.map(branch => 
          this.classroomsService.getClassrooms({ branch: branch.value }).pipe(
            map((classroomsResponse) => {
              const classrooms = (classroomsResponse.data?.results || []).map((classroom: any) => ({
                ...classroom,
                formattedEquipment: this.formatEquipment(classroom.equipment),
                formattedAvailability: this.formatAvailabilityEnum(classroom.availability)
              }));
              
              return {
                customer: branch,
                classrooms,
                totalRecords: classroomsResponse.data?.totalResults || 0
              } as CustomerWithClassrooms;
            }),
            catchError((error) => {
              console.error(`Error loading classrooms for branch ${branch.label}:`, error);
              return of({
                customer: branch,
                classrooms: [],
                totalRecords: 0
              } as CustomerWithClassrooms);
            })
          )
        );
        
        return forkJoin(classroomRequests);
      }),
      catchError((error) => {
        console.error('Error loading user customers:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user customers'
        });
        return of([]);
      })
    ).subscribe((customersWithClassrooms) => {
      this.isLoading = false;
      this.customersWithClassrooms = customersWithClassrooms;
    });
  }

  tableColumns = [
    {
      field: 'name',
      header: 'classrooms.table.name',
      sortable: true
    },
    {
      field: 'customer',
      header: 'classrooms.table.branch',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => {
        if (typeof rowData.customer === 'object' && rowData.customer?.name) {
          return rowData.customer.name;
        }
        return this.translate.instant('common.unknown');
      }
    },
    {
      field: 'location',
      header: 'classrooms.table.location',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => rowData.location || this.translate.instant('common.unknown')
    },
    {
      field: 'capacity',
      header: 'classrooms.table.capacity',
      sortable: true,
      getValue: (rowData: ClassroomWithFormatted) => rowData.capacity ? rowData.capacity.toString() : this.translate.instant('common.unknown')
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

  private formatEquipment(equipment: string[] | undefined): string {
    if (!equipment || equipment.length === 0) {
      return this.translate.instant('common.none');
    }
    
    const maxItems = 3; // Show 3 items max
    const visibleItems = equipment.slice(0, maxItems);
    const hasMore = equipment.length > maxItems;
    
    let result = visibleItems.join(', ');
    if (hasMore) {
      result += '...';
    }
    
    return result;
  }

  private formatAvailabilityEnum(availability: string | undefined): string {
    if (!availability) {
      return this.translate.instant('common.unknown');
    }
    
    const availabilityMap: { [key: string]: string } = {
      'available': 'settings.classrooms.availability_status.available',
      'unavailable': 'settings.classrooms.availability_status.unavailable',
      'under_maintenance': 'settings.classrooms.availability_status.under_maintenance',
      'out_of_order': 'settings.classrooms.availability_status.out_of_order'
    };
    
    return this.translate.instant(availabilityMap[availability] || availability);
  }

  onRetry() {
    this.loadCustomersWithClassrooms();
  }

  onAdd() {
    this.selectedClassroom = null;
    this.showCreateDialog = true;
  }

  onEdit(classroom: ClassroomWithFormatted) {
    this.selectedClassroom = classroom;
    this.showEditDialog = true;
  }
  
  onRowSelect(classroom: ClassroomWithFormatted) {
    this.onView(classroom);
  }

  onView(classroom: ClassroomWithFormatted) {
    console.log('onView called with classroom:', classroom);
    if (classroom.id) {
      console.log('Navigating to classroom:', classroom.id);
      this.router.navigate(['/dashboard/settings/classroom', classroom.id]);
    } else {
      console.error('No classroom ID provided');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No classroom ID provided'
      });
    }
  }

  onDelete(classroom: ClassroomWithFormatted) {
    if (!classroom.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No classroom ID provided'
      });
      return;
    }

    const classroomName = classroom.name || 'this classroom';

    this.confirmationService.confirm({
      message: `This will permanently remove ${classroomName}. This action cannot be undone.`,
      header: 'Delete Classroom',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteClassroom(classroom.id!);
      }
    });
  }

  private deleteClassroom(classroomId: string) {
    this.classroomService.deleteClassroom(classroomId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Classroom has been deleted successfully'
        });

        // Refresh the list
        this.loadCustomersWithClassrooms();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to delete classroom'
        });
      }
    });
  }

  onFormSubmitted(event: any) {
    this.showCreateDialog = false;
    this.showEditDialog = false;
    this.selectedClassroom = null;
    
    // Refresh the list
    this.loadCustomersWithClassrooms();
  }

  onFormCancelled() {
    this.showCreateDialog = false;
    this.showEditDialog = false;
    this.selectedClassroom = null;
  }
}
