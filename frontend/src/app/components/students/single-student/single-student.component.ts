import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../gen-api/users/users.service';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

import { OutlineButtonComponent } from '../../buttons/outline-button/outline-button.component';
import { HistoryTableComponent } from '../history-table/history-table.component';
import { BooksTableComponent } from '../books-table/books-table.component';
import { ProgressTableComponent } from '../progress-table/progress-table.component';
import { DocumentsTableComponent } from '../documents-table/documents-table.component';
import { StudentIdModalComponent } from '../student-id-modal';
import { IDocument } from '../../../interfaces/student.interface';

interface StudentProfile {
  id: string;
  name: string;
  role: string;
  avatar?: boolean;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarColor?: string;
  branchDescription: {
    name: string;
    code: string;
    language: string;
  }[];
  taxiSubjects: {
    name: string;
    subject: string;
  }[];
  status: string;
  isActive: boolean;
  code: string;
  email: string;
  age: {
    years: number;
    dob: string;
  };
  mobile: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  lastUpdated: {
    date: string;
    by: string;
  };
  registered: {
    date: string;
    by: string;
  };
  linkedContacts: {
    name: string;
    relation: string;
    isPrimary: boolean;
  }[];
  siblingAttending: string[];
  healthInfo: string;
  generalNotes: string;
  documents?: (IDocument | string)[];
}

