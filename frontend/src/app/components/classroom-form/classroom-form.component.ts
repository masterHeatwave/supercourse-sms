import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { CustomerService } from '@services/customer.service';
import { MessageService } from 'primeng/api';
import { Classroom } from '@gen-api/schemas';
import { ExtendedClassroom } from '@gen-api/schemas/extendedClassroom';

@Component({
  selector: 'app-classroom-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    MultiSelectModule,
    CardModule
  ],
  template: `
    <div class="classroom-form">
      <div class="form-container">
        <form [formGroup]="classroomForm" (ngSubmit)="onSubmit()">
          <div class="grid p-fluid">
            <div class="col-12 md:col-6">
              <label for="name" class="block text-900 font-medium mb-2">Classroom Name *</label>
              <input
                id="name"
                type="text"
                pInputText
                formControlName="name"
                placeholder="Enter classroom name"
                class="w-full"
                [class.ng-invalid]="classroomForm.get('name')?.invalid && classroomForm.get('name')?.touched"
              />
              <small class="p-error block" *ngIf="classroomForm.get('name')?.invalid && classroomForm.get('name')?.touched">
                Classroom name is required
              </small>
            </div>

            <div class="col-12 md:col-6">
              <label for="customer" class="block text-900 font-medium mb-2">Branch *</label>
              <p-dropdown
                id="customer"
                formControlName="customer"
                [options]="branches"
                optionLabel="label"
                optionValue="value"
                placeholder="Select branch"
                styleClass="w-full"
                [class.ng-invalid]="classroomForm.get('customer')?.invalid && classroomForm.get('customer')?.touched"
              ></p-dropdown>
              <small class="p-error block" *ngIf="classroomForm.get('customer')?.invalid && classroomForm.get('customer')?.touched">
                Please select a branch
              </small>
            </div>

            <div class="col-12 md:col-6">
              <label for="location" class="block text-900 font-medium mb-2">Location</label>
              <input
                id="location"
                type="text"
                pInputText
                formControlName="location"
                placeholder="Enter location (e.g., Building A, Floor 2)"
                class="w-full"
              />
            </div>

            <div class="col-12 md:col-6">
              <label for="capacity" class="block text-900 font-medium mb-2">Capacity</label>
              <p-inputNumber
                id="capacity"
                formControlName="capacity"
                [showButtons]="true"
                [min]="1"
                [max]="500"
                placeholder="Max students"
                styleClass="w-full"
              ></p-inputNumber>
            </div>

            <div class="col-12 md:col-6">
              <label for="type" class="block text-900 font-medium mb-2">Type</label>
              <p-dropdown
                id="type"
                formControlName="type"
                [options]="classroomTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                styleClass="w-full"
              ></p-dropdown>
            </div>

            <div class="col-12 md:col-6">
              <label for="equipment" class="block text-900 font-medium mb-2">Equipment</label>
              <p-multiSelect
                id="equipment"
                formControlName="equipment"
                [options]="equipmentOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select equipment"
                styleClass="w-full"
                [filter]="true"
                filterPlaceholder="Search equipment..."
              ></p-multiSelect>
            </div>

            <div class="col-12 md:col-6">
              <label for="availability" class="block text-900 font-medium mb-2">Availability</label>
              <p-dropdown
                id="availability"
                formControlName="availability"
                [options]="availabilityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select availability status"
                styleClass="w-full"
              ></p-dropdown>
            </div>

            <div class="col-12">
              <label for="description" class="block text-900 font-medium mb-2">Description</label>
              <textarea
                id="description"
                pInputTextarea
                formControlName="description"
                placeholder="Additional details about the classroom"
                rows="3"
                class="w-full"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-content-end gap-2 mt-4">
            <button type="button" class="p-button p-button-text" (click)="onCancel()">Cancel</button>
            <button type="submit" class="p-button p-button-primary" [disabled]="classroomForm.invalid || isSubmitting">
              <i class="pi pi-spin pi-spinner mr-2" *ngIf="isSubmitting"></i>
              {{ isSubmitting ? 'Saving...' : isEditMode ? 'Update Classroom' : 'Create Classroom' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .classroom-form {
        max-width: 800px;
        margin: 0 auto;
      }

      .form-container {
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
      }

      .classroom-form ::ng-deep .p-inputtext,
      .classroom-form ::ng-deep .p-dropdown,
      .classroom-form ::ng-deep .p-multiselect,
      .classroom-form ::ng-deep .p-inputnumber input,
      .classroom-form ::ng-deep .p-inputtextarea {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.75rem;
        font-size: 0.875rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      }

      .classroom-form ::ng-deep .p-inputtext:focus,
      .classroom-form ::ng-deep .p-dropdown:not(.p-disabled):focus,
      .classroom-form ::ng-deep .p-multiselect:not(.p-disabled):focus,
      .classroom-form ::ng-deep .p-inputnumber input:focus,
      .classroom-form ::ng-deep .p-inputtextarea:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        outline: none;
      }

      .classroom-form ::ng-deep .p-dropdown {
        border: 1px solid #d1d5db;
      }

      .classroom-form ::ng-deep .p-multiselect {
        border: 1px solid #d1d5db;
      }

      .classroom-form ::ng-deep .p-dropdown:not(.p-disabled):hover,
      .classroom-form ::ng-deep .p-multiselect:not(.p-disabled):hover {
        border-color: #9ca3af;
      }

      .classroom-form ::ng-deep .p-dropdown.p-focus,
      .classroom-form ::ng-deep .p-multiselect.p-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .classroom-form ::ng-deep .p-inputnumber {
        border: none;
      }

      .classroom-form ::ng-deep .p-inputnumber .p-inputnumber-buttons-stacked .p-button {
        border-radius: 0;
      }

      .classroom-form ::ng-deep .p-inputnumber .p-inputnumber-buttons-stacked .p-button:first-child {
        border-top-right-radius: 6px;
      }

      .classroom-form ::ng-deep .p-inputnumber .p-inputnumber-buttons-stacked .p-button:last-child {
        border-bottom-right-radius: 6px;
      }

      .classroom-form ::ng-deep .p-inputtext.ng-invalid.ng-touched,
      .classroom-form ::ng-deep .p-dropdown.ng-invalid.ng-touched,
      .classroom-form ::ng-deep .p-multiselect.ng-invalid.ng-touched,
      .classroom-form ::ng-deep .p-inputnumber.ng-invalid.ng-touched input,
      .classroom-form ::ng-deep .p-inputtextarea.ng-invalid.ng-touched {
        border-color: #ef4444;
      }

      .classroom-form ::ng-deep .p-inputtext.ng-invalid.ng-touched:focus,
      .classroom-form ::ng-deep .p-dropdown.ng-invalid.ng-touched:focus,
      .classroom-form ::ng-deep .p-multiselect.ng-invalid.ng-touched:focus,
      .classroom-form ::ng-deep .p-inputnumber.ng-invalid.ng-touched input:focus,
      .classroom-form ::ng-deep .p-inputtextarea.ng-invalid.ng-touched:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }

      .classroom-form label {
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .classroom-form .p-error {
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }

      .classroom-form .grid > div {
        padding: 0.5rem;
      }
    `
  ]
})
export class ClassroomFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() classroomData: ExtendedClassroom | null = null;
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() formCancelled = new EventEmitter<void>();

  classroomForm: FormGroup;
  branches: any[] = [];
  isSubmitting = false;

  classroomTypes = [
    { label: 'Select Type', value: '' },
    { label: 'Standard', value: 'standard' },
    { label: 'Computer Lab', value: 'computer_lab' },
    { label: 'Science Lab', value: 'science_lab' },
    { label: 'Art Studio', value: 'art_studio' },
    { label: 'Music Room', value: 'music_room' },
    { label: 'Gymnasium', value: 'gymnasium' },
    { label: 'Library', value: 'library' },
    { label: 'Conference Room', value: 'conference_room' }
  ];

  availabilityOptions = [
    { label: 'Available', value: 'available' },
    { label: 'Unavailable', value: 'unavailable' },
    { label: 'Out of Order', value: 'out_of_order' },
    { label: 'Under Maintenance', value: 'under_maintenance' }
  ];

  equipmentOptions = [
    { label: 'Projector', value: 'projector' },
    { label: 'Smart Board', value: 'smart_board' },
    { label: 'Computer', value: 'computer' },
    { label: 'Laptop', value: 'laptop' },
    { label: 'Audio System', value: 'audio_system' },
    { label: 'Microphone', value: 'microphone' },
    { label: 'Speakers', value: 'speakers' },
    { label: 'TV/Monitor', value: 'tv_monitor' },
    { label: 'Document Camera', value: 'document_camera' },
    { label: 'Printer', value: 'printer' },
    { label: 'Scanner', value: 'scanner' },
    { label: 'Whiteboard', value: 'whiteboard' },
    { label: 'Blackboard', value: 'blackboard' },
    { label: 'Tables', value: 'tables' },
    { label: 'Chairs', value: 'chairs' },
    { label: 'Air Conditioning', value: 'air_conditioning' },
    { label: 'Heating', value: 'heating' },
    { label: 'Internet Access', value: 'internet_access' },
    { label: 'WiFi', value: 'wifi' },
    { label: 'Ethernet Ports', value: 'ethernet_ports' },
    { label: 'Power Outlets', value: 'power_outlets' },
    { label: 'Laboratory Equipment', value: 'lab_equipment' },
    { label: 'Musical Instruments', value: 'musical_instruments' },
    { label: 'Art Supplies', value: 'art_supplies' },
    { label: 'Sports Equipment', value: 'sports_equipment' }
  ];

  private fb = inject(FormBuilder);
  private classroomsService = inject(ClassroomsService);
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);

  constructor() {
    this.classroomForm = this.fb.group({
      name: ['', Validators.required],
      customer: ['', Validators.required],
      location: [''],
      capacity: [null],
      type: [''],
      equipment: [[]],
      availability: ['available'], // Default to available
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If classroomData changes and we have branches loaded, populate the form
    if (changes['classroomData'] && this.classroomData) {
      console.log('Classroom data changed:', this.classroomData);
      this.tryPopulateForm();
    }
  }

  loadBranches(): void {
    this.customerService.getCurrentUserCustomers().subscribe({
      next: (customers) => {
        this.branches = customers
          .filter((customer) => !customer.is_primary)
          .map((customer) => ({
            label: customer.name,
            value: customer.id
          }));
        console.log('Filtered branches:', this.branches);

        // Try to populate form now that branches are loaded
        this.tryPopulateForm();
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  tryPopulateForm(): void {
    // Only populate form if we have both branches loaded and classroom data
    if (this.isEditMode && this.classroomData && this.branches.length > 0) {
      console.log('Both branches and classroom data are ready, populating form');
      this.populateForm(this.classroomData);
    } else {
      console.log('Not ready to populate form yet', {
        isEditMode: this.isEditMode,
        hasClassroomData: !!this.classroomData,
        branchesLength: this.branches.length
      });
    }
  }

  populateForm(classroom: ExtendedClassroom): void {
    // Handle customer field - it might be a string ID or an object with id property
    let customerId = '';
    if (classroom.customer) {
      if (typeof classroom.customer === 'string') {
        customerId = classroom.customer;
      } else if (classroom.customer.id) {
        customerId = classroom.customer.id;
      }
    }

    // Handle availability - it should now be a string enum
    let availabilityStatus = 'available'; // Default
    if (classroom.availability) {
      if (typeof classroom.availability === 'string') {
        availabilityStatus = classroom.availability;
      } else if (Array.isArray(classroom.availability)) {
        // Convert from old array format to new enum format (backward compatibility)
        // If array has items, consider it available, otherwise unavailable
        availabilityStatus = (classroom.availability as any).length > 0 ? 'available' : 'unavailable';
      }
    }

    console.log('Populating form with classroom data:', classroom);
    console.log('Customer ID extracted:', customerId);
    console.log('Availability status:', availabilityStatus);

    this.classroomForm.patchValue({
      name: classroom.name || '',
      customer: customerId,
      location: classroom.location || '',
      capacity: classroom.capacity || null,
      type: classroom.type || '',
      equipment: classroom.equipment || [],
      availability: availabilityStatus,
      description: classroom.description || ''
    });

    console.log('Form values after patch:', this.classroomForm.value);
  }

  onSubmit(): void {
    if (this.classroomForm.valid) {
      this.isSubmitting = true;
      const formData = this.classroomForm.value;

      if (this.isEditMode && this.classroomData) {
        this.updateClassroom(formData);
      } else {
        this.createClassroom(formData);
      }
    } else {
      this.markFormGroupTouched(this.classroomForm);
    }
  }

  createClassroom(formData: any): void {
    // Now all fields are supported by the API
    const apiData = {
      name: formData.name,
      customer: formData.customer,
      location: formData.location,
      capacity: formData.capacity,
      type: formData.type,
      description: formData.description,
      equipment: formData.equipment || [],
      availability: formData.availability || 'available'
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
          detail: 'Failed to create classroom'
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  updateClassroom(formData: any): void {
    if (!this.classroomData?.id) {
      console.error('No classroom ID for update');
      return;
    }

    // Now all fields are supported by the API
    const updateData = {
      id: this.classroomData.id,
      name: formData.name,
      customer: formData.customer,
      location: formData.location,
      capacity: formData.capacity,
      type: formData.type,
      description: formData.description,
      equipment: formData.equipment || [],
      availability: formData.availability || 'available'
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
          detail: 'Failed to update classroom'
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
    this.classroomForm.reset();
    this.classroomForm.patchValue({
      name: '',
      customer: '',
      location: '',
      capacity: null,
      type: '',
      equipment: [],
      availability: 'available',
      description: ''
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
