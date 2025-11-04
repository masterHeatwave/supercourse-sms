import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
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
import { WarningDialogComponent } from '../../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'letter-hunt-answer',
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
  ],
  templateUrl: './answer.component.html',
  styleUrl: './answer.component.scss',
})
export class AnswerComponent {
  @Input() answerNumber: number = 1;
  @Input() imageURL: string = '';
  @Input() TTSText: string = '';
  @Input() answerText: string = '';

  @Output() inputChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() TTSTextChanged: EventEmitter<string> = new EventEmitter<string>();

  primeIcons = PrimeIcons;
  isLoading: boolean = false;
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;
  @ViewChild('lastSoundElementRef', { static: false })
  lastSoundElementRef!: ElementRef<HTMLElement>;
  private lastSoundElement: HTMLElement | null = null;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe(
      (isLoading) => (this.isLoading = isLoading)
    );
  }

  ngAfterViewInit(): void {
    this.lastSoundElement = this.lastSoundElementRef.nativeElement;
    if (this.TTSText && this.lastSoundElement) {
      this.lastSoundElement.classList.add('image-sound-selected-style');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['TTSText']) {
      if (this.lastSoundElement) {
        this.lastSoundElement.classList.add('image-sound-selected-style');
      }
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

  onInputChange(newValue: string) {
    if (this.answerText === '') {
      if (this.lastSoundElement) {
        if (
          this.lastSoundElement.classList.contains('image-sound-selected-style')
        ) {
          this.lastSoundElement.classList.remove('image-sound-selected-style');
          this.TTSText = '';
          this.TTSTextChanged.emit('');
          this.lastSoundElement = null;
        }
      }
    } else {
      if (this.lastSoundElement !== null && this.TTSText !== '') {
        this.TTSText = newValue;
        this.TTSTextChanged.emit(newValue);
      }
    }
    this.inputChanged.emit(newValue);
  }

  onDeleteClick() {
    this.deleteClicked.emit();
  }

  soundClick(event: Event) {
    const target = event.target as HTMLElement;
    if (
      !target.classList.contains('image-sound-selected-style') &&
      this.answerText !== ''
    ) {
      target.classList.add('image-sound-selected-style');
      this.lastSoundElement = target;
      this.TTSText = this.answerText;
      this.TTSTextChanged.emit(this.answerText);
    } else {
      target.classList.remove('image-sound-selected-style');
      this.lastSoundElement = null;
      this.TTSText = '';
      this.TTSTextChanged.emit('');
    }
  }

  generateClick() {}

  searchClick() {}
}
