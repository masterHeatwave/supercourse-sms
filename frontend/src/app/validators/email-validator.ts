import { AbstractControl } from '@angular/forms';

const emailValidator = (control: AbstractControl) => {
  const email = control.value;
  if (!email) {
    return null;
  }
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email) ? null : { email: { message: 'validation.email' } };
};

export default emailValidator;
