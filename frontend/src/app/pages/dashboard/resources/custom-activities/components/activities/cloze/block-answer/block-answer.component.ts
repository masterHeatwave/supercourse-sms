import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { ButtonModule } from 'primeng/button';
import { WarningDialogComponent } from '../../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'cloze-block-answer',
  standalone: true,
  imports: [
    CommonModule,
    ImageSelectorComponent,
    ButtonModule,
    WarningDialogComponent,
  ],
  templateUrl: './block-answer.component.html',
  styleUrl: './block-answer.component.scss',
})
export class BlockAnswerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editableDiv', { static: true }) editableDiv!: ElementRef;
  textBlocks: HTMLElement[] = [];
  mouseClicked: boolean = false;

  isLoading: boolean = false;
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;
  listenFunc: Function = () => {};

  @Input() imageURL: string = '';
  @Input() document: string = '';
  @Input() strings: string[] = [];

  @Output() blocksChanged: EventEmitter<object> = new EventEmitter<object>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  ngAfterViewInit(): void {
    if (this.editableDiv) {
      const editableDiv = this.editableDiv.nativeElement;
      editableDiv.addEventListener('keydown', (event: KeyboardEvent) =>
        this.handleKeyDown(event)
      );
      editableDiv.addEventListener('keyup', (event: KeyboardEvent) =>
        this.handleKeyUp(event)
      );

      if (this.document != '' && this.strings.length > 0) {
        this.editableDiv.nativeElement.innerText = this.document;
        let replacements = [...this.strings];
        let startIndex = 0;
        let index = 0;
        let childIndex = 0;
        let result = this.editableDiv.nativeElement.innerText.replace(
          /_+/g,
          () => {
            const word = replacements[index];
            const currentChildIndex = childIndex++;
            const text = this.editableDiv.nativeElement.innerText;
            const match = text.match(/_+/);
            if (match) {
              startIndex = match.index;
            }
            setTimeout(
              () => this.selectReplacedWord(word, currentChildIndex, startIndex),
              0
            );
            index++;
            childIndex++;
            return word;
          }
        );

        this.editableDiv.nativeElement.innerText = result;
      }
      if (this.imageURL !== '') {
        this.imageURLChanged.emit(this.imageURL);
      }
    }
  }

  selectReplacedWord(word: string, index: number, startIndex: number) {
    const editableDiv = this.editableDiv.nativeElement;
    const textNode = editableDiv.childNodes[index];

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const startOffset = startIndex || textNode.textContent?.indexOf(word) || 0;
      const endOffset = startOffset + word.length;

      const range = document.createRange();
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const selectedText = range.toString();
      const isAtEnd = this.isRangeAtEnd(range);
      const span = document.createElement('span');
      this.createTextBlock(span, selectedText);
      range.deleteContents();
      if (isAtEnd) {
        const blank = document.createTextNode('\u00A0');
        range.insertNode(blank);
      }
      range.insertNode(span);
      this.updateStrings(this.editableDiv.nativeElement);
      this.textBlocks.push(span);
      selection?.removeAllRanges();
    }
  }

  ngOnDestroy(): void {
    if (this.editableDiv) {
      const editableDiv = this.editableDiv.nativeElement;
      editableDiv.removeEventListener('keydown', (event: KeyboardEvent) =>
        this.handleKeyDown(event)
      );
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const button = document.querySelector('button');
      if (event.target === button || button?.contains(event.target as Node)) {
        event.preventDefault();
      }
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    if (this.editableDiv) {
      this.updateStrings(this.editableDiv.nativeElement);
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

  createTextBlock(span: HTMLElement, selectedText: string) {
    span.innerText = selectedText;
    span.style.border = '2px solid green';
    span.style.borderRadius = '5px';
    span.style.color = 'green';
    span.style.display = 'inline';
    span.style.position = 'relative';

    const closeButton = document.createElement('button');
    closeButton.innerText = 'X';
    closeButton.setAttribute('contenteditable', 'false');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '-15px';
    closeButton.style.right = '-15px';
    closeButton.style.backgroundColor = 'red';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '20px';
    closeButton.style.height = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.userSelect = 'none';
    closeButton.addEventListener('click', () => {
      closeButton.remove();
      const textNode = document.createTextNode(span.innerText);
      span.parentNode?.replaceChild(textNode, span);
      this.updateStrings(this.editableDiv.nativeElement);
    });
    span.appendChild(closeButton);
    this.updateStrings(this.editableDiv.nativeElement);
    this.textBlocks.push(span);
  }

  addTextBlock() {
    if (!this.mouseClicked) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (this.isRangeInsideSpan(range) || this.hasSpanInRange(range)) {
          alert('Please select other text.');
          return;
        }
        if (
          this.editableDiv.nativeElement.contains(range.commonAncestorContainer)
        ) {
          const selectedText = range.toString();
          const isAtEnd = this.isRangeAtEnd(range);
          if (selectedText.length > 0) {
            const span = document.createElement('span');
            this.createTextBlock(span, selectedText);
            range.deleteContents();
            if (isAtEnd) {
              const blank = document.createTextNode('\u00A0');
              range.insertNode(blank);
            }
            range.insertNode(span);
            this.updateStrings(this.editableDiv.nativeElement);
            this.textBlocks.push(span);
          }
          this.mouseClicked = true;
        }
      }
    }
  }

  hasSpanInRange(range: Range): boolean {
    const fragment = range.cloneContents();
    return fragment.querySelector('span') !== null;
  }

  isRangeInsideSpan(range: Range): boolean {
    let container: Node | null = range.commonAncestorContainer;

    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentNode;
    }

    while (container && container !== this.editableDiv.nativeElement) {
      if ((container as HTMLElement).tagName === 'SPAN') {
        return true;
      }
      container = container.parentNode;
    }

    return false;
  }

  updateStrings(parentElement: HTMLElement) {
    const spans = parentElement.querySelectorAll('span');
    this.strings = [];

    spans.forEach((span) => {
      this.strings.push(span.innerHTML.split('<button')[0]);
    });

    const originalDiv = this.editableDiv.nativeElement;
    const clonedContent = originalDiv.cloneNode(true) as HTMLElement;
    const spanElements = clonedContent.querySelectorAll('span');

    spanElements.forEach((span) => {
      const spanText = span.innerText;
      const underscoreLength = spanText.length + 4;
      const underscores = '_'.repeat(underscoreLength);
      const textNode = document.createTextNode(underscores);

      span.parentNode?.replaceChild(textNode, span);
    });

    let modifiedString = clonedContent.innerText;
    let obj = {
      document: modifiedString,
      answers: this.strings,
    };

    this.blocksChanged.emit(obj);
  }

  isRangeAtEnd(range: Range): boolean {
    let endContainer = range.endContainer;

    if (endContainer.nodeType === Node.TEXT_NODE) {
      return range.endOffset === endContainer.nodeValue?.length;
    }

    if (endContainer.nodeType === Node.ELEMENT_NODE) {
      const childNodes = endContainer.childNodes;
      if (range.endOffset === childNodes.length) {
        return true;
      }

      const lastNode = childNodes[range.endOffset - 1];
      if (lastNode?.nodeType === Node.TEXT_NODE) {
        return range.endOffset === lastNode.nodeValue?.length;
      }
    }

    return false;
  }
}
