import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class SessionFieldsService {
  private classesOptions: Array<{ label: string; value: string }> = [];
  private teachersOptions: Array<{ label: string; value: string }> = [];
  private studentsOptions: Array<{ label: string; value: string }> = [];
  private academicYearsOptions: Array<{ label: string; value: string }> = [];
  private academicPeriodsOptions: Array<{ label: string; value: string }> = [];

  setClassesOptions(options: Array<{ label: string; value: string }>): void {
    this.classesOptions = options || [];
  }

  setTeachersOptions(options: Array<{ label: string; value: string }>): void {
    this.teachersOptions = options || [];
  }

  setStudentsOptions(options: Array<{ label: string; value: string }>): void {
    this.studentsOptions = options || [];
  }

  setAcademicYearsOptions(options: Array<{ label: string; value: string }>): void {
    this.academicYearsOptions = options || [];
  }

  setAcademicPeriodsOptions(options: Array<{ label: string; value: string }>): void {
    this.academicPeriodsOptions = options || [];
  }

  getFields(): FormlyFieldConfig[] {
    return [
      {
        template: '<h3 class="text-primary font-bold text-xl mb-4">Details:</h3>',
      },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'academicPeriod',
            type: 'primary-select',
            className: 'col-12 md:col-3',
            props: {
              label: 'Academic Period',
              required: true,
              selectOptions: this.academicPeriodsOptions,
              placeholder: 'Academic Period'
            }
          }
        ]
      },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'classes',
            type: 'primary-select',
            className: 'col-12 md:col-3',
            props: {
              label: 'Classes',
              required: true,
              selectOptions: this.classesOptions,
              isSearch: true,
              placeholder: 'Classes'
            }
          },
          {
            key: 'teachers',
            type: 'primary-multi-select',
            className: 'col-12 md:col-3',
            props: {
              label: 'Teachers',
              required: false,
              selectOptions: this.teachersOptions,
              placeholder: 'Teachers'
            }
          },
          {
            key: 'students',
            type: 'primary-multi-select',
            className: 'col-12 md:col-3',
            props: {
              label: 'Students',
              required: false,
              selectOptions: this.studentsOptions,
              placeholder: 'Students'
            }
          },
          {
            key: 'classColor',
            type: 'primay-color-select',
            className: 'col-12 md:col-2',
            props: {
              colorOptions: [
                { label: 'Red', value: 'red', hex: '#FF0000' },
                { label: 'Green', value: 'green', hex: '#00FF00' },
                { label: 'Blue', value: 'blue', hex: '#0000FF' },
                { label: 'Yellow', value: 'yellow', hex: '#FFFF00' },
                { label: 'Orange', value: 'orange', hex: '#FFA500' },
                { label: 'Purple', value: 'purple', hex: '#800080' },
                { label: 'Pink', value: 'pink', hex: '#FFC0CB' }
              ]
            }
          },
        ]
      },
      {
        template: `<hr class="my-3 border-primary" />`
      },
    ];
  }
}


