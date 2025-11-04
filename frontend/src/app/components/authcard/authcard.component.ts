import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '@store/auth/auth.actions';
import { IAuthState } from '@store/auth/auth.model';
import { AppState } from '@store/app.state';
import { environment } from '@environments/environment.development';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-authcard',
  standalone: true,
  imports: [
    CardModule,
    ImageModule,
    TranslateModule,
    RouterModule,
    PrimaryButtonComponent,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './authcard.component.html',
  styleUrl: './authcard.component.scss'
})
export class AuthcardComponent implements OnInit, OnDestroy {
  @Input() context: string | null = null;
  @Input() formType: 'login' | 'register' = 'login';

  form = new FormGroup({});
  model = { email: '', password: '' };
  fields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'primary-input',
      props: {
        label: 'login.authcard.username.label',
        required: true,
        inputType: 'text',
        styleClass: 'mb-2'
      }
    },
    {
      key: 'password',
      type: 'primary-input',
      props: {
        label: 'login.authcard.password.label',
        required: true,
        inputType: 'password'
      }
    }
  ];
  loading: boolean = false;
  success: boolean = false;
  error: any;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>, private router: Router, private messageService: MessageService) {}

  ngOnInit() {
    if (environment.development) {
      this.model = {
        email: 'admin@example.com',
        password: 'password'
      };
    }

    // Subscribe to auth state to show error messages if login fails
    this.store
      .select((state: AppState) => state.auth)
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState: IAuthState) => {
        console.log('Auth state:', authState);
        this.loading = authState.loading;
        this.success = authState.success;
        this.error = authState.error;

        if (authState.error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα συνδεσης',
            detail: 'Τα στοιχεία που δώσατε δεν είναι σωστά'
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.form.valid) {
      this.store.dispatch(AuthActions.login({ ...this.model, context: this.context }));
    } else {
      this.form.markAllAsTouched();
    }
  }
}
