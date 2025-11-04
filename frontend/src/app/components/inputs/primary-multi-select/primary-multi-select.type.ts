import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { PrimaryMultiSelectComponent } from './primary-multi-select.component';

export const FIELD_TYPE_COMPONENTS = [
  PrimaryMultiSelectComponent,
];

export const PRIMARY_MULTI_SELECT_TYPE = {
  name: 'primary-multi-select',
  component: PrimaryMultiSelectComponent,
  wrappers: ['form-field'],
}; 