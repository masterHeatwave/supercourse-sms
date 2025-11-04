import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-primary-multi-select',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    ReactiveFormsModule,
    FormlyModule, 
    MultiSelectModule,
    MessageModule
  ],
  templateUrl: './primary-multi-select.component.html',
  styleUrls: ['./primary-multi-select.component.scss']
})
export class PrimaryMultiSelectComponent extends FieldType<FieldTypeConfig> {
  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get placeholder() {
    return this.props['placeholder'] || '';
  }

  get selectOptions() {
    return this.props['selectOptions'] || [];
  }

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || false;
  }

  get errorMessage(): string {
    const firstErrorKey = Object.keys(this.formControl.errors || {})[0];
    const getError = this.formControl.errors?.[firstErrorKey];
    return getError?.message || `validation.${firstErrorKey}`;
  }
} 