import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentFormComponent } from '@components/students/create-student-form/student-form.component';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UsersService } from '@gen-api/users/users.service';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { CustomersService } from '@gen-api/customers/customers.service';
import { GetCustomers200 } from '@gen-api/schemas';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-edit-student',
  standalone: true,
  imports: [CommonModule, StudentFormComponent, ToastModule, TranslateModule],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [MessageService]
})
export class EditStudentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private branchesService = inject(CustomersService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private store = inject(Store<AppState>);

  studentData$: Observable<any> | undefined;
  studentId: string | undefined;
  currentCustomerId: string | null | undefined;

  ngOnInit() {
    // Get auth state
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
    });

    // Get student ID from route parameters
    this.studentId = this.route.snapshot.paramMap.get('id') || undefined;

    if (!this.studentId) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('api_messages.error_title'), detail: this.translate.instant('students.errors.no_id') });
      this.router.navigate(['/dashboard/students']);
      return;
    }

    // Fetch student data from the API
    this.studentData$ = this.usersService.getUsersStudentsId(this.studentId).pipe(
      switchMap((response: { data: any }) => {
        const data = response.data;
        // First get all branches
        return this.branchesService.getCustomers().pipe(
          map((branchesResponse: GetCustomers200) => {
            const branches = branchesResponse.data || [];

            // Extract the student's current branch IDs
            const studentBranchIds = data.branches?.map((branch: any) => branch.id || branch._id) || [];

            // Map the data to match the form fields
            return {
              ...data,
              _id: data._id,
              firstname: data.firstname,
              lastname: data.lastname,
              username: data.username,
              email: data.email,
              phone: data.phone,
              mobile: data.mobile,
              address: data.address,
              city: data.city,
              zipcode: data.zipcode,
              country: data.country,
              branches: branches, // All available branches for dropdown
              selectedBranches: studentBranchIds, // Student's current branch IDs
              status: data.is_active,
              dateOfBirth: data.birthday,
              createdAt: data.createdAt,
              documents: data.documents || [],
              contacts: data.contacts || [],
              // siblingAttending can be string (comma-separated) or array; normalize to array for UI
              siblingAttending: Array.isArray(data.siblingAttending)
                ? data.siblingAttending
                : (typeof data.siblingAttending === 'string' && data.siblingAttending.trim().length > 0
                  ? data.siblingAttending.split(',').map((s: string) => s.trim())
                  : []),
              hasAllergies: data.hasAllergies || false,
              healthDetails: data.healthDetails || data.notes || '',
              generalNotes: data.generalNotes || data.notes || '',
              avatar: data.avatar || ''
            };
          })
        );
      }),
      catchError((error) => {
        this.messageService.add({ severity: 'error', summary: this.translate.instant('api_messages.error_title'), detail: error.message || this.translate.instant('students.errors.fetch_failed') });
        this.router.navigate(['/dashboard/students']);
        return of(null);
      })
    );
  }

  onStudentUpdated(studentData: any) {
    if (!this.studentId) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('api_messages.error_title'), detail: this.translate.instant('students.errors.no_id') });
      return;
    }

    // Debug: Log raw form data received
    console.log('Raw form data received in student edit component:', studentData);
    console.log('Branch field in raw data:', studentData['branch']);
    console.log('Current Customer ID (branch ID):', this.currentCustomerId);

    // Handle branch field mapping - convert single branch to branches array with current branch ID
    let branches: string[] = [];
    if (studentData['branch'] && this.currentCustomerId) {
      branches = [this.currentCustomerId]; // Use branch ID
      console.log('Mapped branch to branches array with branch ID:', branches);
    } else if (this.currentCustomerId) {
      // Fallback: If no branch field, still set branches to current branch ID
      branches = [this.currentCustomerId]; // Use branch ID
      console.log('Fallback: Set branches to current branch ID:', branches);
    }

    // Regular object handling
    const updateData = {
      id: this.studentId,
      ...studentData,
      firstname: studentData.firstname,
      lastname: studentData.lastname,
      username: studentData.username,
      email: studentData.email,
      phone: studentData.phone,
      mobile: studentData.mobile,
      address: studentData.address,
      city: studentData.city,
      zipcode: studentData.zipcode,
      country: studentData.country,
      default_branch: this.currentCustomerId || '',
      branches: branches, // Use the mapped branches
      is_active: studentData.status,
      birthday: studentData.dateOfBirth,
      created_at: studentData.date,
      documents: studentData.documents || [],
      contacts: studentData.contacts || [],
      // Only send siblingAttending if provided; backend expects comma-separated string
      ...(Array.isArray(studentData.siblingAttending) && studentData.siblingAttending.length > 0
        ? { siblingAttending: studentData.siblingAttending.join(',') }
        : {}),
      hasAllergies: studentData.hasAllergies,
      healthDetails: studentData.healthDetails,
      generalNotes: studentData.generalNotes,
      avatar: studentData.avatar
    };

    this.usersService.putUsersStudentsId(this.studentId, updateData).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: this.translate.instant('api_messages.success_title'), detail: this.translate.instant('students.messages.updated') });
        this.router.navigate(['/dashboard/students']);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: this.translate.instant('api_messages.error_title'), detail: error.message || this.translate.instant('students.errors.update_failed') });
      }
    });
  }

  onError(error: any) {
    this.messageService.add({ severity: 'error', summary: this.translate.instant('api_messages.error_title'), detail: error.message || this.translate.instant('common.error_title') });
  }

  onCancel() {
    this.router.navigate(['/dashboard/students']);
  }
}
