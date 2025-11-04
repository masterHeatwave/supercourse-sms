import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { PersonalInfoFieldsService } from './personal-info-fields.service';
import { LinkedContactFieldsService } from './linked-contact-fields.service';
import { HealthInfoFieldsService } from './health-info-fields.service';
import { GeneralNotesFieldsService } from './general-notes-fields.service';
import { DocumentUploadService } from '../../../../services/document-upload.service';

/**
 * Main service for managing student form fields
 * Acts as a facade to combine field sections from specialized services
 */
@Injectable({
  providedIn: 'root'
})
export class StudentFormFieldsService {
  private personalInfoFields = inject(PersonalInfoFieldsService);
  private linkedContactFields = inject(LinkedContactFieldsService);
  private healthInfoFields = inject(HealthInfoFieldsService);
  private generalNotesFields = inject(GeneralNotesFieldsService);
  private documentUploadService = inject(DocumentUploadService);
  // Store field references to update them later
  private _personalInfoFields: FormlyFieldConfig[] = [];
  private _linkedContactFields: FormlyFieldConfig[] = [];
  private _healthInfoFields: FormlyFieldConfig[] = [];
  private _generalNotesFields: FormlyFieldConfig[] = [];
  private _documentUploadFields: FormlyFieldConfig[] = [];

  constructor() {
    this._personalInfoFields = this.personalInfoFields.getPersonalInfoFields();
    this._linkedContactFields = this.linkedContactFields.getLinkedContactFields();
    this._healthInfoFields = this.healthInfoFields.getHealthInfoFields();
    this._generalNotesFields = this.generalNotesFields.getGeneralNotesFields();
    this._documentUploadFields = this.getDocumentUploadFields();
  }

  /**
   * Get all field sections for the student form
   */
  getAllFields(): {
    personalInfoFields: FormlyFieldConfig[],
    linkedContactFields: FormlyFieldConfig[],
    healthInfoFields: FormlyFieldConfig[],
    generalNotesFields: FormlyFieldConfig[],
    documentUploadFields: FormlyFieldConfig[]
  } {
    return {
      personalInfoFields: this._personalInfoFields,
      linkedContactFields: this._linkedContactFields,
      healthInfoFields: this._healthInfoFields,
      generalNotesFields: this._generalNotesFields,
      documentUploadFields: this._documentUploadFields
    };
  }

  /**
   * Get personal information fields
   */
  getPersonalInfoFields(): FormlyFieldConfig[] {
    return this._personalInfoFields;
  }

  /**
   * Get the linked contact fields service
   */
  getLinkedContactFieldsService(): LinkedContactFieldsService {
    return this.linkedContactFields;
  }

  /**
   * Get health info fields
   */
  getHealthInfoFields(): FormlyFieldConfig[] {
    return this._healthInfoFields;
  }

  /**
   * Get general notes fields
   */
  getGeneralNotesFields(): FormlyFieldConfig[] {
    return this._generalNotesFields;
  }

  /**
   * Get document upload fields
   */
  private getDocumentUploadFields(): FormlyFieldConfig[] {
    return this.documentUploadService.getDocumentUploadFields('Upload document');
  }
}