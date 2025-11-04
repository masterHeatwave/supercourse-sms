import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-primary-input',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormlyModule, MessageModule, InputTextModule],
  templateUrl: './primary-input.component.html',
  styleUrls: ['./primary-input.component.scss']
})
export class PrimaryInputComponent extends FieldType<FieldTypeConfig> {
  get type() {
    return this.props['inputType'] || 'text';
  }

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
    const basePlaceholder = this.props['placeholder'] || '';
    return this.required && basePlaceholder ? `${basePlaceholder} *` : basePlaceholder;
  }

  get labelClass() {
    return this.props['labelClass'] || '';
  }

  get defaultValue() {
    return this.props['defaultValue'] || '';
  }

  get required() {
    return this.props['required'] || '';
  }

  get isDisabled() {
    return this.props['isDisabled'] || this.props['disabled'] || this.formControl?.disabled || false;
  }

  showPassword: boolean = false;

  togglePasswordVisibility() {
    if (this.type === 'password') {
      this.showPassword = !this.showPassword;
    }
  }
}
