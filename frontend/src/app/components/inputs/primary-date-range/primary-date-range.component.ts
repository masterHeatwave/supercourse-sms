import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-primary-date-range',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormsModule, FormlyModule, MessageModule, CalendarModule],
  templateUrl: './primary-date-range.component.html',
  styleUrl: './primary-date-range.component.scss'
})
export class PrimaryDateRangeComponent extends FieldType<FieldTypeConfig> {
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
    return this.props['required'] || '';
  }

  get isDisabled() {
    return this.props['isDisabled'] || false;
  }

  get startDateLabel() {
    return this.props['startDateLabel'] || 'Start date:';
  }

  get endDateLabel() {
    return this.props['endDateLabel'] || 'End date:';
  }

  get showTimeline() {
    return this.props['showTimeline'] || false;
  }

  get startDate() {
    return this.formControl.value?.startDate || null;
  }

  get endDate() {
    return this.formControl.value?.endDate || null;
  }

  onStartDateChange(date: Date) {
    const currentValue = this.formControl.value || {};
    this.formControl.setValue({
      ...currentValue,
      startDate: date
    });
  }

  onEndDateChange(date: Date) {
    const currentValue = this.formControl.value || {};
    this.formControl.setValue({
      ...currentValue,
      endDate: date
    });
  }
}
