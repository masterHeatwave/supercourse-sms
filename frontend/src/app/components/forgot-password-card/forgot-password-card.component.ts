import { Component, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import emailValidator from '@validators/email-validator';
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
    FormErrorComponent,
    DialogModule
  ],
  templateUrl: './forgot-password-card.component.html',
  styleUrl: './forgot-password-card.component.scss'
})
export class ForgotPasswordCardComponent {
  #authService = inject(AuthService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);

  dialogVisible: boolean = false;
  dialogMessage: string = '';
  isSuccess: boolean = false;

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
      },
      validators: {
        validation: [emailValidator]
      }
    }
  ];

  error: any;
  loading: boolean = false;

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const payload: PostAuthForgotPasswordBody = { email: this.model.email };

      this.#authService.postAuthForgotPassword(payload).subscribe({
        next: () => {
          this.dialogMessage = 'Ένας σύνδεσμος Επαναφοράς Κωδικού στάλθηκε στο email σας';
          this.isSuccess = true;
          this.dialogVisible = true;
          this.loading = false;

          this.#messageService.add({
            severity: 'success',
            summary: this.#translateService.instant('api_messages.success_title'),
            detail: this.#translateService.instant('Password reset link sent to your email')
          });
        },
        error: (error: any) => {
          this.error = error;
          this.dialogMessage = 'Λανθασμένα Στοιχεία';
          this.isSuccess = false;
          this.dialogVisible = true;
          this.loading = false;

          const errorMessage = error?.error?.message || 'An error occurred';
          this.#messageService.add({
            severity: 'error',
            summary: this.#translateService.instant('api_messages.error_title'),
            detail: this.#translateService.instant(errorMessage)
          });
        }
      });
    }
  }
}
