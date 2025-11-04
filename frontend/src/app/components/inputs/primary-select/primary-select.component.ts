import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-primary-select',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormlyModule, DropdownModule, MessageModule, MultiSelectModule],
  templateUrl: './primary-select.component.html',
  styleUrls: ['./primary-select.component.scss']
})
export class PrimarySelectComponent extends FieldType<FieldTypeConfig> implements OnInit {
  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get isSearch() {
    return this.props['isSearch'] || false;
  }

  get placeholder() {
    return this.props['placeholder'] || '';
  }

  get selectOptions() {
    return this.props['selectOptions'] || [];
  }

  get labelClass() {
    return this.props['labelClass'] || '';
  }

  get multiple() {
    return this.props['multiple'] || false;
  }

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || this.props['isDisabled'] || this.formControl?.disabled || false;
  }

  ngOnInit(): void {
    // Ensure placeholder is selected by default when no value provided
    // Formly may initialize controls with undefined; our placeholder option uses null
    const currentValue = this.formControl?.value;
    if (!this.multiple && (currentValue === undefined || currentValue === '')) {
      this.formControl.setValue(null, { emitEvent: false });
    }
  }
}
