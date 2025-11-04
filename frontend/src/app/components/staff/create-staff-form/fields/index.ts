import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { PersonalInfoFieldsService } from './personal-info-fields.service';
import { SocialMediaFieldsService } from './social-media-fields.service';
import { DocumentUploadService } from '../../../../services/document-upload.service';
import { NotesFieldsService } from './notes-fields.service';

/**
 * Main service for managing staff form fields
 * Acts as a facade to combine field sections from specialized services
 */
@Injectable({
  providedIn: 'root'
})
export class StaffFormFieldsService {
  private personalInfoFields = inject(PersonalInfoFieldsService);
  private socialMediaFields = inject(SocialMediaFieldsService);
  private documentUploadService = inject(DocumentUploadService);
  private notesFields = inject(NotesFieldsService);

  // Store field references to update them later
  private _personalInfoFields: FormlyFieldConfig[] = [];
  private _socialMediaFields: FormlyFieldConfig[] = [];
  private _documentUploadFields: FormlyFieldConfig[] = [];
  private _notesFields: FormlyFieldConfig[] = [];

  constructor() {
    this._personalInfoFields = this.personalInfoFields.getPersonalInfoFields();
    this._socialMediaFields = this.socialMediaFields.getSocialMediaFields();
    this._documentUploadFields = this.getDocumentUploadFields();
    this._notesFields = this.notesFields.getNotesFields();
  }

  /**
   * Set edit mode and optionally provide staff data
   */
  setEditMode(isEditMode: boolean, staffData?: any): void {
    this.personalInfoFields.setEditMode(isEditMode, staffData);
  }

  /**
   * Get all field sections for the staff form
   */
  getAllFields(): {
    personalInfoFields: FormlyFieldConfig[],
    socialMediaFields: FormlyFieldConfig[],
    documentUploadFields: FormlyFieldConfig[]
  } {
    return {
      personalInfoFields: this._personalInfoFields,
      socialMediaFields: this._socialMediaFields,
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
   * Get social media fields
   */
  getSocialMediaFields(): FormlyFieldConfig[] {
    return this._socialMediaFields;
  }

  /**
   * Get document upload fields
   */
  getDocumentUploadFields(): FormlyFieldConfig[] {
    return this.documentUploadService.getDocumentUploadFields('Upload document');
  }

  /**
   * Get notes fields
   */
  getNotesFields(): FormlyFieldConfig[] {
    return this._notesFields;
  }
}
