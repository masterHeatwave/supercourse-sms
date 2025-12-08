import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'memory-matching-pairs-item',
  standalone: true,
  imports: [
    ImageSelectorComponent,
    FormsModule,
    CommonModule,
    WarningDialogComponent,
    TranslateModule
  ],
  templateUrl: './memory-matching-pairs-item.component.html',
  styleUrl: './memory-matching-pairs-item.component.scss',
})
export class MemoryMatchingPairsItemComponent {
  @Input() answerText: string = '';
  @Input() imageURL: string = '';
  @Input() TTSText: string = '';
  private lastSoundElement: HTMLElement | null = null;
  @ViewChild('lastSoundElementRef', { static: false })
  lastSoundElementRef!: ElementRef<HTMLElement>;

  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;

  @Output() inputChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() TTSTextChanged: EventEmitter<string> = new EventEmitter<string>();

  handleErrorMessage(msg: string) {
    this.warningMessage = msg;
    this.isWarningDialogVisible = true;
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
          this.lastSoundElement = null;
          this.TTSTextChanged.emit(newValue);
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
}
