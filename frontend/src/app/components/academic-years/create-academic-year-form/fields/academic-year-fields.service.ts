import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({
  providedIn: 'root'
})
export class AcademicYearFieldsService {
  private academicYearFields: FormlyFieldConfig[] = [];

  constructor() {
    this.academicYearFields = this.buildAcademicYearFields();
  }

  getAcademicYearFields(): FormlyFieldConfig[] {
    return this.academicYearFields;
  }

  private buildAcademicYearFields(): FormlyFieldConfig[] {
    // Since we're handling everything manually in the template now,
    // we return an empty array
    return [];
  }
}
