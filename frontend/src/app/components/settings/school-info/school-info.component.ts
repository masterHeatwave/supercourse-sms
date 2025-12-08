import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CustomerService } from '@services/customer.service';
import { Customer } from '@gen-api/schemas/customer';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import { RoleAccessService, PageAccess } from '@services/role-access.service';
import { ENDPOINTS, API_ASSET_URL } from '@config/endpoints';

interface SchoolInfo {
  name: string;
  description: string;
  heroImage: string;
  avatar?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}

@Component({
  selector: 'app-school-info',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  templateUrl: './school-info.component.html',
  styleUrl: './school-info.component.scss',
  providers: [MessageService]
})
export class SchoolInfoComponent implements OnInit, OnDestroy {
  schoolInfo: SchoolInfo = {
    name: 'Loading...',
    description: 'Loading school information...',
    heroImage: 'assets/images/school-hero.jpg'
  };
  loading = true;
  error = false;
  customerData: Customer | null = null;
  canEditSchoolInfo = false;
  uploadingLogo = false;

  private destroy$ = new Subject<void>();

  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private roleAccessService: RoleAccessService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadMainCustomer();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMainCustomer() {
    this.loading = true;
    this.error = false;

    this.customerService
      .getMainCustomer()
      .pipe(
        catchError((error) => {
          console.error('Error loading main customer:', error);
          this.error = true;
          return of(null);
        })
      )
      .subscribe((response) => {
        this.loading = false;

        if (response?.data) {
          const customer = response.data;
          this.customerData = customer; // Store the full customer data
          this.schoolInfo = {
            name: customer.name || 'School Name',
            description: customer.description || 'No description available for this school.',
            heroImage: customer.avatar || 'assets/images/school-hero.jpg',
            avatar: customer.avatar,
            website: customer.website,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
          };
        } else {
          this.error = true;
          // Fallback data
          this.schoolInfo = {
            name: 'School Information',
            description: 'Unable to load school information at this time.',
            heroImage: 'assets/images/school-hero.jpg'
          };
        }
      });
  }

  onRetry() {
    this.loadMainCustomer();
  }

  triggerLogoInput() {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File',
          detail: 'Please select an image file'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'Image size must be less than 5MB'
        });
        return;
      }

      this.uploadLogo(file);
    }
  }

  uploadLogo(file: File) {
    this.uploadingLogo = true;

    const formData = new FormData();
    formData.append('media', file);

    this.http.post<any>(ENDPOINTS.MEDIA_UPLOAD, formData).subscribe({
      next: (response) => {
        if (response && response.data && response.data.path) {
          const logoPath = response.data.path;

          // Update the school logo via the customer service
          this.customerService
            .updateMainCustomer({ avatar: logoPath })
            .pipe(
              catchError((error) => {
                console.error('Error updating school logo:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Update Failed',
                  detail: 'Failed to update school logo. Please try again.'
                });
                this.uploadingLogo = false;
                return of(null);
              })
            )
            .subscribe((updateResponse) => {
              this.uploadingLogo = false;

              if (updateResponse?.data) {
                // Update local data
                this.customerData = updateResponse.data;
                this.schoolInfo.avatar = `${API_ASSET_URL}/${logoPath}`;

                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'School logo updated successfully!'
                });
              }
            });
        } else {
          this.uploadingLogo = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload logo. Please try again.'
          });
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadingLogo = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to upload logo. Please try again.'
        });
      }
    });
  }
}
