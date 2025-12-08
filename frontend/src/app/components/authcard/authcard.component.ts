import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
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
import { CustomerService } from '@services/customer.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-authcard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ImageModule,
    TranslateModule,
    RouterModule,
    PrimaryButtonComponent,
    PrimaryDropdownComponent,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './authcard.component.html',
  styleUrl: './authcard.component.scss'
})
export class AuthcardComponent implements OnInit, OnDestroy {
  @Input() context: string | null = null;
  @Input() formType: 'login' | 'register' = 'login';

  form!: FormGroup;
  loading: boolean = false;
  success: boolean = false;
  error: any;
  schoolsLoading: boolean = true;
  schoolsLoadError: boolean = false;
  schoolOptions: { label: string; value: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private messageService: MessageService,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    // Initialize form
    this.form = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      context: ['', [Validators.required]]
    });

    // Load schools list
    this.customerService
      .getPublicSchools()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schools) => {
          this.schoolsLoading = false;
          this.schoolsLoadError = false;
          this.schoolOptions = schools;

          // If context was provided via query param, preselect it
          if (this.context) {
            this.form.patchValue({ context: this.context });
          }

          // Set development defaults
          if (environment.development) {
            this.form.patchValue({
              email: 'admin@example.com',
              password: 'password'
            });
            // Auto-select first school in development if no context provided
            if (!this.context && schools.length > 0) {
              this.form.patchValue({ context: schools[0].value });
            }
          }
        },
        error: (err) => {
          console.error('Failed to load schools:', err);
          this.schoolsLoading = false;
          this.schoolsLoadError = true;
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα φόρτωσης',
            detail: 'Δεν ήταν δυνατή η φόρτωση των σχολείων. Παρακαλώ δοκιμάστε ξανά.'
          });
        }
      });

    // Subscribe to auth state to show error messages if login fails
    this.store
      .select((state: AppState) => state.auth)
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState: IAuthState) => {
        // console.log('Auth state:', authState);
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
      const { email, password, context } = this.form.value;
      
      if (!context) {
        this.messageService.add({
          severity: 'error',
          summary: 'Σφάλμα',
          detail: 'Παρακαλώ επιλέξτε σχολείο'
        });
        return;
      }

      this.store.dispatch(AuthActions.login({ 
        email, 
        password, 
        context 
      }));
    } else {
      this.form.markAllAsTouched();
    }
  }

  get isFormDisabled(): boolean {
    return this.schoolsLoading || this.schoolsLoadError || !this.form.valid;
  }
}
