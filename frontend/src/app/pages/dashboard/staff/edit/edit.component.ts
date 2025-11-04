import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateStaffFormComponent } from '@components/staff/create-staff-form/create-staff-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UsersService } from '@gen-api/users/users.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CustomersService } from '@gen-api/customers/customers.service';
import { ApiResponse } from '@interfaces/api-response';
import { GetCustomers200 } from '@gen-api/schemas';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { StaffFormDataService } from '../../../../services/staff/staff-form-data.service';
import { LoggingService } from '../../../../services/logging/logging.service';
import { FormValidationService } from '../../../../services/validation/form-validation.service';
import { IStaffApiData } from '../../../../interfaces/staff.interfaces';
import { PutUsersStaffIdBody } from '@gen-api/schemas';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CommonModule, CreateStaffFormComponent, ToastModule],
  templateUrl: 'edit.component.html',
  styleUrl: './edit.component.scss',
  providers: [MessageService]
})
export class EditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private branchesService = inject(CustomersService);
  private messageService = inject(MessageService);
  private store = inject(Store<AppState>);
  private staffFormDataService = inject(StaffFormDataService);
  private loggingService = inject(LoggingService);
  private validationService = inject(FormValidationService);

  staffData$: Observable<any> | undefined;
  staffId: string | undefined;
  customerId: string | null | undefined;
  loading = false;

  ngOnInit() {
    // Get current customer ID from store
    this.store.select(selectAuthState).subscribe((authState) => {
      this.customerId = authState.currentCustomerId;
    });

    // Get staff ID from route parameters
    this.staffId = this.route.snapshot.paramMap.get('id') || undefined;

    if (!this.staffId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No staff ID provided'
      });
      this.router.navigate(['/dashboard/staff']);
      return;
    }

    // Fetch staff data from the API
    this.staffData$ = this.usersService.getUsersStaffId(this.staffId).pipe(
      switchMap((response: { data: any }) => {
        const data = response.data;
        // First get all branches
        return this.branchesService.getCustomers().pipe(
          map((branchesResponse: GetCustomers200) => {
            const branches = branchesResponse.data || [];

            // Extract the staff's current branch IDs
            const staffBranchIds = data.branches?.map((branch: any) => branch.id || branch._id) || [];

            // Map the data to match the form fields
            const mappedRole = data.roles?.[0]?.id || data.role;

            const mappedData = {
              ...data,
              firstname: data.firstname,
              lastname: data.lastname,
              email: data.email,
              phone: data.phone,
              mobile: data.mobile,
              address: data.address,
              city: data.city,
              region: data.region,
              zipcode: data.zipcode,
              country: data.country,
              role: mappedRole,
              roleTitle: data.role_title,
              branches: branches, // All available branches for dropdown
              selectedBranches: staffBranchIds, // Staff's current branch IDs
              facebook_link: data.facebook_link,
              twitter_link: data.twitter_link,
              linkedin_link: data.linkedin_link,
              status: data.is_active,
              startDate: data.createdAt, // Use createdAt instead of hire_date
              documents: data.documents || []
            };

            return mappedData;
          })
        );
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to fetch staff data'
        });
        this.router.navigate(['/dashboard/staff']);
        return of(null);
      })
    );

    this.staffData$.subscribe((staffData) => {
      console.log(staffData);
    });
  }

  async onStaffUpdated(staffDataFromForm: any) {
    if (!this.staffId) {
      console.error('No staff ID available for update');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No staff ID provided'
      });
      return;
    }

    console.log('Staff ID for update:', this.staffId);
    this.loggingService.debug('Processing staff update data');

    try {
      // Debug: Log raw form data received
      console.log('Raw form data received in edit component:', staffDataFromForm);
      console.log('Branch field in raw data:', staffDataFromForm['branch']);
      console.log('Current Customer ID (branch ID):', this.customerId);

      // Process form data using the same service as create
      const staffData = this.staffFormDataService.processFormData(staffDataFromForm);
      console.log('Processed staff data:', staffData);

      // Apply field name mappings
      const mappedData = this.staffFormDataService.applyFieldMappings(staffData);
      console.log('Mapped data:', mappedData);

      // Handle branch field mapping - convert single branch to branches array with current branch ID
      if (staffData['branch'] && this.customerId) {
        mappedData['branches'] = [this.customerId]; // This is the branch ID
        delete mappedData['branch'];
        console.log('Mapped branch to branches array with branch ID:', mappedData['branches']);
      } else {
        // Fallback: If no branch field, still set branches to current branch ID
        if (this.customerId) {
          mappedData['branches'] = [this.customerId]; // This is the branch ID
          console.log('Fallback: Set branches to current branch ID:', mappedData['branches']);
        }
      }

      // Validate using unified validation service
      const validation = this.validationService.validateApiData(mappedData, 'staff', this.customerId);
      console.log('Validation result:', validation);

      if (!validation.isValid) {
        console.error('Validation failed:', validation.errors);
        this.loggingService.error('Validation failed:', validation.errors);
        return;
      }

      // Ensure the ID is included in the data as required by PutUsersStaffIdBody
      const updateData = {
        ...mappedData,
        id: this.staffId
      };

      console.log('Final update data (with ID):', updateData);
      console.log('Zipcode in final update data:', updateData.zipcode);
      console.log('Calling updateStaffMember with staffId:', this.staffId);

      // Submit to API
      this.updateStaffMember(updateData);
    } catch (error) {
      console.error('Error processing form data:', error);
      this.loggingService.error('Error processing form data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process form data'
      });
    }
  }

  private updateStaffMember(staffData: PutUsersStaffIdBody): void {
    console.log('updateStaffMember called with:', staffData);
    console.log('Using staff ID:', this.staffId);

    this.loading = true;

    this.usersService.putUsersStaffId(this.staffId!, staffData).subscribe({
      next: (response) => {
        console.log('Update API call successful:', response);
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Staff member updated successfully'
        });
        this.router.navigate(['/dashboard/staff']);
      },
      error: (error) => {
        console.error('Update API call failed:', error);
        this.loading = false;
        this.handleApiError(error);
      }
    });
  }

  private handleApiError(error: any): void {
    this.loggingService.error('Failed to update staff member:', error);

    let detailMessage = 'Failed to update staff member.';
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
