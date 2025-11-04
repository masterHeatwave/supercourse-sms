import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { LoggingService } from '@services/logging/logging.service';

/**
 * Utility service for form operations
 * Centralizes common form manipulation functions for reuse across components
 */
@Injectable({
  providedIn: 'root'
})
export class FormUtilityService {
  constructor(private logger: LoggingService) {}

  /**
   * Mark all controls in a form group as touched to trigger validation visuals
   * @param formGroup FormGroup to mark as touched
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        this.markFormArrayTouched(control);
      }
    });
  }
  
  /**
   * Mark all controls in a form array as touched
   * @param formArray FormArray to mark as touched
   */
  markFormArrayTouched(formArray: FormArray): void {
    formArray.controls.forEach((control) => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        this.markFormArrayTouched(control);
      }
    });
  }
  
  /**
   * Get all validation errors from a form group
   * @param formGroup FormGroup to extract errors from
   * @param controlPath Optional path prefix for nested error reporting
   * @returns Object with all validation errors
   */
  getFormValidationErrors(formGroup: FormGroup, controlPath: string = ''): Record<string, any> {
    const errors: Record<string, any> = {};
    
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      const currentPath = controlPath ? `${controlPath}.${key}` : key;
      
      if (control instanceof FormGroup) {
        const childErrors = this.getFormValidationErrors(control, currentPath);
        Object.assign(errors, childErrors);
      } else if (control instanceof FormArray) {
        const childErrors = this.getFormArrayValidationErrors(control, currentPath);
        Object.assign(errors, childErrors);
      } else if (control?.errors) {
        errors[currentPath] = control.errors;
      }
    });
    
    return errors;
  }
  
  /**
   * Get all validation errors from a form array
   * @param formArray FormArray to extract errors from
   * @param controlPath Path prefix for error reporting
   * @returns Object with all validation errors
   */
  private getFormArrayValidationErrors(formArray: FormArray, controlPath: string): Record<string, any> {
    const errors: Record<string, any> = {};
    
    formArray.controls.forEach((control, index) => {
      const currentPath = `${controlPath}[${index}]`;
      
      if (control instanceof FormGroup) {
        const childErrors = this.getFormValidationErrors(control, currentPath);
        Object.assign(errors, childErrors);
      } else if (control instanceof FormArray) {
        const childErrors = this.getFormArrayValidationErrors(control, currentPath);
        Object.assign(errors, childErrors);
      } else if (control.errors) {
        errors[currentPath] = control.errors;
      }
    });
    
    return errors;
  }
  
  /**
   * Reset a form group to initial values
   * @param formGroup FormGroup to reset
   * @param defaultValues Optional default values to set
   */
  resetForm(formGroup: FormGroup, defaultValues?: Record<string, any>): void {
    if (defaultValues) {
      formGroup.reset(defaultValues);
    } else {
      formGroup.reset();
    }
    
    this.logger.debug('Form reset', { formGroupName: (formGroup as any).name });
  }
  
  /**
   * Set values for multiple form controls at once
   * @param formGroup FormGroup to update
   * @param values Values to set in the form
   * @param options Angular form patch options
   */
  patchFormValues(
    formGroup: FormGroup, 
    values: Record<string, any>, 
    options: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    try {
      formGroup.patchValue(values, options);
    } catch (error) {
      this.logger.error('Error patching form values', error);
    }
  }
  
  /**
   * Enable or disable a form control by its path
   * @param formGroup Parent FormGroup
   * @param controlPath Path to the control (dot notation for nested controls)
   * @param enable Whether to enable or disable the control
   */
  setControlEnabled(
    formGroup: FormGroup, 
    controlPath: string, 
    enable: boolean
  ): void {
    const control = this.getControlByPath(formGroup, controlPath);
    
    if (control) {
      if (enable) {
        control.enable();
      } else {
        control.disable();
      }
    } else {
      this.logger.warn(`Control not found at path: ${controlPath}`);
    }
  }
  
  /**
   * Get a form control by its path
   * @param formGroup Parent FormGroup
   * @param path Path to the control (dot notation for nested controls)
   * @returns The form control or null if not found
   */
  getControlByPath(formGroup: FormGroup, path: string): AbstractControl | null {
    const segments = path.split('.');
    let current: AbstractControl = formGroup;
    
    for (const segment of segments) {
      if (current instanceof FormGroup || current instanceof FormArray) {
        current = current.get(segment) as AbstractControl;
        
        if (!current) {
          return null;
        }
      } else {
        return null;
      }
    }
    
    return current;
  }
}