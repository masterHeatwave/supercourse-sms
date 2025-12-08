import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PrimeIcons } from 'primeng/api';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { LoadingComponent } from '../../../loading/loading.component';
import { LoadingService } from '../../../../services/loading.service';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';
import { CommonModule } from '@angular/common';
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'word-order-answer',
  standalone: true,
  imports: [
    ToggleButtonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    DialogModule,
    LoadingComponent,
    DividerModule,
    ImageModule,
    CommonModule,
    ImageSelectorComponent,
    WarningDialogComponent,
    TranslateModule
  ],
  templateUrl: './answer.component.html',
  styleUrl: './answer.component.scss',
})
export class AnswerComponent {
  @Input() imageURL: string = '';
  @Input() answerText: string = '';

  @Output() inputChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();

  primeIcons = PrimeIcons;
  isLoading: boolean = false;
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe(
      (isLoading) => (this.isLoading = isLoading)
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['answerText']) {
      this.answerText = this.answerText.split('#@').join(' ');
    }
  }

  handleImageSelectorBusy(isBusy: boolean) {
    this.isLoading = isBusy;
  }

  handleErrorMessage(msg: string) {
    this.warningMessage = msg;
    this.isWarningDialogVisible = true;
  }

  handleImageURLChanged(imageUrl: string) {
    this.imageURL = imageUrl;
    this.imageURLChanged.emit(imageUrl);
  }

  onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value.trim();
    const words = newValue.split(/\s+/);
    //console.log(words);

    if (words.length > 7) {
      event.stopPropagation();
      event.preventDefault();
      this.answerText = words.slice(0, 7).join(' ');
      inputElement.value = this.answerText;
      //return;
    }

    this.answerText = newValue;
    this.inputChanged.emit(newValue);
  }

  onDeleteClick() {
    this.deleteClicked.emit();
  }

  generateClick() {}

  searchClick() {}
}
