import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentFormComponent } from '@components/students/create-student-form/student-form.component';
import { UsersService } from '@gen-api/users/users.service';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { StudentFormDataService } from '../../../../services/students/student-form-data.service';
import { LoggingService } from '../../../../services/logging/logging.service';
import { PostUsersStudentsBody } from '@gen-api/schemas/postUsersStudentsBody';
import { MediaUploadService } from '../../../../services/media-upload.service';
import { forkJoin, Observable } from 'rxjs';
import { FormValidationService } from '../../../../services/validation/form-validation.service';

@Component({
  selector: 'app-create-student',
  standalone: true,
  imports: [CommonModule, StudentFormComponent, CardModule, ToastModule],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
  providers: [MessageService]
})
export class CreateStudentComponent implements OnInit {
  private studentsService = inject(UsersService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private store = inject(Store<AppState>);
  private studentFormDataService = inject(StudentFormDataService);
  private loggingService = inject(LoggingService);
  private mediaUploadService = inject(MediaUploadService);
  private validationService = inject(FormValidationService);

  parentCustomerId: string | null | undefined;
  currentCustomerId: string | null | undefined;

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      this.parentCustomerId = authState.parentCurrentCustomerId;
    });
  }

  async onStudentCreated(studentDataFromForm: any) {
    this.loggingService.debug('Processing student data');

    try {
      // Set default_branch from auth state
      if (this.currentCustomerId) {
        studentDataFromForm.default_branch = this.currentCustomerId;
      }

      // Process form data
      const studentData = this.studentFormDataService.processFormData(studentDataFromForm);

      // Handle file uploads
      const uploadTasks: (Observable<string> | Observable<string[]>)[] = [];
      let avatarUploadTask: Observable<string> | undefined;

      // Upload avatar file if it exists
      if (studentData.avatar && studentData.avatar instanceof File) {
        avatarUploadTask = this.mediaUploadService.uploadFile(studentData.avatar);
        uploadTasks.push(avatarUploadTask);
      }

      // If no uploads needed, proceed with form submission
      if (uploadTasks.length === 0) {
        this.submitStudentData(studentData);
        return;
      }

      // If we have uploads, wait for all to complete
      forkJoin(uploadTasks).subscribe({
        next: (results) => {
          // Process upload results
          let avatarPath = '';
          let resultIndex = 0;

          // Handle avatar result
          if (avatarUploadTask) {
            avatarPath = results[resultIndex++] as string;
            studentData.avatar = avatarPath;
          }

          // Submit the form with all the file paths
          this.submitStudentData(studentData);
        },
        error: (error) => {
          this.loggingService.error('Error uploading files:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload files'
          });
        }
      });
    } catch (error) {
      this.loggingService.error('Error processing form data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process form data'
      });
    }
  }

  private submitStudentData(studentData: any) {
    // Apply field name mappings
    const mappedData: any = this.studentFormDataService.applyFieldMappings(studentData);

    // Handle branch field mapping - convert single branch to branches array with current branch ID
    if (studentData['branch'] && this.currentCustomerId) {
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
    const validation = this.validationService.validateApiData(mappedData, 'student', this.parentCustomerId);

    if (!validation.isValid) {
      this.loggingService.error('Validation failed:', validation.errors);
      return;
    }

    // Submit to API
    this.createStudent(mappedData);
  }

  private createStudent(studentData: PostUsersStudentsBody): void {
    this.studentsService.postUsersStudents(studentData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Student created successfully'
        });
        this.router.navigate(['/dashboard/students']);
      },
      error: (error) => {
        this.handleApiError(error);
      }
    });
  }

  private handleApiError(error: any): void {
    this.loggingService.error('Failed to create student:', error);

    let detailMessage = 'Failed to create student.';
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

  onCancel() {
    this.router.navigate(['/dashboard/students']);
  }
}
