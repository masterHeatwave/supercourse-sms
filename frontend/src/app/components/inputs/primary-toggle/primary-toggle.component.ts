import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { InputSwitchModule } from 'primeng/inputswitch';

@Component({
  selector: 'app-primary-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormlyModule, MessageModule, InputSwitchModule],
  templateUrl: './primary-toggle.component.html',
  styleUrls: ['./primary-toggle.component.scss']
})
export class PrimaryToggleComponent extends FieldType<FieldTypeConfig> {
  constructor(private cdr: ChangeDetectorRef) {
    super();
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

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || false;
  }

  get name() {
    return this.props['name'] || '';
  }
  
  ngOnInit() {
    if (this.props['disabled']) {
      this.formControl.disable();
    }
    
    if (this.props['defaultValue'] !== undefined && this.formControl.value === null) {
      this.formControl.setValue(this.props['defaultValue']);
      this.cdr.markForCheck();
    }
  }
  
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
