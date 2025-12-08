import { Component, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@gen-api/auth/auth.service';
import { FormErrorComponent } from '@components/form-error/form-error.component';
import { PostAuthForgotPasswordBody } from '@gen-api/schemas';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-forgot-password-card',
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
    FormErrorComponent
  ],
  templateUrl: './forgot-password-card.component.html',
  styleUrl: './forgot-password-card.component.scss'
})
export class ForgotPasswordCardComponent {
  #authService = inject(AuthService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);

  form = new FormGroup({});
  model = { email: '' };
  fields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'primary-input',
      props: {
        label: 'Email',
        required: true,
        inputType: 'text'
      }
    }
  ];

  error: any;
  loading: boolean = false;

  // Field name to label mapping
  private readonly fieldLabels: Record<string, string> = {
    email: 'Email'
  };

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const payload: PostAuthForgotPasswordBody = { email: this.model.email };

      this.#authService.postAuthForgotPassword(payload).subscribe({
        next: () => {
          this.loading = false;

          this.#messageService.add({
            severity: 'success',
            summary: this.#translateService.instant('api_messages.success_title'),
            detail: this.#translateService.instant('Password reset link sent to your email')
          });
        },
        error: (error: any) => {
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
