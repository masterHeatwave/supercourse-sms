import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { Customer } from '@gen-api/schemas/customer';

@Component({
  selector: 'app-edit-school-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, FormlyPrimeNGModule, DialogModule, ButtonModule, CardModule, OutlineButtonComponent],
  templateUrl: './edit-school-dialog.component.html',
  styleUrl: './edit-school-dialog.component.scss'
})
export class EditSchoolDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() schoolData: Customer | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() schoolUpdated = new EventEmitter<any>();

  form = new FormGroup({});
  model: any = {};
  fields: FormlyFieldConfig[] = [];
  loading = false;

  constructor() {
    this.initializeFields();
  }

  ngOnInit() {
    if (this.schoolData) {
      this.populateModel(this.schoolData);
    }
  }

  ngOnChanges() {
    if (this.schoolData && this.form) {
      this.populateModel(this.schoolData);
    }
  }

  private initializeFields(): void {
    this.fields = [
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            className: 'col-12',
            key: 'name',
            type: 'primary-input',
            props: {
              label: 'School Name',
              placeholder: 'Enter school name',
              required: true,
              labelClass: 'text-black-alpha-90'
            },
            validation: {
              messages: {
                required: 'School name is required'
              }
            }
          },
          {
            className: 'col-12',
            key: 'description',
            type: 'primary-textarea',
            props: {
              label: 'Description',
              placeholder: 'Enter school description',
              rows: 3,
              labelClass: 'text-black-alpha-90'
            }
          },
          {
            className: 'col-12 md:col-6',
            key: 'email',
            type: 'primary-input',
            props: {
              label: 'Email',
              placeholder: 'Enter email address',
              type: 'email',
              labelClass: 'text-black-alpha-90'
            },
            validators: {
              email: {
                expression: (c: any) => !c.value || /\S+@\S+\.\S+/.test(c.value),
                message: 'Please enter a valid email address'
              }
            }
          },
          {
            className: 'col-12 md:col-6',
            key: 'phone',
            type: 'primary-input',
            props: {
              label: 'Phone',
              placeholder: 'Enter phone number',
              labelClass: 'text-black-alpha-90'
            }
          },
          {
            className: 'col-12 md:col-6',
            key: 'website',
            type: 'primary-input',
            props: {
              label: 'Website',
              placeholder: 'Enter website URL',
              labelClass: 'text-black-alpha-90'
            }
          },
          {
            className: 'col-12 md:col-6',
            key: 'avatar',
            type: 'primary-input',
            props: {
              label: 'Logo URL',
              placeholder: 'Enter logo image URL',
              labelClass: 'text-black-alpha-90'
            }
          },
          {
            className: 'col-12',
            key: 'address',
            type: 'primary-textarea',
            props: {
              label: 'Address',
              placeholder: 'Enter school address',
              rows: 2,
              labelClass: 'text-black-alpha-90'
            }
          }
        ]
      }
    ];
  }

  private populateModel(schoolData: Customer): void {
    this.model = {
      name: schoolData.name || '',
      description: schoolData.description || '',
      email: schoolData.email || '',
      phone: schoolData.phone || '',
      address: schoolData.address || '',
      website: schoolData.website || '',
      avatar: schoolData.avatar || ''
    };
  }

  onSave(): void {
    if (this.form.valid) {
      this.loading = true;

      // Remove empty string values to avoid updating with empty strings
      const updateData = Object.keys(this.model).reduce((acc, key) => {
        const value = this.model[key];
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      this.schoolUpdated.emit(updateData);
    }
  }

  onCancel(): void {
    this.hideDialog();
  }

  onDialogHide(): void {
    // This is called when the dialog is closed by any means (X button, ESC key, etc.)
    this.hideDialog();
  }

  onVisibilityChange(visible: boolean): void {
    // This handles the two-way binding for visibility
    if (!visible) {
      this.hideDialog();
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.loading = false;
    // Reset form to original values
    if (this.schoolData) {
      this.populateModel(this.schoolData);
    }
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }
}
