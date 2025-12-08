import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class InventoryDetailsFieldsService {
    private studentsOptions: Array<{ label: string; value: string }> = [];
    private context: 'asset' | 'elibrary' = 'asset';

    setStudentsOptions(options: Array<{ label: string; value: string }>): void {
        this.studentsOptions = options || [];
    }

    setContext(context: 'asset' | 'elibrary'): void {
        this.context = context;
    }

    getFields(): FormlyFieldConfig[] {
        const holderLabel = this.context === 'elibrary' ? 'Borrower' : 'Asset Holder';
        const placeholder = this.context === 'elibrary' ? 'Select Borrower' : 'Select Asset Holder';
        
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
                            placeholder: placeholder
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
