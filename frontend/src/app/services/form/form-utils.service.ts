import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormUtilsService {
  /**
   * Recursively marks all controls in a form group as touched
   * Useful for triggering validation messages when a form is submitted
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  /**
   * Extracts all validation errors from a form group
   * @returns Object with field paths as keys and error objects as values
   */
  getFormValidationErrors(form: FormGroup): Record<string, ValidationErrors> {
    const errors: Record<string, ValidationErrors> = {};

    const extractErrors = (control: AbstractControl, path: string) => {
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(key => {
          const nestedPath = path ? `${path}.${key}` : key;
          extractErrors(control.get(key)!, nestedPath);
        });
      } else {
        if (control.errors) {
          errors[path] = control.errors;
        }
      }
    };

    extractErrors(form, '');
    return errors;
  }

  /**
   * Gets error messages for a specific form control
   * @returns Array of error messages
   */
  getControlErrorMessages(control: AbstractControl): string[] {
    if (!control || !control.errors) {
      return [];
    }

    const messages: string[] = [];
    const errors = control.errors;

    if (errors['required']) {
      messages.push('This field is required');
    }
    if (errors['email']) {
      messages.push('Please enter a valid email address');
    }
    if (errors['minlength']) {
      const req = errors['minlength'].requiredLength;
      messages.push(`Minimum length is ${req} characters`);
    }
    if (errors['maxlength']) {
      const req = errors['maxlength'].requiredLength;
      messages.push(`Maximum length is ${req} characters`);
    }
    if (errors['pattern']) {
      messages.push('Invalid format');
    }

    return messages;
  }

  /**
   * Resets a form group to its initial state
   */
  resetForm(form: FormGroup, initialValues: any = {}): void {
    form.reset(initialValues);
  }
}
