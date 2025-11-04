import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TextBlockComponent } from '../text-block/text-block.component';
import { CommonModule } from '@angular/common';
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { ButtonModule } from 'primeng/button';
import { WarningDialogComponent } from '../../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'blocks-answer',
  standalone: true,
  imports: [TextBlockComponent, CommonModule, ImageSelectorComponent, ButtonModule, WarningDialogComponent],
  templateUrl: './blocks-answer.component.html',
  styleUrl: './blocks-answer.component.scss'
})
export class BlocksAnswerComponent {
  textBlocks: number[] = [];

  isLoading: boolean = false;
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;

  @Input() imageURL: string = '';
  @Input() strings: string[] = [];
  @Input() hasData: boolean = false;

  @Output() blocksChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  ngAfterViewInit() {
    if (this.strings.length > 0) {
      for (let i = 0; i < this.strings.length; i++) {
        this.textBlocks.push(Date.now());
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

  addTextBlock() {
    if (this.textBlocks.length < 7) {
      this.textBlocks.push(Date.now());
      this.strings.push('');
    } else {
      this.warningMessage = 'Insert up to 7 blocks of words.';
      this.isWarningDialogVisible = true;
    }
  }

  removeTextBlock(index: number) {
    this.textBlocks.splice(index, 1);
    this.strings.splice(index, 1);
    let finalString = this.strings.join('#@');
    this.blocksChanged.emit(finalString);
  }

  handleContentChanged(value: string, index: number) {
    this.strings[index] = value;
    let finalString = this.strings.join('#@');
    this.blocksChanged.emit(finalString);
  }

  onDeleteClick() {
    this.deleteClicked.emit();
  }
}
