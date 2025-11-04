import { Component, inject } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { FormGroup, Validators } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import emailValidator from '@validators/email-validator';
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
    ButtonModule,
    DialogModule
  ],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent {
  #authService = inject(AuthService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);

  dialogVisible: boolean = false;
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
      validators: {
        validation: [emailValidator]
      }
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
      validators: {
        validation: [Validators.minLength(8)]
      }
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
