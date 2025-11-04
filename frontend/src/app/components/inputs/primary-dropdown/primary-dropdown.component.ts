import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

type DropdownOption = { label: string; value: any };

@Component({
  selector: 'app-primary-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './primary-dropdown.component.html',
  styleUrls: ['./primary-dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PrimaryDropdownComponent),
      multi: true,
    },
  ],
})
export class PrimaryDropdownComponent implements ControlValueAccessor {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = '';
  @Input() styleClass: string = '';
  @Input() disabled: boolean = false;

  value: any = '';
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}


