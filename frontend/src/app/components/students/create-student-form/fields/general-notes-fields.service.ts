import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';

@Injectable({
    providedIn: 'root'
})
export class GeneralNotesFieldsService {

    private _generalNotesFields: FormlyFieldConfig[] = [];

    constructor() {
        this._generalNotesFields = this.buildGeneralNotesFields();
    }

    getGeneralNotesFields(): FormlyFieldConfig[] {
        return this._generalNotesFields;
    }

    private buildGeneralNotesFields(): FormlyFieldConfig[] {
        return [
            {
                fieldGroupClassName: '',
                fieldGroup: [
                    {
                        template: '<h3 class="text-primary font-bold text-2xl mb-2">General Notes</h3>',
                    },
                    {
                        key: 'generalNotes',
                        type: 'primary-textarea',
                        className: 'col-12',
                        props: {
                            placeholder: 'Description, details',
                            rows: 4,
                            autoResize: false
                        }
                    }
                ]
            }
        ];
    }

}