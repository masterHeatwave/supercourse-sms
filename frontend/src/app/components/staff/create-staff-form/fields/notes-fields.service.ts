import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';

/**
 * Service for managing social media fields in the staff form
 */
@Injectable({
  providedIn: 'root'
})
export class NotesFieldsService {
  /**
   * Get social media fields configuration
   */
  getNotesFields(): FormlyFieldConfig[] {
    const isDev = environment.development;
    const defaultValues = {
        notes: isDev ? faker.lorem.paragraph() : ''
    };

    return [
      {
        fieldGroupClassName: '',
        fieldGroup: [
          {
            fieldGroupClassName: 'grid',
            fieldGroup: [
              {
                key: 'notes',
                type: 'primary-textarea',
                className: 'col-12',
                props: {
                  required: false,
                  placeholder: 'Notes',
                  rows: 4
                },
                defaultValue: defaultValues.notes
              }
            ]
          }
        ]
      }
    ];
  }
}
