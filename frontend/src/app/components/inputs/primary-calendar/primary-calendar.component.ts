import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-primary-calendar',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormlyModule, MessageModule, CalendarModule],
  templateUrl: './primary-calendar.component.html',
  styleUrl: './primary-calendar.component.scss'
})
export class PrimaryCalendarComponent extends FieldType<FieldTypeConfig> {
  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get placeholder() {
    const basePlaceholder = this.props['placeholder'] || '';
    return this.required && basePlaceholder ? `${basePlaceholder} *` : basePlaceholder;
  }

  get labelClass() {
    return this.props['labelClass'] || '';
  }

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || false;
  }

  get dateFormat() {
    return this.props['dateFormat'] || 'dd/mm/yy';
  }

  get showIcon() {
    return this.props['showIcon'] !== false; // Default to true
  }

  get showButtonBar() {
    return this.props['showButtonBar'] || false;
  }

  get showClear() {
    return this.props['showClear'] || false;
  }

  get minDate() {
    return this.props['minDate'] || null;
  }

  get maxDate() {
    return this.props['maxDate'] || null;
  }

  get selectionMode() {
    return this.props['selectionMode'] || 'single';
  }
} 