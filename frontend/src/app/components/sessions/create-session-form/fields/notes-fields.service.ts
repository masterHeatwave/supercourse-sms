import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class SessionNotesFieldsService {
  getFields(): FormlyFieldConfig[] {
    return [
      { template: `<hr class="my-3 border-primary" />` },
      { template: `<h3 class="text-primary font-bold text-2xl mb-2">Notes:</h3>` },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'notes',
            type: 'primary-textarea',
            className: 'col-12',
            props: {
              placeholder: 'Notes'
            }
          }
        ]
      }
    ];
  }
}


