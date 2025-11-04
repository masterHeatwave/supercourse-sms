import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MessageModule } from 'primeng/message';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-primary-textarea',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FormsModule, FormlyModule, MessageModule, InputTextareaModule],
  templateUrl: './primary-textarea.component.html',
  styleUrl: './primary-textarea.component.scss'
})
export class PrimaryTextareaComponent extends FieldType<FieldTypeConfig> {
  // Standalone usage (outside Formly)
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  // Standalone appearance/behavior inputs
  @Input() standaloneLabel: string | undefined;
  @Input() standaloneLabelClass: string | undefined;
  @Input() standaloneStyleClass: string | undefined;
  @Input() standalonePlaceholder: string | undefined;
  @Input() standaloneRows: number | undefined;
  @Input() standaloneAutoResize: boolean | undefined;
  @Input() standaloneDisabled: boolean | undefined;

  get label() {
    return (this.props && this.props['label']) ?? this.standaloneLabel ?? '';
  }

  get styleClass() {
    return (this.props && this.props['styleClass']) ?? this.standaloneStyleClass ?? '';
  }

  get placeholder() {
    const basePlaceholder = (this.props && this.props['placeholder']) ?? this.standalonePlaceholder ?? '';
    return this.required && basePlaceholder ? `${basePlaceholder} *` : basePlaceholder;
  }

  get labelClass() {
    return (this.props && this.props['labelClass']) ?? this.standaloneLabelClass ?? '';
  }

  get defaultValue() {
    return (this.props && this.props['defaultValue']) ?? '';
  }

  get required() {
    return (this.props && (this.props['required'] as boolean)) || false;
  }

  get isDisabled() {
    return (this.props && (this.props['isDisabled'] as boolean)) ?? this.standaloneDisabled ?? false;
  }

  get rows() {
    const propsRows = this.props ? (this.props['rows'] as number | undefined) : undefined;
    return propsRows ?? this.standaloneRows ?? 4;
  }

  get autoResize() {
    const propsAuto = this.props ? (this.props['autoResize'] as boolean | undefined) : undefined;
    return propsAuto ?? this.standaloneAutoResize ?? false;
  }
} 