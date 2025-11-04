import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-primay-color-select',
  standalone: true,
  imports: [ CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, FormlyModule, ColorPickerModule ],
  templateUrl: './primay-color-select.component.html',
  styleUrl: './primay-color-select.component.scss'
})
export class PrimayColorSelectComponent extends FieldType<FieldTypeConfig> {
  isOpen = false;

  @ViewChild('dropdownRef') dropdownRef?: ElementRef<HTMLElement>;

  get label() {
    return this.props['label'] || '';
  }

  get styleClass() {
    return this.props['styleClass'] || '';
  }

  get placeholder() {
    return this.props['placeholder'] || '';
  }

  get required() {
    return this.props['required'] || false;
  }

  get disabled() {
    return this.props['disabled'] || false;
  }

  // Whether to render the picker inline instead of overlay mode
  get inline() {
    return this.props['inline'] || false;
  }

  // Optional behavior: close the dropdown immediately after picking
  get closeOnPick() {
    return this.props['closeOnPick'] || false;
  }

  // Scale factor for making the picker larger visually (via CSS transform)
  get pickerScale(): number {
    const scale = this.props['pickerScale'];
    const num = Number(scale);
    return !isNaN(num) && num > 0 ? num : 1;
  }

  get scaleStyle() {
    return { transform: `scale(${this.pickerScale})`, transformOrigin: 'top left' } as const;
  }

  // PrimeNG color picker expects hex without '#'
  get pickerValue(): string {
    const value: string = this.formControl?.value || '';
    if (!value) return '';
    return value.startsWith('#') ? value.slice(1) : value;
  }

  onPickerChange(value: string) {
    if (this.disabled) return;
    const withHash = value ? (value.startsWith('#') ? value : `#${value}`) : '';
    this.formControl.setValue(withHash);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    // Close overlay after selection only when explicitly requested
    if (this.closeOnPick) {
      this.isOpen = false;
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  get hasColor(): boolean {
    return !!this.formControl?.value;
  }

  get selectedColor(): string {
    return this.formControl?.value || '#ffffff';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) return;
    const target = event.target as Node;
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }
} 