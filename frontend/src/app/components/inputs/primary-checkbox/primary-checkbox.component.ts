import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-primary-input',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormlyModule, MessageModule, CheckboxModule],
  templateUrl: './primary-checkbox.component.html',
  styleUrls: ['./primary-checkbox.component.scss']
})
export class PrimaryCheckboxComponent extends FieldType<FieldTypeConfig> {
  get type() {
    return this.props['inputType'] || 'text';
  }

  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get labelClass() {
    return this.props['labelClass'] || '';
  }

  get defaultValue() {
    return this.props['defaultValue'] || '';
  }

  get name() {
    return this.props['name'] || '';
  }
}
