import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SessionFormComponent } from '@components/sessions/create-session-form/session-form.component';
import { LoggingService } from '../../../../services/logging/logging.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    TranslateModule,
    ToastModule,
    SessionFormComponent
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  providers: [MessageService]
})
export class CreateComponent implements OnInit {
  isLoadingData = false;
  isEditMode = false;
  sessionId: string | null = null;
  sessionData: any = null;

  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private loggingService = inject(LoggingService);

  ngOnInit() {}

  // No edit mode, no loader for existing data in create

  onSessionCreated(_result: any) {
    // Form component already performed the API call; just notify and navigate
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('api_messages.success_title'),
      detail: this.translate.instant('sessions.create.created')
    });
    this.router.navigate(['/dashboard/sessions']);
  }

  // Create page does not handle updates

  // API submission is handled inside the form component

  private handleApiError(error: any): void {
    this.loggingService.error('Failed to save session:', error);

    let errorMessage = this.translate.instant('sessions.create.generic_error');
    if (error?.error?.errors) {
      // Handle validation errors
      const validationErrors = error.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
      errorMessage = `${this.translate.instant('sessions.create.validation_errors_prefix')} ${validationErrors}`;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('api_messages.error_title'),
      detail: errorMessage
    });
  }

  onFormError(error: any) {
    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('api_messages.error_title'),
      detail: error.message || 'An error occurred while processing the form'
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/sessions']);
  }
}
