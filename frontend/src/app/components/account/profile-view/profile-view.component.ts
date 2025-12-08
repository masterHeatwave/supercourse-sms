import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ENDPOINTS, API_ASSET_URL } from '@config/endpoints';
import { Store } from '@ngrx/store';
import { selectUser } from '@store/auth/auth.selectors';
import { User } from '@gen-api/schemas';
import { AppState } from '@store/app.state';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  department?: string;
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TranslateModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  userProfile: UserProfile = {
    firstName: 'Loading...',
    lastName: '',
    email: 'loading@example.com'
  };

  loading = true;
  error = false;
  uploadingImage = false;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private translate: TranslateService,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.loading = true;
    this.error = false;

    // Get user from auth store
    this.store.select(selectUser).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.userProfile = {
            firstName: user.firstname || '',
            lastName: user.lastname || '',
            email: user.email || '',
            phone: user.phone || user.mobile || '',
            avatar: user.avatar ? `${API_ASSET_URL}/${user.avatar}` : undefined,
            role: user.role_title || (user.roles && user.roles.length > 0 ? user.roles[0].title : ''),
            department: user.default_branch || ''
          };
          this.loading = false;
        } else {
          this.error = true;
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onRetry() {
    this.loadUserProfile();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: 'Please select an image file'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: 'Image size must be less than 5MB'
        });
        return;
      }

      this.uploadImage(file);
    }
  }

  uploadImage(file: File) {
    this.uploadingImage = true;

    const formData = new FormData();
    formData.append('media', file);

    this.http.post<any>(ENDPOINTS.MEDIA_UPLOAD, formData).subscribe({
      next: (response) => {
        if (response && response.data && response.data.path) {
          // Update the avatar with the uploaded image path
          this.userProfile.avatar = `${API_ASSET_URL}/${response.data.path}`;

          // TODO: Update user profile on backend with new avatar path
          // this.updateUserAvatar(response.data.path);

          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('api_messages.success_title'),
            detail: 'Profile picture updated successfully'
          });
        }
        this.uploadingImage = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: 'Failed to upload image. Please try again.'
        });
        this.uploadingImage = false;
      }
    });
  }

  // TODO: Implement this method to update user avatar on backend
  // updateUserAvatar(avatarPath: string) {
  //   this.http.put(ENDPOINTS.USER_UPDATE, { avatar: avatarPath }).subscribe({
  //     next: () => {
  //       console.log('Avatar updated on backend');
  //     },
  //     error: (error) => {
  //       console.error('Failed to update avatar:', error);
  //     }
  //   });
  // }
}

