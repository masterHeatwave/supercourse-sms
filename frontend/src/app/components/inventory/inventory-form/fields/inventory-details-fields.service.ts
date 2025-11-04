import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class InventoryDetailsFieldsService {
    private studentsOptions: Array<{ label: string; value: string }> = [];

    setStudentsOptions(options: Array<{ label: string; value: string }>): void {
        this.studentsOptions = options || [];
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
                        key: 'user',
                        type: 'primary-select',
                        className: 'col-12 md:col-6',
                        props: {
                            required: true,
                            selectOptions: this.studentsOptions,
                            placeholder: 'Select Billing Person'
                        }
                    },
                    {
                        key: 'title',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                            required: true,
                            placeholder: 'Enter title',
                            type: 'text'
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
