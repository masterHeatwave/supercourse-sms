import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { ColorPicker, ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-primay-color-select',
  standalone: true,
  imports: [ CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, FormlyModule, ColorPickerModule ],
  templateUrl: './primay-color-select.component.html',
  styleUrl: './primay-color-select.component.scss'
})
export class PrimayColorSelectComponent extends FieldType<FieldTypeConfig> implements AfterViewInit {
  @ViewChild('picker') picker?: ColorPicker;

  ngAfterViewInit() {
    // Ensure picker is initialized
  }

  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || false;
  }

  get defaultColor() {
    return this.props['defaultColor'] || 'ffffff';
  }

  // PrimeNG color picker expects hex without '#'
  get pickerValue(): string {
    const value: string = this.formControl?.value || '';
    if (!value) return this.defaultColor;
    return value.startsWith('#') ? value.slice(1) : value;
  }

  onPickerChange(value: string) {
    if (this.disabled) return;
    const withHash = value ? (value.startsWith('#') ? value : `#${value}`) : '';
    this.formControl.setValue(withHash);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  get selectedColor(): string {
    return this.formControl?.value || `#${this.defaultColor}`;
  }

  get invalid(): boolean {
    return (this.formControl?.invalid && this.formControl?.touched) || false;
  }

  onNativeColorChange(event: Event) {
    if (this.disabled || this.formControl.disabled) return;
    
    const input = event.target as HTMLInputElement;
    const color = input.value; // This is already in #RRGGBB format
    
    this.formControl.setValue(color);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  openPicker(event: Event) {
    if (this.disabled || this.formControl.disabled) return;
    
    event.stopPropagation();
    
    if (this.picker) {
      
      // Try to access the show method directly
      if (typeof (this.picker as any).show === 'function') {
        (this.picker as any).show();
      } else {
        // Fallback: try to click the hidden button
        setTimeout(() => {
          const pickerEl = (this.picker as any).el?.nativeElement;
          if (pickerEl) {
            const button = pickerEl.querySelector('.p-colorpicker-preview') || pickerEl.querySelector('button');
            if (button) {
              button.click();
            }
          }
        }, 0);
      }
    }
  }
} 