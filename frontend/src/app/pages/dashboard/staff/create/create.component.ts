import { Component, inject } from '@angular/core';
import { CreateStaffFormComponent } from '@components/staff/create-staff-form/create-staff-form.component';
import { Router } from '@angular/router';
import { UsersService } from '@gen-api/users/users.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { StaffFormDataService } from '../../../../services/staff/staff-form-data.service';
import { LoggingService } from '../../../../services/logging/logging.service';
import { IStaffApiData } from '../../../../interfaces/staff.interfaces';
import { FormValidationService } from '../../../../services/validation/form-validation.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CreateStaffFormComponent, ToastModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  providers: [MessageService]
})
export class CreateComponent {
  private router = inject(Router);
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private store = inject(Store<AppState>);
  private staffFormDataService = inject(StaffFormDataService);
  private loggingService = inject(LoggingService);
  private validationService = inject(FormValidationService);

  parentCustomerId: string | null | undefined;
  currentCustomerId: string | null | undefined; // This is the branch ID
  loading = false;

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.parentCustomerId = authState.parentCurrentCustomerId;
      this.currentCustomerId = authState.currentCustomerId; // Get the branch ID
    });
  }

  async onStaffCreated(staffDataFromForm: any) {
    this.loggingService.debug('Processing staff data');

    try {
      // Process form data
      const staffData = this.staffFormDataService.processFormData(staffDataFromForm);

      // Apply field name mappings
      const mappedData = this.staffFormDataService.applyFieldMappings(staffData);

      // Handle branch field mapping - convert single branch to branches array with current branch ID
      if (staffData['branch'] && this.currentCustomerId) {
        mappedData['branches'] = [this.currentCustomerId]; // Use branch ID, not customer ID
        delete mappedData['branch'];
        console.log('Mapped branch to branches array with branch ID:', mappedData['branches']);
      } else {
        // Fallback: If no branch field, still set branches to current branch ID
        if (this.currentCustomerId) {
          mappedData['branches'] = [this.currentCustomerId]; // Use branch ID, not customer ID
          console.log('Fallback: Set branches to current branch ID:', mappedData['branches']);
        }
      }

      // Validate using unified validation service
      const validation = this.validationService.validateApiData(mappedData, 'staff', this.parentCustomerId);

      if (!validation.isValid) {
        this.loggingService.error('Validation failed:', validation.errors);
        return;
      }

      console.log('mappedData', mappedData);
      // Submit to API
      this.createStaffMember(mappedData);
    } catch (error) {
      this.loggingService.error('Error processing form data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process form data'
      });
    }
  }

  private createStaffMember(staffData: IStaffApiData): void {
    this.loading = true;
    this.usersService.postUsersStaff(staffData).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Staff member created successfully'
        });
        this.router.navigate(['/dashboard/staff']);
      },
      error: (error) => {
        this.loading = false;
        this.handleApiError(error);
      }
    });
  }

  private handleApiError(error: any): void {
    this.loggingService.error('Failed to create staff member:', error);

    let detailMessage = 'Failed to create staff member.';
    if (error?.error?.message) {
      detailMessage = error.error.message;
    } else if (error?.error?.errors) {
      detailMessage = error.error.errors.map((e: any) => e.message).join(', ');
    } else if (error?.message) {
      detailMessage = error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: detailMessage
    });
  }

  onError(error: any) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'An error occurred'
    });
  }
}
