import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { PrimaryButtonComponent } from '@components/buttons/primary-button/primary-button.component';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { DocumentService, Document } from '@services/document.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { UsersService } from '@gen-api/users/users.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { StaffOverviewComponent } from '@components/staff/staff-overview/staff-overview.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '@environments/environment';
import { CustomersService } from '@gen-api/customers/customers.service';
import { AcademicOverviewService } from '@gen-api/academic-overview/academic-overview.service';
import { AcademicOverviewYear, AcademicOverviewPeriod, GetAcademicOverviewResponse } from '@interfaces/academic-overview';
import { RoleAccessService } from '@services/role-access.service';
interface Permission {
  name: string;
  actions: string[];
  subgroups?: {
    name: string;
    isExpanded: boolean;
    actions: string[];
  }[];
}

@Component({
  selector: 'app-single-staff',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    TooltipModule,
    TableModule,
    PrimaryButtonComponent,
    PrimaryTableComponent,
    ToastModule,
    OutlineButtonComponent,
    DialogModule,
    ProgressBarModule,
    ConfirmDialogComponent,
    StaffOverviewComponent,
    TranslateModule
  ],
  templateUrl: './single-staff.component.html',
  styleUrl: './single-staff.component.scss',
  providers: [MessageService, ConfirmationService, ConfirmDialogComponent],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [style({ height: '0', opacity: 0, overflow: 'hidden' }), animate('200ms ease-out', style({ height: '*', opacity: 1 }))]),
      transition(':leave', [style({ height: '*', opacity: 1, overflow: 'hidden' }), animate('200ms ease-in', style({ height: '0', opacity: 0 }))])
    ])
  ]
})
export class SingleStaffComponent implements OnInit {
  private usersService = inject(UsersService);
  private customersService = inject(CustomersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private documentService = inject(DocumentService);
  private sanitizer = inject(DomSanitizer);
  private academicOverviewService = inject(AcademicOverviewService);
  private roleAccessService = inject(RoleAccessService);

  staffData$: Observable<any> = of(null);
  academicOverview$: Observable<AcademicOverviewYear[]> = of([]);
  documents: Document[] = [];
  allExpanded = false;
  staffId: string | null = null;
  avatarUrl: SafeUrl | null = null;
  isDeleting = false;

  // Upload dialog
  uploadDialogVisible = false;
  uploadFile: File | null = null;
  uploadFileName = '';
  uploadProgress = 0;
  isUploading = false;

  jobHistoryColumns = [
    { field: 'title', header: 'Title' },
    { field: 'role', header: 'Role' },
    { field: 'branch', header: 'Branch' },
    { field: 'class', header: 'Class' },
    { field: 'startDate', header: 'Start Date' },
    { field: 'endDate', header: 'End Date' }
  ];

  ngOnInit() {
    this.staffId = this.route.snapshot.paramMap.get('id');
    if (!this.staffId) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('api_messages.error_title'),
        detail: this.translate.instant('staff.single.errors.no_id')
      });
      return;
    }

    const staff$ = this.usersService.getUsersStaffId(this.staffId).pipe(
      switchMap((response) => {
        const staffData = response.data;

        console.log('staffData', staffData);

        // If there are customer IDs, fetch their details
        if (staffData?.customers && Array.isArray(staffData.customers) && staffData.customers.length > 0) {
          return this.customersService.getCustomers().pipe(
            map((customersResponse) => {
              const customers = customersResponse.data || [];
              // Find the customer that matches the ID
              const customer = customers.find((c) => (staffData as any).customers.includes(c.id));
              if (customer) {
                (staffData as any).customerDetails = customer;
              }
              return staffData;
            })
          );
        }
        return of(staffData);
      }),
      map((staffData) => {
        // Handle documents
        if (staffData?.documents && Array.isArray(staffData.documents)) {
          this.documents = staffData.documents.map((docPath: string) => {
            const fileName = docPath.split('/').pop() || '';
            // Remove 'media/' prefix if it exists to avoid duplication
            const cleanPath = docPath.replace(/^media\//, '');
            return {
              id: fileName,
              name: fileName,
              type: this.getFileType(fileName),
              path: docPath.startsWith('http') ? docPath : `${environment.assetUrl}/media/${cleanPath}`,
              upload_date: new Date().toISOString(),
              size: 0
            };
          });
        }

        // Set default avatar colors for initials if no avatar image
        if (staffData && (!staffData.avatar || staffData.avatar === '')) {
          const firstInitial = staffData.firstname ? staffData.firstname.charAt(0) : '';
          const lastInitial = staffData.lastname ? staffData.lastname.charAt(0) : '';
          (staffData as any).avatarInitials = (firstInitial + lastInitial).toUpperCase();

          // Generate a consistent color based on name
          const nameHash = this.hashCode(staffData.firstname + staffData.lastname);
          const hue = Math.abs(nameHash % 360);
          (staffData as any).avatarColor = `hsl(${hue}, 70%, 50%)`;
        } else if (staffData && staffData.avatar) {
          // Handle different avatar paths
          let avatarPath = staffData.avatar;

          // If it's a relative path, prefix with the asset URL
          if (avatarPath && !avatarPath.startsWith('http') && !avatarPath.startsWith('data:')) {
            const assetUrl = environment.assetUrl;

            // If path starts with media/ or /media/, adjust it accordingly
            if (avatarPath.startsWith('media/') || avatarPath.startsWith('/media/')) {
              avatarPath = `${assetUrl}/${avatarPath.replace(/^\//, '')}`;
            } else {
              avatarPath = `${assetUrl}/media/${avatarPath}`;
            }

            // Create a new Image object to test if the image loads
            const img = new Image();
            img.onload = () => {
              this.avatarUrl = this.sanitizer.bypassSecurityTrustUrl(avatarPath);
              (staffData as any).avatarUrl = this.avatarUrl;
            };
            img.onerror = () => {
              // If image fails to load, fall back to initials
              const firstInitial = staffData.firstname ? staffData.firstname.charAt(0) : '';
              const lastInitial = staffData.lastname ? staffData.lastname.charAt(0) : '';
              (staffData as any).avatarInitials = (firstInitial + lastInitial).toUpperCase();
              const nameHash = this.hashCode(staffData.firstname + staffData.lastname);
              const hue = Math.abs(nameHash % 360);
              (staffData as any).avatarColor = `hsl(${hue}, 70%, 50%)`;
            };
            img.src = avatarPath;
          }
        }
        return staffData;
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: error.message || this.translate.instant('staff.single.errors.fetch_failed')
        });
        return of(null);
      })
    );

    const overview$ = this.academicOverviewService
      .getAcademicOverviewStaffUserId<GetAcademicOverviewResponse>(this.staffId)
      .pipe(
        map((resp) => resp?.data ?? []),
        tap((data) => console.log('overviewData', data)),
        catchError(() => of([] as AcademicOverviewYear[]))
      );

    this.staffData$ = staff$;
    this.academicOverview$ = overview$;
  }

  formatBranches(period: AcademicOverviewPeriod): string {
    const names = (period?.branches ?? [])
      .map((b) => b?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return names.length ? names.join(', ') : '—';
  }

  formatClasses(period: AcademicOverviewPeriod): string {
    const names = (period?.classes ?? [])
      .map((c) => c?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return names.length ? names.join(', ') : '—';
  }

  hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  onJobHistoryRowSelect(data: any) {
    console.log('Selected job history:', data);
  }

  onJobHistoryPageChange(event: any) {
    console.log('Page changed:', event);
  }

  downloadDocument(doc: Document) {
    this.documentService.downloadDocument(doc).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('api_messages.success_title'),
            detail: this.translate.instant('staff.single.documents_download_started', { name: doc.name })
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('api_messages.error_title'),
            detail: this.translate.instant('staff.single.documents_download_failed', { name: doc.name })
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: error.message || this.translate.instant('staff.single.errors.download_failed')
        });
      }
    });
  }

  toggleSubgroup(subgroup: { isExpanded: boolean }) {
    subgroup.isExpanded = !subgroup.isExpanded;
    this.updateAllExpandedState();
  }

  toggleAllSubgroups() {
    this.allExpanded = !this.allExpanded;

    // Loop through all permissions with subgroups
    this.staffData$.subscribe((staffData) => {
      if (staffData?.roles?.[0]?.permissions) {
        staffData.roles[0].permissions.forEach((permission: Permission) => {
          if (permission.subgroups) {
            permission.subgroups.forEach((subgroup) => {
              subgroup.isExpanded = this.allExpanded;
            });
          }
        });
      }
    });
  }

  private updateAllExpandedState() {
    this.staffData$.subscribe((staffData) => {
      if (staffData?.roles?.[0]?.permissions) {
        let allAreExpanded = true;

        staffData.roles[0].permissions.forEach((permission: Permission) => {
          if (permission.subgroups) {
            permission.subgroups.forEach((subgroup) => {
              if (!subgroup.isExpanded) {
                allAreExpanded = false;
              }
            });
          }
        });

        this.allExpanded = allAreExpanded;
      }
    });
  }

  onEdit() {
    this.staffData$.subscribe((staffData) => {
      if (staffData?.id) {
        this.router.navigate(['/dashboard/staff/edit', staffData.id]);
      }
    });
  }

  onDeleteConfirm(confirmed: boolean) {
    if (confirmed) {
      this.deleteStaff();
      this.router.navigate(['/dashboard/staff']);
    }
  }

  deleteStaff() {
    if (!this.staffId || this.isDeleting) return;

    this.usersService.deleteUsersStaffId(this.staffId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('api_messages.success_title'),
          detail: this.translate.instant('staff.single.deleted')
        });
      },
      error: (error) => {
        this.isDeleting = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: error.message || this.translate.instant('staff.single.errors.delete_failed')
        });
      }
    });
  }

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length) {
      this.uploadFile = event.target.files[0];
      this.uploadFileName = this.uploadFile?.name || '';
    }
  }

  uploadDocument() {
    if (!this.uploadFile || !this.staffId) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('api_messages.error_title'),
        detail: this.translate.instant('staff.single.errors.select_file')
      });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 25;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 15;
      }
    }, 300);

    if (this.staffId) {
      this.documentService.uploadUserDocument(this.staffId, this.uploadFile).subscribe({
        next: (doc: Document) => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;

          // Add to documents list
          this.documents.unshift(doc);

          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('api_messages.success_title'),
            detail: this.translate.instant('staff.single.document_uploaded')
          });

          this.uploadDialogVisible = false;
          this.isUploading = false;
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isUploading = false;

          console.error('Upload error:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('api_messages.error_title'),
            detail: error.message || this.translate.instant('staff.single.errors.upload_failed')
          });

          // For demo purposes, simulate success even when API fails
          this.uploadProgress = 100;

          // Create a mock document
          const mockDoc: Document = {
            id: Math.random().toString(36).substring(2, 15),
            name: this.uploadFile!.name,
            type: this.uploadFile!.type,
            path: '/assets/documents/' + this.uploadFile!.name,
            upload_date: new Date().toISOString(),
            size: this.uploadFile!.size
          };

          // Add to documents list
          this.documents.unshift(mockDoc);

          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('api_messages.success_title'),
            detail: this.translate.instant('staff.single.document_uploaded_mock')
          });

          this.uploadDialogVisible = false;
        }
      });
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  isCustomerDetailsArray(details: any): boolean {
    return Array.isArray(details);
  }
}
