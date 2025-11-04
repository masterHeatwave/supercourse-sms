import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { QueryHandler } from '@api/queryHandler';
import { DocumentUploadService } from '../../../services/document-upload.service';
import { MediaUploadService } from '../../../services/media-upload.service';
import { DocumentListComponent } from '../../document-list/document-list.component';
import { CommonModule } from '@angular/common';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { StaffFormFieldsService } from './fields/index';
import { PersonalInfoFieldsService } from './fields/personal-info-fields.service';
import { FormUtilsService } from '../../../services/form/form-utils.service';
import { LoggingService } from '../../../services/logging/logging.service';
import { NotesFieldsService } from './fields/notes-fields.service';
import { IDocument } from '../../../interfaces/staff.interfaces';
import { forkJoin, of, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormValidationService, STAFF_FIELD_LABELS, ValidationConfig } from '../../../services/validation/form-validation.service';

@Component({
  selector: 'app-create-staff-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputSwitchModule,
    FileUploadModule,
    InputTextareaModule,
    DocumentListComponent,
    OutlineButtonComponent,
    ToastModule
  ],
  templateUrl: './create-staff-form.component.html',
  styleUrl: './create-staff-form.component.scss'
})
export class CreateStaffFormComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() staffData: any = null;
  @Input() submitButtonLabel = 'Submit';
  @Input() loading = false;

  @Output() staffCreated = new EventEmitter<any>();
  @Output() staffUpdated = new EventEmitter<any>();
  @Output() formSubmitError = new EventEmitter<any>();

  private formFieldsService = inject(StaffFormFieldsService);
  private personalInfoFieldsService = inject(PersonalInfoFieldsService);
  private documentUploadService = inject(DocumentUploadService);
  private mediaUploadService = inject(MediaUploadService);
  private notesFieldsService = inject(NotesFieldsService);
  private queryHandler = inject(QueryHandler);
  private formUtils = inject(FormUtilsService);
  private loggingService = inject(LoggingService);
  private validationService = inject(FormValidationService);

  form = new FormGroup({});
  model: any = { 
    documents: [] as IDocument[],
    startDate: new Date() // Set current date as default for new staff
  };
  personalInfoFields: FormlyFieldConfig[];
  socialMediaFields: FormlyFieldConfig[];
  documentUploadFields: FormlyFieldConfig[];
  notesFields: FormlyFieldConfig[];
  uploadedFiles: IDocument[] = [];
  private submissionGuard = this.validationService.createSubmissionGuard();
  private validationConfig: ValidationConfig = {
    fieldLabels: STAFF_FIELD_LABELS
  };

  constructor() {
    // Get fields from service
    const fields = this.formFieldsService.getAllFields();
    this.personalInfoFields = fields.personalInfoFields;
    this.socialMediaFields = fields.socialMediaFields;
    this.documentUploadFields = fields.documentUploadFields;
    this.notesFields = this.notesFieldsService.getNotesFields();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.staffData) {
      this.model = { ...this.staffData };

      // Branch will be automatically set from auth service, no need to handle here

      // Convert date strings to Date objects for calendar fields
      // For edit mode, use createdAt as startDate (similar to student form)
      if (this.staffData.createdAt && typeof this.staffData.createdAt === 'string') {
        this.model.startDate = new Date(this.staffData.createdAt);
      } else if (this.staffData.startDate && typeof this.staffData.startDate === 'string') {
        this.model.startDate = new Date(this.staffData.startDate);
      }

      // Set edit mode on the form fields service to handle avatar and other fields
      this.formFieldsService.setEditMode(this.isEditMode, this.staffData);

      if (this.staffData.documents && this.staffData.documents.length) {
        this.uploadedFiles = [...this.staffData.documents];
      }
    } else if (!this.isEditMode) {
      // For new staff, ensure startDate and createdAt are set to current date
      this.model.startDate = new Date();
      this.model.createdAt = new Date();
    }

    // Ensure branch field is populated immediately after form initialization
    setTimeout(() => {
      this.personalInfoFieldsService.setEditMode(this.isEditMode, this.staffData);
    }, 0);
  }

  async onSubmit() {
    // Prevent multiple submission attempts
    if (!this.submissionGuard.canSubmit()) {
      return;
    }

    this.submissionGuard.startSubmission();

    if (!this.form.valid) {
      this.formUtils.markFormGroupTouched(this.form);
      this.showValidationErrors();
      this.submissionGuard.endSubmission();
      return;
    }

    try {
      const formValues: { [key: string]: any } = { ...this.form.value };
      
      // Debug: Log form values to see what's being submitted
      console.log('Form values being submitted:', formValues);
      console.log('Branch field value:', formValues['branch']);

      // The branch field is now a single string from auth, no need to convert to array

      // First, handle file uploads separately through the media API
      const uploadTasks: (Observable<string> | Observable<string[]>)[] = [];
      let avatarUploadTask: Observable<string> | undefined;

      // Upload avatar file if it exists
      if (formValues['avatar'] && formValues['avatar'] instanceof File) {
        avatarUploadTask = this.mediaUploadService.uploadFile(formValues['avatar']);
        uploadTasks.push(avatarUploadTask);
      }

      // Upload any new document files
      let newDocuments: File[] = [];
      if (formValues['documents'] && Array.isArray(formValues['documents'])) {
        const documentFiles = formValues['documents'].filter((doc) => doc instanceof File);
        if (documentFiles.length > 0) {
          const docsUploadTask = this.mediaUploadService.uploadMultipleFiles(documentFiles);
          uploadTasks.push(docsUploadTask);
          newDocuments = documentFiles;
        }
      }

      // Prepare the final data object (will become FormData later)
      const updateData: any = { ...formValues };

      // If no uploads needed, proceed with form submission
      if (uploadTasks.length === 0) {
        // Create FormData for submission
        const formData = new FormData();

        // Handle avatar - use existing path if available
        if (this.isEditMode && this.staffData && this.staffData.avatar) {
          updateData.avatar = this.staffData.avatar;
        }

        // Handle documents - use existing files
        if (this.isEditMode && this.uploadedFiles && this.uploadedFiles.length > 0) {
          updateData.documents = this.uploadedFiles;
        }

        // Convert the updateData to FormData
        for (const key in updateData) {
          if (updateData[key] !== null && updateData[key] !== undefined) {
            // Convert objects to JSON strings
            if (typeof updateData[key] === 'object' && !(updateData[key] instanceof File)) {
              formData.append(key, JSON.stringify(updateData[key]));
            } else if (typeof updateData[key] === 'boolean') {
              // Handle boolean values explicitly
              formData.append(key, updateData[key].toString());
            } else {
              formData.append(key, updateData[key]);
            }
          }
        }

        // Submit the form
        if (this.isEditMode) {
          this.staffUpdated.emit(updateData);
        } else {
          this.staffCreated.emit(updateData);
        }
        this.submissionGuard.endSubmission();
        return;
      }

      // If we have uploads, wait for all to complete
      forkJoin(uploadTasks).subscribe({
        next: (results) => {
          // Process upload results
          let avatarPath = '';
          let documentPaths = [];
          let resultIndex = 0;

          // Handle avatar result
          if (avatarUploadTask) {
            avatarPath = results[resultIndex++] as string;
            updateData.avatar = avatarPath;
          } else if (this.isEditMode && this.staffData && this.staffData.avatar) {
            // Keep existing avatar
            updateData.avatar = this.staffData.avatar;
          }

          // Handle document results
          if (newDocuments.length > 0) {
            documentPaths = results[resultIndex++] as string[];

            // Combine existing documents with new ones
            let allDocs: IDocument[] = [];
            if (this.isEditMode && this.uploadedFiles && this.uploadedFiles.length > 0) {
              allDocs = [...this.uploadedFiles];
            }

            // Add new document paths
            documentPaths.forEach((path, index) => {
              const newDoc = {
                url: path,
                name: newDocuments[index].name,
                type: newDocuments[index].type,
                size: newDocuments[index].size
              };
              allDocs.push(newDoc);
            });

            updateData.documents = allDocs;
          } else if (this.isEditMode && this.uploadedFiles && this.uploadedFiles.length > 0) {
            // Keep existing documents
            updateData.documents = this.uploadedFiles;
          }

          // The branch field is now a single string from auth, no need to convert to array

          // Now submit the form with all the file paths
          if (this.isEditMode) {
            this.staffUpdated.emit(updateData);
          } else {
            this.staffCreated.emit(updateData);
          }
          this.submissionGuard.endSubmission();
        },
        error: (error) => {
          this.queryHandler.handleError(error);
          this.formSubmitError.emit(error);
          this.submissionGuard.endSubmission();
        }
      });
    } catch (error) {
      this.queryHandler.handleError(error);
      this.formSubmitError.emit(error);
      this.submissionGuard.endSubmission();
    }
  }

  onDownloadDocument(event: { document: any; index: number }): void {
    this.documentUploadService.downloadDocument(event.document).subscribe((success: boolean) => {
      if (success) {
        this.loggingService.debug(`Successfully downloaded document: ${event.document.name}`);
      } else {
        this.loggingService.error(`Failed to download document: ${event.document.name}`);
      }
    });
  }

  removeFile(index: number): void {
    // Remove the file at the specified index
    if (index >= 0 && index < this.uploadedFiles.length) {
      this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== index);

      // Update the model
      this.model = {
        ...this.model,
        documents: this.uploadedFiles
      };
    }
  }

  private showValidationErrors(): void {
    // Use the unified validation service
    this.validationService.showValidationErrors(this.form, this.validationConfig);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
