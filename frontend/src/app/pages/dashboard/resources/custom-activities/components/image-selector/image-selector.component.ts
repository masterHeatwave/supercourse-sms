import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../loading/loading.component';
import { environment } from '@environments/environment.development';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-image-selector',
  standalone: true,
  imports: [DialogModule, ButtonModule, ImageModule, CommonModule, FormsModule, LoadingComponent, TranslateModule],
  templateUrl: './image-selector.component.html',
  styleUrl: './image-selector.component.scss'
})
export class ImageSelectorComponent {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('imageIcon') imageIcon!: ElementRef;
  @Input() isDialogVisible: boolean = false;
  @Input() imageURL: string = '';
  @Output() onImageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() onBusy: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onErrorMessage: EventEmitter<string> = new EventEmitter<string>();
  AIQueryText: string = '';
  PexelsQueryText: string = '';
  isLoading: boolean = false;
  uploadedFromFile: boolean = false;

  selectedFile: File | null = null;
  validExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'svg', 'tiff', 'heif', 'heic'];

  constructor(
    private customActivityService: CustomActivitiesService,
    private translate: TranslateService //private mediaUploadService: MediaUploadService
  ) {}

  ngAfterViewInit(): void {
    if (this.imageURL !== '') {
      this.onImageURLChanged.emit(this.imageURL);
      if (!this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
        this.imageIcon.nativeElement.classList.add('image-selected-style');
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      let extension = input.files[0].name.split('.').pop()?.toLocaleLowerCase();
      if (extension && this.validExtensions.includes(extension)) {
        this.isLoading = true;
        this.uploadImage();
        input.value = '';
      } else {
        this.onErrorMessage.emit(this.translate.instant('customActivities.wrong_file_type')); //'Wrong file type (' + extension + '). Try again using only image file types.');
      }
    }
  }

  uploadClick() {
    this.selectedFile = null;
    this.fileInput.nativeElement.click();
  }

  uploadImage() {
    if (this.selectedFile) {
      //const formData = new FormData();
      //formData.append('media', this.selectedFile);
      //const file = this.selectedFile; // from an <input type="file">
      const body = { media: this.selectedFile };

      this.customActivityService.postCustomActivitiesSaveImage(body).subscribe({
        next: (response: any) => {
          this.uploadedFromFile = true;
          this.imageURL = environment.assetUrl + '/' + response.data.path; //.imageData.link;
          this.onImageURLChanged.emit(this.imageURL);
          if (!this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
            this.imageIcon.nativeElement.classList.add('image-selected-style');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error in image upload:', err);
          this.onErrorMessage.emit(this.translate.instant('customActivities.error_while_upload')); //'An error occurred during upload. Please try again.');
        }
      });
    }
  }

  deleteImage() {
    if (!this.uploadedFromFile) {
      this.imageURL = '';
      this.onImageURLChanged.emit('');
      if (this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
        this.imageIcon.nativeElement.classList.remove('image-selected-style');
      }
      return;
    }

    this.customActivityService.postCustomActivitiesDeleteImage({ url: this.imageURL }).subscribe({
      next: (response: any) => {
        //console.log(response);
        if (response.success) {
          this.imageURL = '';
          this.uploadedFromFile = false;
          this.onImageURLChanged.emit('');
          if (this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
            this.imageIcon.nativeElement.classList.remove('image-selected-style');
          }
        } else {
          this.onErrorMessage = response.message;
        }
      },
      error: (err) => {
        console.error('Error in image upload:', err);
        this.onErrorMessage.emit(this.translate.instant('customActivities.error_during_delete')); //'An error occurred during delete. Please try again.');
      }
    });
  }

  generateWithAI() {
    if (this.uploadedFromFile) {
      this.deleteImage();
    }
    this.isLoading = true;
    this.customActivityService.postCustomActivitiesGenerateFromAI({ query: this.AIQueryText }).subscribe({
      next: (response) => {
        if (response.success) {
          this.imageURL = response.imagesData;
          console.log(this.imageURL);
          this.customActivityService.postCustomActivitiesUploadFromURL({ url: this.imageURL }).subscribe({
            next: (response: any) => {
              console.log('response', response);
              this.imageURL = environment.assetUrl + '/' + response.data.path;
            }
          });
          this.onImageURLChanged.emit(this.imageURL);
          if (!this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
            this.imageIcon.nativeElement.classList.add('image-selected-style');
          }
        } else {
          this.onErrorMessage.emit(response.message);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.onErrorMessage.emit(this.translate.instant('customActivities.error_generating_ai')); //'Something went wrong with AI generation. Please try again.');
      }
    });
  }

  searthWithPexels() {
    if (this.uploadedFromFile) {
      this.deleteImage();
    }
    this.isLoading = true;
    this.customActivityService.postCustomActivitiesFindOnPexels({ query: this.PexelsQueryText }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.imageURL = response.imagesData[0].src.original;
          this.onImageURLChanged.emit(this.imageURL);
          if (!this.imageIcon.nativeElement.classList.contains('image-selected-style')) {
            this.imageIcon.nativeElement.classList.add('image-selected-style');
          }
        } else {
          this.onErrorMessage.emit(this.translate.instant('customActivities.no_images_found')); //response.message);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.onErrorMessage.emit(this.translate.instant('customActivities.error_searching_pexels')); //'Something went wrong with Pexels search. Please try again.');
      }
    });
  }

  showDialog() {
    this.isDialogVisible = true;
  }

  hideDialog() {
    this.isDialogVisible = false;
  }
}
