
import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';

@Injectable({
    providedIn: 'root'
})
export class HealthInfoFieldsService {

    private _healthInfoFields: FormlyFieldConfig[] = [];

    constructor() {
        this._healthInfoFields = this.buildHealthInfoFields();
    }

    getHealthInfoFields(): FormlyFieldConfig[] {
        return this._healthInfoFields;
    }

    private buildHealthInfoFields(): FormlyFieldConfig[] {

        const isDev = environment.development;
        const defaultValues = {
            hasAllergies: false, // Default to false (off) for new students
            healthDetails: isDev ? faker.lorem.paragraph() : ''
        };

        return [
            {
              template: '<h3 class="text-primary font-bold text-2xl mb-2">Health Info</h3>',
            },
            {
              key: 'hasAllergies',
              type: 'primary-toggle',
              className: 'col-12 md:col-6',
              props: {
                label: 'Allergies - Medication',
                disabled: false,
                defaultValue: defaultValues.hasAllergies
              },
              defaultValue: defaultValues.hasAllergies
            },
            {
              key: 'healthDetails',
              type: 'primary-textarea',
              className: 'col-12',
              props: {
                placeholder: 'Description, details',
                rows: 4,
                autoResize: false
              }
            }
          ];
    }
    
    

}

