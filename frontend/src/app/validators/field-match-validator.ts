import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const passwordMatchValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const passwordConfirmation = control.get('passwordConfirmation');

    if (!password || !passwordConfirmation) {
      return null; // Return null if control is not present
    }

    if (password.value !== passwordConfirmation.value) {
      return { passwordsNotMatching: true };
    }
    return null;
  };
};

export default passwordMatchValidator;