@Component({
  selector: 'app-single-student',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    TagModule,
    OutlineButtonComponent,
    TabViewModule,
    HistoryTableComponent,
    BooksTableComponent,
    ProgressTableComponent,
    DocumentsTableComponent,
    StudentIdModalComponent,
    ToastModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './single-student.component.html',
  styleUrl: './single-student.component.scss',
  providers: [MessageService]
})
export class SingleStudentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  loading = true;
  studentProfile: StudentProfile | null = null;
  studentHistoryData: any[] = [];
  studentBooksData: any[] = [];
  studentProgressData: any[] = [];
  studentDocumentsData: (IDocument | string)[] = [];
  showStudentIdModal = false;

  ngOnInit() {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('api_messages.error_title'),
        detail: this.translate.instant('students.errors.no_id')
      });
      this.router.navigate(['/dashboard/students']);
      return;
    }

    this.loadStudentData(studentId);
  }

  private loadStudentData(studentId: string) {
    this.loading = true;
    this.usersService
      .getUsersStudentsId(studentId)
      .pipe(
        map((response) => response.data),
        map((data) => this.mapApiResponseToStudentProfile(data)),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('api_messages.error_title'),
            detail: error.message || this.translate.instant('students.errors.fetch_failed')
          });
          this.router.navigate(['/dashboard/students']);
          return of(null);
        })
      )
      .subscribe({
        next: (profile) => {
          this.studentProfile = profile;
          // Process documents data for the documents table
          this.studentDocumentsData = this.processDocumentsData(profile ? profile.documents || [] : []);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private processDocumentsData(documents: (IDocument | string)[]): (IDocument | string)[] {
    if (!documents || !Array.isArray(documents)) {
      return [];
    }

    return documents.map((doc) => {
      if (typeof doc === 'string') {
        // If document is just a path string, return as is
        return doc;
      } else {
        // If document is an IDocument object, ensure it has proper structure
        return {
          id: doc.id,
          name: doc.name,
          url: doc.url,
          size: doc.size,
          type: doc.type || this.getFileType(doc.name),
          path: doc.path,
          uploadDate: doc.uploadDate
        } as IDocument;
      }
    });
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Document';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint Document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'Image';
      case 'txt':
        return 'Text File';
      case 'zip':
      case 'rar':
      case '7z':
        return 'Archive';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'Video';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'Audio';
      default:
        return 'Document';
    }
  }

  private mapApiResponseToStudentProfile(data: any): StudentProfile {
    // Calculate age from birthday
    const dob = new Date(data.birthday);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const years = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

    // Generate initials from first and last name
    const initials = `${data.firstname?.[0] || ''}${data.lastname?.[0] || ''}`;

    // Generate a consistent color based on the name
    const nameForColor = `${data.firstname}${data.lastname}`;
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green
      '#9C27B0', // Purple
      '#F44336', // Red
      '#FF9800', // Orange
      '#795548', // Brown
      '#607D8B' // Blue Grey
    ];
    const colorIndex = nameForColor.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const avatarColor = colors[colorIndex];

    return {
      id: data._id,
      name: `${data.firstname} ${data.lastname}`,
      role: data.user_type || 'Student',
      avatar: !!data.avatar,
      avatarUrl: data.avatar ? `${environment.assetUrl}/${data.avatar}` : undefined,
      avatarInitials: initials,
      avatarColor: avatarColor,
      branchDescription: this.getBranchDescription(data),
      taxiSubjects: this.getTaxiSubjects(data),
      isActive: !!data.is_active,
      status: data.is_active ? 'Active' : 'Inactive',
      code: data.code || '',
      email: data.email,
      age: {
        years,
        dob: new Date(data.birthday).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      },
      mobile: data.mobile || '',
      address: {
        street: data.address || '',
        city: data.city || '',
        postalCode: data.zipcode || '',
        country: data.country || ''
      },
      lastUpdated: {
        date: new Date(data.updatedAt)
          .toLocaleString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          .replace(',', ' |'),
        by: data.updatedBy || ''
      },
      registered: {
        date: new Date(data.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        by: data.createdBy || ''
      },
      linkedContacts: data.contacts
        ? data.contacts.map((contact: any) => ({
            name: contact.name || '',
            relation: contact.relationship || '',
            isPrimary: contact.isPrimaryContact || false
          }))
        : [],
      siblingAttending: data.siblingAttending || [],
      healthInfo: data.healthDetails || data.notes || '',
      generalNotes: data.generalNotes || data.notes || 'No notes available',
      documents: data.documents || []
    };
  }

  private getBranchDescription(data: any): any[] {
    const branches = [];

    // First, check if branches array has populated data
    if (data.branches && Array.isArray(data.branches) && data.branches.length > 0) {
      for (const branch of data.branches) {
        if (typeof branch === 'object' && branch.name) {
          branches.push({
            name: branch.name,
            code: branch.code || '',
            language: branch.language || ''
          });
        }
      }
    }

    // If no branches found, check customers field (which might be the actual branch field)
    if (branches.length === 0 && data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
      console.log('Checking customers field for branch data');
      for (const customer of data.customers) {
        if (typeof customer === 'object' && customer.name) {
          console.log('Adding customer as branch:', customer.name);
          branches.push({
            name: customer.name,
            code: customer.code || '',
            language: customer.language || ''
          });
        }
      }
    }

    // If still no branches found and we have a default_branch, use that
    if (branches.length === 0 && data.default_branch) {
      console.log('Checking default_branch:', data.default_branch);
      if (typeof data.default_branch === 'object' && data.default_branch.name) {
        console.log('Adding default_branch to branches:', data.default_branch.name);
        branches.push({
          name: data.default_branch.name,
          code: data.default_branch.code || '',
          language: data.default_branch.language || ''
        });
      }
    }

    return branches;
  }

  private getTaxiSubjects(data: any): any[] {
    const taxiSubjects = [];

    // Check if taxis array has data
    if (data.taxis && Array.isArray(data.taxis) && data.taxis.length > 0) {
      for (const taxi of data.taxis) {
        if (typeof taxi === 'object' && taxi.name && taxi.subject) {
          taxiSubjects.push({
            name: taxi.name,
            subject: this.mapSubjectToCode(taxi.subject)
          });
        }
      }
    }

    return taxiSubjects;
  }

  private mapSubjectToCode(subject: string): string {
    const subjectMapping: { [key: string]: string } = {
      english: 'ENG',
      french: 'FRA',
      spanish: 'ESP',
      italian: 'ITA',
      italy: 'ITA',
      german: 'DEU',
      portuguese: 'POR',
      russian: 'RUS',
      arabic: 'ARAB',
      chinese: 'CHI',
      japanese: 'JAP'
    };

    const normalizedSubject = subject.toLowerCase().trim();
    return subjectMapping[normalizedSubject] || subject.toUpperCase();
  }
  onEditStudent() {
    if (this.studentProfile) {
      this.router.navigate(['/dashboard/students/edit', this.studentProfile.id]);
    }
  }

  onShowStudentId() {
    this.showStudentIdModal = true;
  }

  onDocumentDeleted(deletedDocument: IDocument | string) {
    // Remove the deleted document from the local data array
    this.studentDocumentsData = this.studentDocumentsData.filter((doc) => {
      if (typeof doc === 'string' && typeof deletedDocument === 'string') {
        return doc !== deletedDocument;
      } else if (typeof doc === 'object' && typeof deletedDocument === 'object') {
        return (doc as IDocument).id !== (deletedDocument as IDocument).id;
      }
      return true;
    });

    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('api_messages.success_title'),
      detail: this.translate.instant('students.messages.document_deleted')
    });
  }

  getSiblingsDisplay(siblings: string[]): string {
    if (!siblings || siblings.length === 0) {
      return this.translate.instant('students.table.none');
    }
    return siblings.join(', ');
  }
}
