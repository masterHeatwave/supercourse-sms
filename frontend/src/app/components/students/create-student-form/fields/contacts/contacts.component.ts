import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { PrimaryInputComponent } from '@components/inputs/primary-input/primary-input.component';
import { PrimaryToggleComponent } from '@components/inputs/primary-toggle/primary-toggle.component';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UsersService } from '@gen-api/users/users.service';
import { User } from '@gen-api/schemas';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { calculateAge, isMinor } from '../../../../../utils/age-calculation.util';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    CheckboxModule,
    InputSwitchModule,
    PrimaryInputComponent,
    PrimaryToggleComponent,
    PrimaryDropdownComponent
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() contacts: any[] = [];
  @Input() isEditMode: boolean = false;
  @Input() siblingAttending: string[] = [];
  @Input() dateOfBirth?: string | Date; // Birthdate to calculate age
  @Output() contactsChange = new EventEmitter<any[]>();
  @Output() siblingAttendingChange = new EventEmitter<string[]>();

  contactsForm: FormGroup;
  siblingAttendingControl = new FormControl<string[]>([]);
  relationships = [
    { label: 'Parent & Guardian', value: 'parent_guardian' },
    { label: 'Caretaker', value: 'caretaker' },
  ];

  defaultRelationshipValue = '';

  students: any[] = [];
  loadingStudents = false;
  currentCustomerId: string | null | undefined;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private usersService: UsersService, private store: Store<AppState>) {
    this.contactsForm = this.fb.group({
      contacts: this.fb.array([])
    });
  }

  ngOnInit() {
    // Initialize contacts based on age requirement
    const minor = isMinor(this.dateOfBirth);
    
    if (this.contacts && this.contacts.length > 0) {
      this.contacts.forEach(contact => {
        this.addContact(contact);
      });
    } else {
      // For minors, always add at least one contact
      if (minor) {
        this.addContact();
      }
    }
    
    // Set up age-based validation
    this.setupAgeBasedValidation();

    // Initialize sibling attending value
    this.siblingAttendingControl.setValue(this.siblingAttending);

    // Apply primary contact logic after initialization
    setTimeout(() => {
      this.managePrimaryContacts();
    }, 0);

    // Add debouncing to prevent multiple rapid emissions for contacts
    const valueChangesSubscription = this.contactsForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        const contactsData = this.getContactsData();
        this.contactsChange.emit(contactsData);
      });
    
    this.subscriptions.add(valueChangesSubscription);

    // Add subscription for sibling attending changes
    const siblingSubscription = this.siblingAttendingControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.siblingAttendingChange.emit(value || []);
      });
    
    this.subscriptions.add(siblingSubscription);

    // Subscribe to auth state to get current branch/customer ID
    const authSubscription = this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      // Fetch students for the dropdown when we have the branch ID
      if (this.currentCustomerId) {
        this.fetchStudents();
      }
    });
    
    this.subscriptions.add(authSubscription);
  }

  ngOnChanges(changes: SimpleChanges) {
    // If dateOfBirth changes, update validation
    if (changes['dateOfBirth'] && !changes['dateOfBirth'].firstChange) {
      this.setupAgeBasedValidation();
      
      // If student becomes a minor and has no contacts, add one
      const minor = isMinor(this.dateOfBirth);
      if (minor && this.contactsArray.length === 0) {
        this.addContact();
      }
      
      // If student becomes an adult and has empty contacts, allow removal
      if (!minor && this.contactsArray.length > 0) {
        // Remove required validators from all contacts for adults
        this.contactsArray.controls.forEach(control => {
          const formGroup = control as FormGroup;
          const hasAnyValue = !!(
            formGroup.get('contactName')?.value?.trim() || 
            formGroup.get('contactPhone')?.value?.trim() || 
            formGroup.get('contactEmail')?.value?.trim()
          );
          
          // Only update validation if contact is empty (for adults, empty contacts don't need to be required)
          if (!hasAnyValue) {
            formGroup.get('contactName')?.setValidators([]);
            formGroup.get('contactPhone')?.setValidators([Validators.pattern('^[0-9-+() ]*$')]);
            formGroup.get('contactEmail')?.setValidators([Validators.email]);
            formGroup.get('relationship')?.setValidators([]);
            
            formGroup.get('contactName')?.updateValueAndValidity({ emitEvent: false });
            formGroup.get('contactPhone')?.updateValueAndValidity({ emitEvent: false });
            formGroup.get('contactEmail')?.updateValueAndValidity({ emitEvent: false });
            formGroup.get('relationship')?.updateValueAndValidity({ emitEvent: false });
          }
        });
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  get contactsArray() {
    return this.contactsForm.get('contacts') as FormArray;
  }

  createContactForm(contact: any = {}) {
    const minor = isMinor(this.dateOfBirth);
    const hasContactData = !!(contact.name || contact.phone || contact.email);
    const isFirstContact = this.contactsArray.length === 0;
    
    // For minors, first contact is always required. For adults, only required if contact data exists
    const shouldBeRequired = (minor && isFirstContact) || hasContactData;
    
    const contactForm = this.fb.group({
      contactName: [contact.name || '', shouldBeRequired ? Validators.required : null],
      contactPhone: [contact.phone || '', shouldBeRequired ? [Validators.required, Validators.pattern('^[0-9-+() ]*$')] : [Validators.pattern('^[0-9-+() ]*$')]],
      contactEmail: [contact.email || '', shouldBeRequired ? [Validators.required, Validators.email] : [Validators.email]],
      relationship: [contact.relationship ?? this.defaultRelationshipValue, shouldBeRequired ? Validators.required : null],
      isPrimaryContact: [contact.isPrimaryContact || false]
    });

    // Add conditional validation - if any field has a value, make all fields required
    // This will override the initial validators for adults when they start typing
    this.setupConditionalValidation(contactForm);
    
    return contactForm;
  }
  
  // Expose utility functions for template use
  calculateAge = calculateAge;
  isMinor = isMinor;
  
  setupAgeBasedValidation() {
    const minor = isMinor(this.dateOfBirth);
    
    if (minor) {
      // For minors, ensure at least one contact exists and is valid
      if (this.contactsArray.length === 0) {
        this.addContact();
      }
      
      // Make the first contact required for minors
      this.contactsArray.controls.forEach((control, index) => {
        if (index === 0) {
          const formGroup = control as FormGroup;
          formGroup.get('contactName')?.setValidators([Validators.required]);
          formGroup.get('contactPhone')?.setValidators([Validators.required, Validators.pattern('^[0-9-+() ]*$')]);
          formGroup.get('contactEmail')?.setValidators([Validators.required, Validators.email]);
          formGroup.get('relationship')?.setValidators([Validators.required]);
          
          formGroup.get('contactName')?.updateValueAndValidity({ emitEvent: false });
          formGroup.get('contactPhone')?.updateValueAndValidity({ emitEvent: false });
          formGroup.get('contactEmail')?.updateValueAndValidity({ emitEvent: false });
          formGroup.get('relationship')?.updateValueAndValidity({ emitEvent: false });
        }
      });
    }
  }

  setupConditionalValidation(contactForm: FormGroup) {
    const fieldsToWatch = ['contactName', 'contactPhone', 'contactEmail'];
    
    // Listen to value changes on name, phone, and email fields with debouncing
    fieldsToWatch.forEach(fieldName => {
      const fieldSubscription = contactForm.get(fieldName)?.valueChanges
        .pipe(
          debounceTime(200),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.updateValidationBasedOnContent(contactForm);
        });
      
      if (fieldSubscription) {
        this.subscriptions.add(fieldSubscription);
      }
    });
    
    // Initial validation check in case we're editing existing data
    this.updateValidationBasedOnContent(contactForm);
  }

  updateValidationBasedOnContent(contactForm: FormGroup) {
    const nameControl = contactForm.get('contactName');
    const phoneControl = contactForm.get('contactPhone');
    const emailControl = contactForm.get('contactEmail');
    const relationshipControl = contactForm.get('relationship');

    const hasAnyValue = !!(
      nameControl?.value?.trim() || 
      phoneControl?.value?.trim() || 
      emailControl?.value?.trim()
    );

    const minor = isMinor(this.dateOfBirth);
    const isFirstContact = this.contactsArray.controls.indexOf(contactForm) === 0;

    // For minors, first contact is always required (even if empty)
    // For adults, only required if any field has a value
    const shouldBeRequired = (minor && isFirstContact) || hasAnyValue;

    if (shouldBeRequired) {
      // Add required validators
      nameControl?.setValidators([Validators.required]);
      phoneControl?.setValidators([Validators.required, Validators.pattern('^[0-9-+() ]*$')]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      relationshipControl?.setValidators([Validators.required]);
    } else {
      // Remove required validators, keep format validators (only for adults with empty fields)
      nameControl?.setValidators([]);
      phoneControl?.setValidators([Validators.pattern('^[0-9-+() ]*$')]);
      emailControl?.setValidators([Validators.email]);
      relationshipControl?.setValidators([]);
    }

    // Update validity
    nameControl?.updateValueAndValidity({ emitEvent: false });
    phoneControl?.updateValueAndValidity({ emitEvent: false });
    emailControl?.updateValueAndValidity({ emitEvent: false });
    relationshipControl?.updateValueAndValidity({ emitEvent: false });
  }

  handlePrimaryContactChange(index: number, isPrimary: boolean) {
    if (isPrimary) {
      // Uncheck all other contacts
      this.contactsArray.controls.forEach((control, i) => {
        if (i !== index) {
          control.get('isPrimaryContact')?.setValue(false);
        }
      });
    } else {
      // If unchecking and this is the only contact, keep it as primary
      if (this.contactsArray.length === 1) {
        this.contactsArray.at(index).get('isPrimaryContact')?.setValue(true);
      }
    }
  }

  addContact(contact: any = {}) {
    const contactForm = this.createContactForm(contact);
    this.contactsArray.push(contactForm);
    
    // Auto-manage primary contact logic
    this.managePrimaryContacts();
  }

  removeContact(index: number) {
    const minor = isMinor(this.dateOfBirth);
    
    // For minors, prevent removing the last contact
    if (minor && this.contactsArray.length === 1) {
      // Cannot remove the last contact for minors - just clear it instead
      const contactForm = this.contactsArray.at(index);
      contactForm.patchValue({
        contactName: '',
        contactPhone: '',
        contactEmail: '',
          relationship: this.defaultRelationshipValue,
        isPrimaryContact: true // Single contact must be primary
      });
      return;
    }
    
    // For adults or if more than one contact, allow removal
    if (this.contactsArray.length > 1) {
      this.contactsArray.removeAt(index);
      // Auto-manage primary contact logic after removal
      this.managePrimaryContacts();
    } else {
      // For adults with only one contact, allow clearing
      const contactForm = this.contactsArray.at(index);
      contactForm.patchValue({
        contactName: '',
        contactPhone: '',
        contactEmail: '',
          relationship: this.defaultRelationshipValue,
        isPrimaryContact: true // Single contact must be primary
      });
    }
  }

  managePrimaryContacts() {
    const contacts = this.contactsArray.controls;
    
    if (contacts.length === 1) {
      // Single contact must be primary
      contacts[0].get('isPrimaryContact')?.setValue(true);
    } else if (contacts.length > 1) {
      // Check if any contact is primary
      const primaryCount = contacts.filter(contact => 
        contact.get('isPrimaryContact')?.value === true
      ).length;
      
      // If no primary contact exists, make the first one primary
      if (primaryCount === 0) {
        contacts[0].get('isPrimaryContact')?.setValue(true);
      }
    }
  }

  // Method to trigger validation from parent component
  markAllContactsAsTouched() {
    this.contactsArray.controls.forEach(control => {
      const formGroup = control as FormGroup;
      Object.values(formGroup.controls).forEach(field => {
        field.markAsTouched();
      });
    });
  }

  // Method to check if there are validation errors in contacts
  hasValidationErrors(): boolean {
    const minor = isMinor(this.dateOfBirth);
    
    // For minors, at least one complete contact is required
    if (minor) {
      if (this.contactsArray.length === 0) {
        return true; // No contacts for minor
      }
      
      // Check if at least one contact is valid and complete
      const hasValidContact = this.contactsArray.controls.some(control => {
        const name = control.get('contactName')?.value?.trim();
        const phone = control.get('contactPhone')?.value?.trim();
        const email = control.get('contactEmail')?.value?.trim();
        const relationship = control.get('relationship')?.value;
        
        return !!(name && phone && email && relationship) && control.valid;
      });
      
      if (!hasValidContact) {
        return true; // No valid contact for minor
      }
    }
    
    // For adults, check if any partially filled contact is invalid
    return this.contactsArray.controls.some(control => {
      const hasAnyValue = !!(
        control.get('contactName')?.value?.trim() || 
        control.get('contactPhone')?.value?.trim() || 
        control.get('contactEmail')?.value?.trim()
      );
      
      if (hasAnyValue) {
        return control.invalid;
      }
      return false;
    });
  }

  getContactsData() {
    return this.contactsArray.controls.map(control => {
      return {
        name: control.get('contactName')?.value,
        phone: control.get('contactPhone')?.value,
        email: control.get('contactEmail')?.value,
        relationship: control.get('relationship')?.value,
        isPrimaryContact: control.get('isPrimaryContact')?.value
      };
    }).filter(contact => 
      contact.name && 
      contact.phone && 
      contact.email && 
      contact.relationship
    );
  }

  fetchStudents() {
    this.loadingStudents = true;
    
    const params: { [key: string]: string } = {
      archived: 'false',
      branch: this.currentCustomerId || ''
    };
    
    this.usersService.getUsersStudents(params).subscribe({
      next: (response) => {
        this.students = (response.data?.results || []).map((student: User) => ({
          ...student,
          name: `${student.firstname || ''} ${student.lastname || ''}`.trim()
        }));
        this.loadingStudents = false;
      },
      error: (error) => {
        this.students = [];
        this.loadingStudents = false;
      }
    });
  }
} 