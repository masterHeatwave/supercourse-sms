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
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { LoadingComponent } from '../../../loading/loading.component';
import { WarningDialogComponent } from '../../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'multiple-choice-question',
  standalone: true,
  imports: [
    FormsModule,
    ImageSelectorComponent,
    LoadingComponent,
    WarningDialogComponent,
  ],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent {
  @Input() questionText: string = '';
  @Input() TTSText = '';
  @Input() imageURL: string = '';
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;
  isLoading: boolean = false;

  @Output() questionTextChanged: EventEmitter<string> =
    new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() TTSTextChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();

  private lastSoundElement: HTMLElement | null = null;
  @ViewChild('lastSoundElementRef', { static: false })
  lastSoundElementRef!: ElementRef<HTMLElement>;

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

  onInputChange(newText: string) {
    if (this.questionText === '') {
      if (this.lastSoundElement) {
        if (
          this.lastSoundElement.classList.contains('image-sound-selected-style')
        ) {
          this.lastSoundElement.classList.remove('image-sound-selected-style');
          this.TTSText = '';
          this.TTSTextChanged.emit('');
        }
      }
    } else {
      if (this.lastSoundElement !== null && this.TTSText !== '') {
        this.TTSText = newText;
        this.TTSTextChanged.emit(newText);
      }
    }
    this.questionTextChanged.emit(newText);
  }

  soundClick(event: Event) {
    const target = event.target as HTMLElement;
    if (
      !target.classList.contains('image-sound-selected-style') &&
      this.questionText !== ''
    ) {
      target.classList.add('image-sound-selected-style');
      this.lastSoundElement = target;
      this.TTSText = this.questionText;
      this.TTSTextChanged.emit(this.questionText);
    } else {
      target.classList.remove('image-sound-selected-style');
      this.lastSoundElement = null;
      this.TTSText = '';
      this.TTSTextChanged.emit('');
    }
  }

  onDeleteClick() {
    this.deleteClicked.emit();
  }
}
