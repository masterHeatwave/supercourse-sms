import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';

@Injectable({
  providedIn: 'root'
})
export class LinkedContactFieldsService {
    private linkedContactFields: FormlyFieldConfig[] = [];
    private isEditMode = false;

    constructor() {
        this.linkedContactFields = this.buildLinkedContactFields();
    }

    setEditMode(isEdit: boolean) {
        this.isEditMode = isEdit;
        this.linkedContactFields = this.buildLinkedContactFields();
    }

    getLinkedContactFields(): FormlyFieldConfig[] {
        return this.linkedContactFields;
    }

    private buildLinkedContactFields(): FormlyFieldConfig[] {
        return [
            {
                fieldGroupClassName: '',
                fieldGroup: [
                    {
                        template: '<app-contacts></app-contacts>'
                    }
                ]
            }
        ];
    }
}


