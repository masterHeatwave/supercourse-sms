import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@gen-api/auth/auth.service';
import { PostAuthResetPasswordBody } from '@gen-api/schemas';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [
    CardModule,
    ImageModule,
    TranslateModule,
    RouterModule,
    PrimaryButtonComponent,
    FormsModule,
    FormlyModule,
    ReactiveFormsModule,
    ButtonModule
  ],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent {
  #authService = inject(AuthService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);

  form = new FormGroup({});
  model = { email: '', token: '', password: '', passwordConfirmation: '' };
  fields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'primary-input',
      props: {
        label: 'Email',
        required: true,
        inputType: 'text',
        styleClass: 'mb-2',
        readonly: true
      },
    },
    {
      key: 'token',
      props: {
        required: true,
        inputType: 'hidden'
      }
    },
    {
      key: 'password',
      type: 'primary-input',
      props: {
        label: 'New password',
        required: true,
        inputType: 'password',
        styleClass: 'mb-2'
      },
    },
    // @TODO Check validaiton if password match
    {
      key: 'passwordConfirmation',
      type: 'primary-input',
      props: {
        label: 'Confirm password',
        required: true,
        inputType: 'password'
      }
    }
  ];

  loading: boolean = false;
  success: boolean = false;
  error: any;

  // Field name to label mapping
  private readonly fieldLabels: Record<string, string> = {
    email: 'Email',
    password: 'New password',
    passwordConfirmation: 'Confirm password',
    token: 'Token'
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.model.token = params['pin'];
      this.model.email = params['email'];
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;

      const payload: PostAuthResetPasswordBody = {
        email: this.model.email,
        token: this.model.token,
        password: this.model.password
      };

      this.#authService.postAuthResetPassword(payload).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;

          this.#messageService.add({
            severity: 'success',
            summary: this.#translateService.instant('api_messages.success_title'),
            detail: this.#translateService.instant('Password reset successful')
          });

          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.error = error;
          this.loading = false;

          // Extract error messages from errors array if available
          let errorMessage = 'An error occurred';
          if (error?.error?.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
            // Process each error message and replace all placeholders
            errorMessage = error.error.errors
              .map((err: any) => {
                let message = err.message || '';
                // Replace {{field}} placeholder with actual field label
                if (message.includes('{{field}}') && err.path && Array.isArray(err.path) && err.path.length > 0) {
                  const fieldName = err.path[err.path.length - 1];
                  const fieldLabel = this.fieldLabels[fieldName] || this.formatFieldName(fieldName);
                  message = message.replace(/\{\{field\}\}/g, fieldLabel);
                }
                // Replace other placeholders like {{min}}, {{max}}, etc. from error object properties
                message = this.replacePlaceholders(message, err);
                return message;
              })
              .filter((msg: string) => msg)
              .join(', ');
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.#messageService.add({
            severity: 'error',
            summary: this.#translateService.instant('api_messages.error_title'),
            detail: errorMessage
          });
        }
      });
    }
  }

  /**
   * Format field name to a readable label (fallback if not in fieldLabels)
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Replace placeholders in error messages with values from error object
   * Handles placeholders like {{min}}, {{max}}, {{minimum}}, {{maximum}}, etc.
   */
  private replacePlaceholders(message: string, error: any): string {
    // Find all placeholders in the message (e.g., {{min}}, {{max}}, {{field}})
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    let result = message;
    const matches = Array.from(message.matchAll(placeholderRegex));

    for (const match of matches) {
      const placeholder = match[0]; // e.g., "{{min}}"
      const key = match[1].toLowerCase(); // e.g., "min"

      // Try to find the value in the error object
      let value: any = null;

      // Direct property match (case-insensitive)
      const errorKeys = Object.keys(error || {});
      const matchingKey = errorKeys.find(k => k.toLowerCase() === key);
      if (matchingKey && error[matchingKey] !== undefined) {
        value = error[matchingKey];
      }

      // Common aliases for validation properties (Zod, Angular validators, etc.)
      if (value === null || value === undefined) {
        const aliases: Record<string, string[]> = {
          min: ['minimum', 'minlength', 'minLength', 'min_length'],
          max: ['maximum', 'maxlength', 'maxLength', 'max_length'],
          length: ['len', 'size']
        };

        if (aliases[key]) {
          for (const alias of aliases[key]) {
            if (error && error[alias] !== undefined) {
              value = error[alias];
              break;
            }
          }
        }
      }

      // Check nested objects (e.g., error.params.minimum, error.constraints.minLength)
      if ((value === null || value === undefined) && error) {
        if (error.params && typeof error.params === 'object') {
          const paramsKey = Object.keys(error.params).find(k => k.toLowerCase() === key);
          if (paramsKey && error.params[paramsKey] !== undefined) {
            value = error.params[paramsKey];
          }
        }
        if ((value === null || value === undefined) && error.constraints && typeof error.constraints === 'object') {
          const constraintsKey = Object.keys(error.constraints).find(k => k.toLowerCase() === key);
          if (constraintsKey && error.constraints[constraintsKey] !== undefined) {
            value = error.constraints[constraintsKey];
          }
        }
      }

      // Replace all occurrences of placeholder with value if found, otherwise leave as is
      if (value !== null && value !== undefined) {
        const placeholderEscaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(placeholderEscaped, 'g'), String(value));
      }
    }

    return result;
  }
}
