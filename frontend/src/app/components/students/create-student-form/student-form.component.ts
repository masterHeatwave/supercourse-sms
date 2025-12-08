import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { MediaUploadService } from '../../../services/media-upload.service';
import { StudentFormFieldsService } from './fields/index';
import { PersonalInfoFieldsService } from './fields/personal-info-fields.service';
import { FormUtilsService } from '../../../services/form/form-utils.service';
import { DocumentUploadService } from '../../../services/document-upload.service';
import { DocumentListComponent } from '../../document-list/document-list.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { forkJoin, of, Observable } from 'rxjs';
import { IStudentFormData, IDocument } from '../../../interfaces/student.interface';
import { environment } from '../../../../environments/environment';
import { ContactsComponent } from './fields/contacts/contacts.component';
import { LoggingService } from '../../../services/logging/logging.service';
import { ToastModule } from 'primeng/toast';
import { FormValidationService, STUDENT_FIELD_LABELS, ValidationConfig } from '../../../services/validation/form-validation.service';
import { MessageService } from 'primeng/api';
import { isMinor } from '../../../utils/age-calculation.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-student-form',
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
    ContactsComponent,
    ToastModule
  ],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() studentData: any = null;
  @Input() submitButtonLabel = 'Submit';

  @Output() studentCreated = new EventEmitter<any>();
  @Output() studentUpdated = new EventEmitter<any>();
  @Output() formSubmitError = new EventEmitter<any>();
  @Output() cancelForm = new EventEmitter<void>();

  formFieldsService = inject(StudentFormFieldsService);
  documentUploadService = inject(DocumentUploadService);
  private mediaUploadService = inject(MediaUploadService);
  private queryHandler = inject(QueryHandler);
  private formUtils = inject(FormUtilsService);
  private personalInfoFieldsService = inject(PersonalInfoFieldsService);
  private loggingService = inject(LoggingService);
  private validationService = inject(FormValidationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);

  form = new FormGroup({});
  model: IStudentFormData = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    documents: [] as IDocument[],
    dateOfBirth: undefined, // No default date - user must select
    hasAllergies: false, // Initialize health fields - default to off
    healthDetails: '',
    generalNotes: ''
  };
  personalInfoFields: FormlyFieldConfig[];
  linkedContactFields: FormlyFieldConfig[];
  healthInfoFields: FormlyFieldConfig[];
  generalNotesFields: FormlyFieldConfig[];
  documentUploadFields: FormlyFieldConfig[];
  uploadedFiles: IDocument[] = [];
  private submissionGuard = this.validationService.createSubmissionGuard();
  private validationConfig: ValidationConfig = {
    fieldLabels: STUDENT_FIELD_LABELS
  };

  @ViewChild(ContactsComponent) contactsComponent?: ContactsComponent;

  constructor() {
    // Initialize form sections
    const fields = this.formFieldsService.getAllFields();
    this.personalInfoFields = fields.personalInfoFields;
    this.linkedContactFields = fields.linkedContactFields;
    this.healthInfoFields = fields.healthInfoFields;
    this.generalNotesFields = fields.generalNotesFields;
    this.documentUploadFields = fields.documentUploadFields;
  }

  ngOnInit(): void {
    this.initializeForm();
    
    // Ensure branch field is populated immediately after form initialization
    setTimeout(() => {
      this.personalInfoFieldsService.setEditMode(this.isEditMode, this.studentData);
    }, 0);
    
    // Listen for form changes to update model
    this.form.valueChanges.subscribe((value) => {
      this.model = { ...this.model, ...value };
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditMode']) {
      // Update edit mode in the linked contact fields service
      this.formFieldsService.getLinkedContactFieldsService().setEditMode(this.isEditMode);
    }

    if (changes['studentData'] && this.isEditMode && this.studentData) {
      this.model = { ...this.studentData };
      // Convert date strings to Date objects for calendar fields
      if (this.studentData.dateOfBirth && typeof this.studentData.dateOfBirth === 'string') {
        this.model.dateOfBirth = new Date(this.studentData.dateOfBirth);
      }
      
      // Prefer registration_date, fallback to createdAt for the date field (registration date)
      // Explicitly set date field to avoid any conflicts with dateOfBirth
      if (this.studentData.registration_date && typeof this.studentData.registration_date === 'string') {
        this.model.date = new Date(this.studentData.registration_date);
      } else if (this.studentData.createdAt && typeof this.studentData.createdAt === 'string') {
        this.model.date = new Date(this.studentData.createdAt);
      } else {
        // Clear date if neither registration_date nor createdAt is available
        this.model.date = undefined;
      }
      
      // Ensure health fields are properly set
      this.model.hasAllergies = this.studentData.hasAllergies || false;
      this.model.healthDetails = this.studentData.healthDetails || '';
      this.model.generalNotes = this.studentData.generalNotes || '';

      // Load existing documents if any
      if (this.studentData.documents && this.studentData.documents.length) {
        this.uploadedFiles = [...this.studentData.documents];
      }

      // Set avatar for existing student
      if (this.studentData.avatar) {
        this.personalInfoFieldsService.updateAvatarField(this.studentData.avatar);
        this.model.avatar = this.studentData.avatar;
      }

      // Set registration date for existing student (prefer registration_date, fallback to createdAt)
      const registrationDate = this.studentData.registration_date || this.studentData.createdAt;
      if (registrationDate) {
        this.personalInfoFieldsService.updateDateField(registrationDate);
        this.model.date = typeof registrationDate === 'string' ? new Date(registrationDate) : registrationDate;
      }

      // Update the form with the new model values
      this.form.patchValue(this.model);

      // Force form fields to update
      this.personalInfoFields = [...this.personalInfoFields];
      this.linkedContactFields = [...this.linkedContactFields];
      
      // Update the form with the new model values
      this.form.patchValue(this.model);
    }
  }

  private initializeForm(): void {
    if (this.isEditMode && this.studentData) {
      // In edit mode, populate the form with the student data
      const studentData = this.studentData.data || this.studentData;
      this.model = { 
        ...this.model,
        ...studentData,
        // Handle contact data from the API response
        contactName: studentData.contacts?.[0]?.name || '',
        contactPhone: studentData.contacts?.[0]?.phone || '',
        contactEmail: studentData.contacts?.[0]?.email || '',
        relationship: studentData.contacts?.[0]?.relationship || '',
        isPrimaryContact: studentData.contacts?.[0]?.isPrimaryContact || false
      };

      // Branch will be automatically set from auth service, no need to handle here

      // If documents are available in studentData, populate uploadedFiles
      if (this.studentData.documents && this.studentData.documents.length) {
        this.uploadedFiles = [...this.studentData.documents];
      }

      // Set avatar for existing student
      if (this.studentData.avatar) {
        // Update the field's defaultValue to show existing avatar
        this.personalInfoFieldsService.updateAvatarField(this.studentData.avatar);
        // Set the model avatar to the path (the component will handle the full URL)
        this.model.avatar = this.studentData.avatar;
      }

      // Set registration date for existing student (prefer registration_date, fallback to createdAt)
      const registrationDate = this.studentData.registration_date || this.studentData.createdAt;
      if (registrationDate) {
        this.personalInfoFieldsService.updateDateField(registrationDate);
        this.model.date = typeof registrationDate === 'string' ? new Date(registrationDate) : registrationDate;
      }

      // Ensure health fields are properly set in edit mode
      this.model.hasAllergies = this.studentData.hasAllergies || false;
      this.model.healthDetails = this.studentData.healthDetails || '';
      this.model.generalNotes = this.studentData.generalNotes || '';

      // Update the form with the new model values
      this.form.patchValue(this.model);

      // Convert date strings to Date objects for calendar fields
      if (this.studentData.dateOfBirth && typeof this.studentData.dateOfBirth === 'string') {
        this.model.dateOfBirth = new Date(this.studentData.dateOfBirth);
      }
    }

    // Initialize model with default registration date if not in edit mode
    if (!this.isEditMode && !this.model.startDate) {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`; // dd/mm/YYYY format
      this.model.startDate = formattedDate;
    }

    // Set current date for new students (not in edit mode) - only for registration date
    if (!this.isEditMode) {
      this.model.date = new Date(); // Only set current date for registration date
      // dateOfBirth should remain undefined - user must select it
    }
  }

  onContactsChange(contacts: any[]) {
    // Update the model with the contacts data
    this.model = {
      ...this.model,
      contacts: contacts
    };
  }

  onSiblingAttendingChange(siblingAttending: string[]) {
    this.model = {
      ...this.model,
      siblingAttending: siblingAttending
    };
  }

  async onSubmit() {
    // Prevent multiple submission attempts
    if (!this.submissionGuard.canSubmit()) {
      return;
    }

    this.submissionGuard.startSubmission();

    // Check contacts validation separately since they're not part of the main form
    let hasContactErrors = false;
    if (this.contactsComponent) {
      this.contactsComponent.markAllContactsAsTouched();
      hasContactErrors = this.contactsComponent.hasValidationErrors();
      
      // Show specific message for minors without linked contacts
      if (hasContactErrors && isMinor(this.model.dateOfBirth)) {
        const contacts = this.model.contacts || [];
        const hasNoContacts = contacts.length === 0 || contacts.every(c => !c.name && !c.phone && !c.email);
        
        if (hasNoContacts) {
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('students.errors.linked_contact_required_title'),
            detail: this.translateService.instant('students.errors.linked_contact_required'),
            life: 5000
          });
        }
      }
    }

    // Validate that student email is different from linked contact emails
    const studentEmail = this.form.get('email')?.value || this.model.email;
    const contacts = this.model.contacts || [];
    const contactEmails = contacts
      .map((c: any) => c.email?.toLowerCase().trim())
      .filter((email: string) => email && email.length > 0);
    
    if (studentEmail && contactEmails.length > 0) {
      const studentEmailLower = studentEmail.toLowerCase().trim();
      const matchingContact = contactEmails.find((email: string) => email === studentEmailLower);
      
      if (matchingContact) {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('students.errors.email_validation_title'),
          detail: this.translateService.instant('students.errors.email_must_differ_from_contacts'),
          life: 5000
        });
        hasContactErrors = true;
      }
    }

    if (!this.form.valid || hasContactErrors) {
      this.formUtils.markFormGroupTouched(this.form);
      this.showValidationErrors();
      this.submissionGuard.endSubmission();
      return;
    }

    try {
      // Use model values as the primary source, with form values as fallback
      const formValues: { [key: string]: any } = { ...this.form.value, ...this.model };
      
      // Include contacts from the model since they're managed separately
      if (this.model.contacts && this.model.contacts.length > 0) {
        formValues['contacts'] = this.model.contacts;
      }
      
      // Include siblingAttending only when provided; backend expects string
      if (Array.isArray(this.model.siblingAttending) && this.model.siblingAttending.length > 0) {
        formValues['siblingAttending'] = this.model.siblingAttending.join(',');
      }

      // Ensure health fields are included in the payload (use model values)
      formValues['hasAllergies'] = this.model.hasAllergies !== undefined ? this.model.hasAllergies : false;
      formValues['healthDetails'] = this.model.healthDetails || '';
      formValues['generalNotes'] = this.model.generalNotes || '';

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

      // Prepare the final data object
      const updateData: any = { ...formValues };

      // If no uploads needed, proceed with form submission
      if (uploadTasks.length === 0) {
        // Handle avatar - use existing path if available
        if (this.isEditMode && this.studentData && this.studentData.avatar) {
          updateData.avatar = this.studentData.avatar;
        }

        // Handle documents - use existing files
        if (this.isEditMode && this.uploadedFiles && this.uploadedFiles.length > 0) {
          updateData.documents = this.uploadedFiles;
        }

        // Submit the form
        if (this.isEditMode) {
          this.studentUpdated.emit(updateData);
        } else {
          this.studentCreated.emit(updateData);
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
          } else if (this.isEditMode && this.studentData && this.studentData.avatar) {
            // Keep existing avatar
            updateData.avatar = this.studentData.avatar;
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
                const newDoc: IDocument = {
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

          // Submit the form with all the file paths
          if (this.isEditMode) {
            this.studentUpdated.emit(updateData);
          } else {
            this.studentCreated.emit(updateData);
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

  onCancel(): void {
    this.cancelForm.emit();
  }

  onUpload(event: any): void {
    for (const file of event.files) {
      this.uploadedFiles.push(file);
    }
    // Process files through the service
    this.uploadedFiles = this.documentUploadService.processUploadedFiles(this.uploadedFiles);
    // Update the model
    this.model.documents = [...this.uploadedFiles];
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

  onDownloadDocument(event: { document: any; index: number }): void {
    this.documentUploadService.downloadDocument(event.document).subscribe((success: boolean) => {
      if (success) {
        this.loggingService.debug(`Successfully downloaded document: ${event.document.name}`);
      } else {
        this.loggingService.error(`Failed to download document: ${event.document.name}`);
      }
    });
  }

  private showValidationErrors(): void {
    // Check contacts validation
    const contactErrors = this.validationService.validateContacts(this.model.contacts || []);
    
    // Use the unified validation service
    this.validationService.showValidationErrors(this.form, this.validationConfig, contactErrors);
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
} 