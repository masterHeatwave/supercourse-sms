import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class InventoryDatesFieldsService {
  getFields(): FormlyFieldConfig[] {
    return [
      {
        template: '<h3 class="text-primary font-bold text-xl mt-4 mb-2">Dates:</h3>',
      },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'billing_date',
            type: 'primary-calendar',
            className: 'col-12 md:col-2',
            props: {
              label: 'Billing Date',
              required: true,
              placeholder: 'Billing Date',
              dateFormat: 'yy-mm-dd',
              showIcon: true
            }
          },
          {
            key: 'return_date',
            type: 'primary-calendar',
            className: 'col-12 md:col-2',
            props: {
              label: 'Return Date',
              required: true,
              placeholder: 'Return Date',
              dateFormat: 'yy-mm-dd',
              showIcon: true,
              minDate: new Date() // Ensure return date is not in the past
            }
          }
        ]
      },
      {
        template: '<div class="border-1 border-primary w-full mt-4 mb-2"></div>'
    },
    ];
  }
}
