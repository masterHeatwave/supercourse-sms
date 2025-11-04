import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class InventoryNotesFieldsService {
  getFields(): FormlyFieldConfig[] {
    return [
      {
        template: '<h3 class="text-primary font-bold text-xl mt-4 mb-2">Notes:</h3>',
      },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'notes',
            type: 'primary-textarea',
            className: 'col-12',
            props: {
              placeholder: 'Notes',
              rows: 4
            }
          }
        ]
      }
    ];
  }
}
