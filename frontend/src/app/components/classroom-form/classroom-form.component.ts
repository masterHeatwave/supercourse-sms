import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ButtonModule } from 'primeng/button';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { CustomerService } from '@services/customer.service';
import { MessageService } from 'primeng/api';
import { ExtendedClassroom } from '@gen-api/schemas/extendedClassroom';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { createClassroomFields, ClassroomFormData } from './fields';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-classroom-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ButtonModule,
    OutlineButtonComponent
  ],
  providers: [MessageService],
  templateUrl: './classroom-form.component.html',
  styleUrls: ['./classroom-form.component.scss']
})
export class ClassroomFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() classroomData: ExtendedClassroom | null = null;
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() formCancelled = new EventEmitter<void>();
   @Output() branchesLoaded = new EventEmitter<{ label: string; value: string }[]>();

  form = new FormGroup({});
  model: ClassroomFormData = {
    name: '',
    customer: '',
    location: '',
    capacity: undefined,
    type: '',
    equipment: [],
    availability: 'available',
    description: ''
  };
  fields: FormlyFieldConfig[] = [];
  options: FormlyFormOptions = {};
  isSubmitting = false;
  branches: { label: string; value: string }[] = [];

  private classroomsService = inject(ClassroomsService);
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    this.initializeFields();
    this.loadBranches();
  }

  updateCustomerFieldOptions(): void {
    // Recreate fields with updated branches
    this.fields = createClassroomFields(this.branches);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['classroomData'] && this.classroomData) {
      this.tryPopulateForm();
    }
  }

  loadBranches(): void {
    this.customerService.getCurrentUserCustomers().subscribe({
      next: (customers) => {
        // Filter out main customers (is_main_customer = true)
        const filteredCustomers = customers.filter(customer => !customer.is_main_customer);
        
        this.branches = filteredCustomers.map((customer) => ({
          label: customer.name,
          value: customer.id
        }));
        
        // Emit branches to parent component
        this.branchesLoaded.emit(this.branches);
        
        // Update the customer field options after branches are loaded
        this.updateCustomerFieldOptions();
        this.tryPopulateForm();
      },
      error: (error) => {
        console.error('Error loading branches:', error);
        this.initializeFields();
      }
    });
  }

  initializeFields(): void {
    this.fields = createClassroomFields(this.branches);
  }

  tryPopulateForm(): void {
    if (this.isEditMode && this.classroomData && this.branches.length > 0) {
      // Use setTimeout to ensure the form is fully initialized
      this.populateForm(this.classroomData!);

    }
  }

  populateForm(classroom: ExtendedClassroom): void {
    let customerId = '';
    if (classroom.customer) {
      if (typeof classroom.customer === 'string') {
        customerId = classroom.customer;
      } else if (classroom.customer.id) {
        customerId = classroom.customer.id;
      }
    }

    let availabilityStatus = 'available';
    if (classroom.availability) {
      if (typeof classroom.availability === 'string') {
        availabilityStatus = classroom.availability;
      }
    }

    this.model = {
      name: classroom.name || '',
      customer: customerId,
      location: classroom.location || '',
      capacity: classroom.capacity || undefined,
      type: classroom.type || '',
      equipment: classroom.equipment || [],
      availability: availabilityStatus,
      description: classroom.description || ''
    };
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      const formData = this.model;

      if (this.isEditMode && this.classroomData) {
        this.updateClassroom(formData);
      } else {
        this.createClassroom(formData);
      }
    } else {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  createClassroom(formData: ClassroomFormData): void {
    const apiData = {
      name: formData.name,
      customer: formData.customer,
      location: formData.location,
      capacity: formData.capacity,
      type: formData.type as any,
      description: formData.description,
      equipment: formData.equipment || [],
      availability: formData.availability as any || 'available'
    };


    this.classroomsService.postClassrooms(apiData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Classroom created successfully'
        });
        this.formSubmitted.emit(response);
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating classroom:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to create classroom'
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  updateClassroom(formData: ClassroomFormData): void {
    if (!this.classroomData?.id) {
      console.error('No classroom ID for update');
      return;
    }

    const updateData = {
      id: this.classroomData.id,
      name: formData.name,
      customer: formData.customer,
      location: formData.location,
      capacity: formData.capacity,
      type: formData.type as any,
      description: formData.description,
      equipment: formData.equipment || [],
      availability: formData.availability as any || 'available'
    };

    this.classroomsService.putClassroomsId(this.classroomData.id, updateData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Classroom updated successfully'
        });
        this.formSubmitted.emit(response);
      },
      error: (error) => {
        console.error('Error updating classroom:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to update classroom'
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  resetForm(): void {
    this.model = {
      name: '',
      customer: '',
      location: '',
      capacity: undefined,
      type: '',
      equipment: [],
      availability: 'available',
      description: ''
    };
    this.form.reset();
  }
}
