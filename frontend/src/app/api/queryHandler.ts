import { Injectable } from '@angular/core';
import { LoadingService } from '@services/loading/loading.service';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class QueryHandler {
  constructor(
    private messageService: MessageService,
    private loadingService: LoadingService,
    private translateService: TranslateService
  ) { }

  handleError(error: any) {
    const translatedKey = this.getTranslatedKey(error.error.message);
    this.translateService.get(translatedKey).subscribe((translatedMessage) => {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('api_messages.error_title'),
        detail: translatedMessage
      });
    });
  }

  handleSuccess(result: any) {
    const translationKey = this.getTranslatedKey(result.message);
    this.translateService.get(translationKey).subscribe((translatedMessage) => {
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('api_messages.success_title'),
        detail: translatedMessage
      });
    });
  }

  handleSettled() {
    this.loadingService.setLoading(false);
  }

  private getTranslatedKey(apiMessage: string): string {
    switch (apiMessage) {
      case 'test':
        return 'Testing Error';
      default:
        return apiMessage;
    }
  }
}
