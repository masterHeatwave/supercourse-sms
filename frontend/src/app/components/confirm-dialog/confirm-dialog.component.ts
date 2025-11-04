import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { AbsenceStatus } from '@gen-api/schemas';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ ConfirmDialogModule, ButtonModule, RadioButtonModule, FormsModule, TranslateModule, OutlineButtonComponent, CommonModule ],
  providers: [ConfirmationService],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {

  @Input() customHeaderKey: string | undefined;
  @Input() customMessageKey: string | undefined;
  @Input() customButtonName: string | undefined;
  @Input() customHeaderText: string | undefined;
  @Input() customMessageText: string | undefined;
  
  // Absence type selection inputs
  @Input() showAbsenceTypeSelection = false;
  @Input() absenceTypes: { value: AbsenceStatus; label: string }[] = [];
  @Input() selectedAbsenceType: AbsenceStatus = AbsenceStatus.unexcused;
  @Input() studentName = '';
  
  @Output() onConfirmAction = new EventEmitter<boolean>();
  @Output() onAbsenceTypeConfirm = new EventEmitter<AbsenceStatus>();

  
  constructor(
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  confirm(headerOverride?: string, messageOverride?: string) {
    const headerKey = this.customHeaderKey;
    const messageKey = this.customMessageKey;

    const header = headerOverride
      || this.customHeaderText
      || (headerKey ? this.translate.instant(headerKey) : this.translate.instant('confirm-dialog.title'));
    const message = messageOverride
      || this.customMessageText
      || (messageKey ? this.translate.instant(messageKey) : this.translate.instant('confirm-dialog.message'));

    this.confirmationService.confirm({
      message: message,
      header: header,
      icon: this.showAbsenceTypeSelection ? 'pi pi-user-minus' : 'pi pi-trash',
      accept: () => {
        if (this.showAbsenceTypeSelection) {
          this.onAbsenceTypeConfirm.emit(this.selectedAbsenceType);
        } else {
          this.onConfirmAction.emit(true);
        }
      },
      reject: () => {
        this.onConfirmAction.emit(false);
      }
    });
  }
}
