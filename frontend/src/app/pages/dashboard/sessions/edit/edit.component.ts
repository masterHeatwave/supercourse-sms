import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SessionFormComponent } from '@components/sessions/create-session-form/session-form.component';

@Component({
  selector: 'app-edit-session',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, TranslateModule, ToastModule, SessionFormComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  providers: [MessageService]
})
export class EditSessionComponent implements OnInit {
  isLoadingData = false;
  sessionId: string | null = null;
  sessionData: any = null;

  #router = inject(Router);
  #route = inject(ActivatedRoute);
  #sessionsService = inject(SessionsService);
  #messageService = inject(MessageService);
  #translate = inject(TranslateService);

  ngOnInit() {
    this.sessionId = this.#route.snapshot.paramMap.get('id');
    if (this.sessionId) {
      this.loadSessionData(this.sessionId);
    } else {
      this.#messageService.add({
        severity: 'error',
        summary: this.#translate.instant('api_messages.error_title'),
        detail: this.#translate.instant('sessions.create.load_failed')
      });
      this.#router.navigate(['/dashboard/sessions']);
    }
  }

  loadSessionData(sessionId: string) {
    this.isLoadingData = true;
    this.#sessionsService.getSessionsId(sessionId).subscribe({
      next: (response: any) => {
        this.sessionData = response.data;
        console.log('Loaded session data for edit:', {
          sessionId: this.sessionId,
          sessionDataId: this.sessionData?.id,
          sessionData: this.sessionData
        });
        this.isLoadingData = false;
      },
      error: (error) => {
        this.isLoadingData = false;
        this.#messageService.add({
          severity: 'error',
          summary: this.#translate.instant('api_messages.error_title'),
          detail: this.#translate.instant('sessions.create.load_failed')
        });
        this.#router.navigate(['/dashboard/sessions']);
      }
    });
  }

  onSessionUpdated(sessionData: any) {
    // Session is already updated by the form component, just show success and navigate
    this.#messageService.add({
      severity: 'success',
      summary: this.#translate.instant('api_messages.success_title'),
      detail: this.#translate.instant('sessions.create.updated')
    });
    this.#router.navigate(['/dashboard/sessions']);
  }

  private handleApiError(error: any): void {
    let errorMessage = this.#translate.instant('sessions.create.generic_error');
    if (error?.error?.message) errorMessage = error.error.message;
    this.#messageService.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: errorMessage });
  }

  onFormError(error: any) {
    this.#messageService.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: error?.message || 'Form error' });
  }

  goBack() {
    this.#router.navigate(['/dashboard/sessions']);
  }
}


