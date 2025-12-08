import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';
import { TranslateModule } from '@ngx-translate/core';

export interface TreeNode {
  key: string;
  label: string;
  data?: any;
  children?: TreeNode[];
}

@Component({
  selector: 'app-primary-nested-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeSelectModule,
    TranslateModule
  ],
  templateUrl: './primary-nested-select.component.html',
  styleUrls: ['./primary-nested-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PrimaryNestedSelectComponent),
      multi: true,
    },
  ],
})
export class PrimaryNestedSelectComponent implements ControlValueAccessor {
  @Input() options: TreeNode[] = [];
  @Input() placeholder: string = '';
  @Input() styleClass: string = '';
  @Input() disabled: boolean = false;
  @Input() showClear: boolean = true;
  @Input() filter: boolean = true;
  @Input() selectionMode: 'single' | 'multiple' | 'checkbox' = 'checkbox';
  @Input() display: 'comma' | 'chip' = 'chip';
  @Input() metaKeySelection: boolean = false;

  value: any = null;
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

