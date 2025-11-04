import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UsersService } from '@gen-api/users/users.service';
import { CustomersService } from '@gen-api/customers/customers.service';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import type { GetUsersStudentsClientResult } from '@gen-api/users/users.service';
import { PostInventoryBody, PutInventoryIdBody } from '@gen-api/schemas';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { PrimaryTextareaComponent } from '@components/inputs/primary-textarea/primary-textarea.component';
import { PrimaryCalendarComponent } from '@components/inputs/primary-calendar/primary-calendar.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { InventoryDetailsFieldsService, InventoryDatesFieldsService, InventoryNotesFieldsService } from './fields';
import { FormValidationService, ValidationConfig } from '@services/validation/form-validation.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    CardModule,
    ButtonModule,
    ToastModule,
    TranslateModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    CalendarModule,
    PrimaryDropdownComponent,
    PrimaryTextareaComponent,
    PrimaryCalendarComponent,
    OutlineButtonComponent
  ],
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss'],
  providers: [MessageService]
})
export class InventoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private usersService = inject(UsersService);
  private customersService = inject(CustomersService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private detailsFieldsService = inject(InventoryDetailsFieldsService);
  private datesFieldsService = inject(InventoryDatesFieldsService);
  private notesFieldsService = inject(InventoryNotesFieldsService);
  private validationService = inject(FormValidationService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() context: 'asset' | 'elibrary' = 'asset';
  @Input() inventoryId?: string;
  @Input() initialValue?: Partial<PutInventoryIdBody | PostInventoryBody>;
  @Input() returnTo: string[] = ['/dashboard'];

  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  students: { label: string; value: string }[] = [];
  customerId: string | null = null;

  // Formly fields
  detailsFields: FormlyFieldConfig[] = [];
  datesFields: FormlyFieldConfig[] = [];
  notesFields: FormlyFieldConfig[] = [];
  model: any = {
    user: '',
    title: '',
    billing_date: '',
    return_date: '',
    notes: ''
  };

  // Validation configuration
  private validationConfig: ValidationConfig = {
    fieldLabels: {
      user: 'Billing Person',
      title: 'Asset/Book Title',
      billing_date: 'Billing Date',
      return_date: 'Return Date',
      notes: 'Notes'
    }
  };
  submissionGuard = this.validationService.createSubmissionGuard();

  get titleLabel() {
    return this.context === 'elibrary'
      ? this.translate.instant('inventory.fields.bookTitle') || 'Book Title'
      : this.translate.instant('inventory.fields.assetTitle') || 'Asset Title';
  }

  /**
   * Custom validator to ensure billing date is before return date
   */
  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const billingDate = control.get('billing_date')?.value;
      const returnDate = control.get('return_date')?.value;

      // If either date is missing, don't validate (let required validators handle that)
      if (!billingDate || !returnDate) {
        return null;
      }

      const billing = new Date(billingDate);
      const returnD = new Date(returnDate);

      // Check if dates are valid
      if (isNaN(billing.getTime()) || isNaN(returnD.getTime())) {
        return null; // Let individual field validators handle invalid dates
      }

      // Check if billing date is before return date
      if (billing >= returnD) {
        return { 
          dateRange: { 
            message: 'Billing date must be before return date',
            billingDate: billingDate,
            returnDate: returnDate
          } 
        };
      }

      return null;
    };
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      user: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      billing_date: ['', Validators.required],
      return_date: ['', Validators.required],
      notes: ['']
    }, { validators: this.dateRangeValidator() });

    // Initialize fields
    this.detailsFields = this.detailsFieldsService.getFields();
    this.datesFields = this.datesFieldsService.getFields();
    this.notesFields = this.notesFieldsService.getFields();

    // Set up date change listeners for real-time validation
    this.setupDateChangeListeners();

    if (this.initialValue) {
      // Extract user ID from user object if it exists in initialValue
      const userId = (this.initialValue as any)?.user?.id || (this.initialValue as any)?.user;
      
      this.model = {
        ...this.initialValue,
        user: userId,
        billing_date: (this.initialValue as any)?.billing_date ? new Date((this.initialValue as any).billing_date as any) : '',
        return_date: (this.initialValue as any)?.return_date ? new Date((this.initialValue as any).return_date as any) : ''
      };
      this.form.patchValue(this.model);
    }

    // Load data in proper sequence
    this.loadData();
  }

  /**
   * Set up date change listeners for real-time validation
   */
  private setupDateChangeListeners(): void {
    // Listen to billing date changes
    this.form.get('billing_date')?.valueChanges.subscribe((billingDate) => {
      if (billingDate) {
        // Update return date minimum date to be after billing date
        this.updateReturnDateMinDate(billingDate);
      }
    });

    // Listen to return date changes
    this.form.get('return_date')?.valueChanges.subscribe((returnDate) => {
      if (returnDate) {
        // Trigger form validation to check date range
        this.form.updateValueAndValidity();
      }
    });
  }

  /**
   * Update the minimum date for return date based on billing date
   */
  private updateReturnDateMinDate(billingDate: Date | string): void {
    const billing = new Date(billingDate);
    if (!isNaN(billing.getTime())) {
      // Set minimum return date to be the day after billing date
      const minReturnDate = new Date(billing);
      minReturnDate.setDate(minReturnDate.getDate() + 1);
      
      // Update the return date field's minDate property
      const returnDateField = this.datesFields.find(field => 
        field.key === 'return_date' && field.fieldGroup
      );
      if (returnDateField?.fieldGroup) {
        const returnDateConfig = returnDateField.fieldGroup.find(f => f.key === 'return_date');
        if (returnDateConfig?.props) {
          returnDateConfig.props['minDate'] = minReturnDate;
        }
      }
    }
  }

  private loadData(): void {
    // Load students and customer data
    const students$ = this.usersService.getUsersStudents({ page: '1', limit: '100' });
    const customer$ = this.customersService.getCustomersMain();
    
    // Load inventory data if in edit mode
    const inventory$ = this.mode === 'edit' && this.inventoryId 
      ? this.inventoryService.getInventoryId(this.inventoryId)
      : of(null);

    // Combine all data loading
    forkJoin({
      students: students$,
      customer: customer$,
      inventory: inventory$
    }).subscribe({
      next: ({ students, customer, inventory }) => {
        // Process students data
        this.processStudentsData(students);
        
        // Process customer data
        this.processCustomerData(customer);
        
        // Process inventory data if in edit mode
        if (inventory) {
          this.processInventoryData(inventory);
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.students = [];
        this.detailsFieldsService.setStudentsOptions([]);
        this.detailsFields = this.detailsFieldsService.getFields();
      }
    });
  }

  private processStudentsData(resp: any): void {
    const page: GetUsersStudentsClientResult = resp;
    const items = (page?.data?.results || []) as any[];
    this.students = items
      .map((s: any) => ({
        label:
          s?.name ||
          s?.full_name ||
          (s?.first_name && s?.last_name ? `${s.first_name} ${s.last_name}` : undefined) ||
          (s?.firstname && s?.lastname ? `${s.firstname} ${s.lastname}` : undefined) ||
          s?.username ||
          s?.code ||
          s?.id,
        value: s?.id
      }))
      .filter((o) => !!o.value);
    
    // Update the field service with the loaded options
    this.detailsFieldsService.setStudentsOptions(this.students);
    this.detailsFields = this.detailsFieldsService.getFields();
  }

  private processCustomerData(resp: any): void {
    const c = resp?.data || resp;
    this.customerId = c?.id || null;
  }

  private processInventoryData(resp: any): void {
    const data = resp?.data || resp;
    if (!data) return;
    
    // Extract user ID from user object if it exists
    const userId = data.user?.id || data.user;
    
    this.model = {
      user: userId,
      title: data.title,
      billing_date: data.billing_date ? new Date(data.billing_date) : '',
      return_date: data.return_date ? new Date(data.return_date) : '',
      notes: data.notes || ''
    };
    
    // Now that students are loaded and field service is updated, patch the form
    this.form.patchValue(this.model);
    
    // Set up date constraints after patching initial values
    if (this.model.billing_date) {
      this.updateReturnDateMinDate(this.model.billing_date);
    }
  }


  submit() {
    if (!this.submissionGuard.canSubmit()) {
      return;
    }
    this.submissionGuard.startSubmission();

    if (!this.customerId) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('api_messages.error_title'),
        detail: this.translate.instant('inventory.errors.customer_missing') || 'Customer not available'
      });
      this.submissionGuard.endSubmission();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Check for date range validation error
      if (this.form.errors?.['dateRange']) {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: this.translate.instant('inventory.errors.date_range_invalid') || 'Billing date must be before return date'
        });
      } else {
        this.validationService.showValidationErrors(this.form, this.validationConfig);
      }
      
      this.submissionGuard.endSubmission();
      return;
    }

    const basePayload = {
      user: this.form.value.user,
      title: this.form.value.title,
      billing_date: this.form.value.billing_date ? new Date(this.form.value.billing_date).toISOString() : undefined,
      return_date: this.form.value.return_date ? new Date(this.form.value.return_date).toISOString() : undefined,
      notes: this.form.value.notes || undefined,
      customer: this.customerId,
      item_type: this.context.toUpperCase() as 'ASSET' | 'ELIBRARY'
    };

    // For edit mode, add the id field
    const editPayload = this.mode === 'edit' && this.inventoryId 
      ? { ...basePayload, id: this.inventoryId }
      : basePayload;


    const req$ =
      this.mode === 'edit' && this.inventoryId
        ? this.inventoryService.putInventoryId(this.inventoryId!, editPayload as unknown as PutInventoryIdBody)
        : this.inventoryService.postInventory(basePayload as PostInventoryBody);

    req$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('api_messages.success_title'),
          detail:
            this.mode === 'edit'
              ? this.translate.instant('inventory.messages.updated') || 'Updated'
              : this.translate.instant('inventory.messages.created') || 'Created'
        });
        this.saved.emit();
        this.router.navigate(this.returnTo);
        this.submissionGuard.endSubmission();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail:
            error?.error?.message ||
            (this.mode === 'edit'
              ? this.translate.instant('inventory.errors.update_failed')
              : this.translate.instant('inventory.errors.create_failed'))
        });
        this.submissionGuard.endSubmission();
      }
    });
  }

  onCancel() {
    this.router.navigate(this.returnTo);
  }
}
