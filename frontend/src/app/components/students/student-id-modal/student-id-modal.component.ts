import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OutlineButtonComponent } from '../../buttons/outline-button/outline-button.component';
import { QRCodeModule } from 'angularx-qrcode';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';

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
    logoUrl?: string;
    logo?: string;
    avatarUrl?: string;
  }[];
  customerAvatarUrl?: string;
  customerName?: string;
  customerEmail?: string;
  taxiSubjects: {
    name: string;
    subject: string;
  }[];
  status: string;
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
  documents?: any[];
}

@Component({
  selector: 'app-student-id-modal',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    AvatarModule,
    OutlineButtonComponent,
    QRCodeModule,
    TranslateModule
  ],
  templateUrl: './student-id-modal.component.html',
  styleUrl: './student-id-modal.component.scss'
})
export class StudentIdModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() studentProfile: StudentProfile | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @ViewChild('printArea', { static: false }) printArea!: ElementRef;

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentProfile'] && this.studentProfile) {
      console.log('Student ID modal profile data:', this.studentProfile);
    }
  }

  onHide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onPrintId() {
    // Print only the student ID card
    if (!this.studentProfile) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get the print area content
    const printContent = this.printArea.nativeElement.innerHTML;
    
    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card - ${this.studentProfile.name}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .student-id-card-print {
              width: 100%;
              max-width: 500px;
              margin: 0 auto;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .id-card-top {
              background: linear-gradient(135deg, #FFD700, #FFA500);
              padding: 20px;
              text-align: center;
            }
            .school-banner {
              background: #6A4C93;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              margin-bottom: 8px;
              display: inline-block;
            }
            .school-name {
              font-weight: bold;
              font-size: 1.1rem;
              letter-spacing: 0.5px;
            }
            .student-address {
              color: #333;
              font-size: 0.9rem;
              font-weight: 500;
            }
            .student-address {
              color: #333;
              font-size: 0.9rem;
              font-weight: 500;
            }
            .parent-info {
              margin-top: 8px;
              color: #fff;
            }
            .parent-info .parent-label {
              font-size: 0.75rem;
              text-transform: uppercase;
              opacity: 0.9;
            }
            .parent-info .parent-value {
              font-weight: 600;
            }
            .parent-info .parent-email {
              font-size: 0.75rem;
              opacity: 0.9;
            }
            .id-card-middle {
              background: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              min-height: 200px;
            }
            .id-card-left, .id-card-right {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .id-card-center {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .customer-avatar {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            .customer-name {
              font-weight: 600;
              color: #333;
              text-align: center;
            }
            .grade {
              font-weight: bold;
              font-size: 1.1rem;
              color: #333;
            }
            .contact-label {
              font-size: 0.8rem;
              color: #666;
              font-weight: 500;
            }
            .contact-value {
              font-size: 0.9rem;
              color: #333;
              font-weight: 600;
            }
            .qr-code {
              margin-top: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .year-label {
              font-weight: bold;
              font-size: 1rem;
              color: #333;
            }
            .dob-label {
              font-size: 0.7rem;
              color: #666;
              font-weight: 500;
            }
            .dob-value {
              font-size: 0.8rem;
              color: #333;
              font-weight: 600;
            }
            .id-card-bottom {
              background: #6A4C93;
              color: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .name-text {
              font-weight: bold;
              font-size: 1.3rem;
              letter-spacing: 1px;
            }
            .expiry-label {
              font-size: 0.8rem;
              opacity: 0.9;
              margin-right: 4px;
            }
            .expiry-value {
              font-size: 0.9rem;
              font-weight: 600;
            }
            @media print {
              body { margin: 0; }
              .student-id-card-print { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;
    
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  onDownload() {
    // Download the student ID card as PDF
    if (!this.studentProfile) return;
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get the print area content
    const printContent = this.printArea.nativeElement.innerHTML;
    
    // Create the document for PDF generation
    const pdfDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card - ${this.studentProfile.name}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
              background: white;
            }
            .student-id-card-print {
              width: 100%;
              max-width: 500px;
              margin: 0 auto;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .id-card-top {
              background: linear-gradient(135deg, #FFD700, #FFA500);
              padding: 20px;
              text-align: center;
            }
            .school-banner {
              background: #6A4C93;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              margin-bottom: 8px;
              display: inline-block;
            }
            .school-name {
              font-weight: bold;
              font-size: 1.1rem;
              letter-spacing: 0.5px;
            }
            .student-address {
              color: #333;
              font-size: 0.9rem;
              font-weight: 500;
            }
            .id-card-middle {
              background: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              min-height: 200px;
            }
            .id-card-left, .id-card-right {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .id-card-center {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .customer-avatar {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            .customer-name {
              font-weight: 600;
              color: #333;
              text-align: center;
            }
            .grade {
              font-weight: bold;
              font-size: 1.1rem;
              color: #333;
            }
            .contact-label {
              font-size: 0.8rem;
              color: #666;
              font-weight: 500;
            }
            .contact-value {
              font-size: 0.9rem;
              color: #333;
              font-weight: 600;
            }
            .qr-code {
              margin-top: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .year-label {
              font-weight: bold;
              font-size: 1rem;
              color: #333;
            }
            .dob-label {
              font-size: 0.7rem;
              color: #666;
              font-weight: 500;
            }
            .dob-value {
              font-size: 0.8rem;
              color: #333;
              font-weight: 600;
            }
            .id-card-bottom {
              background: #6A4C93;
              color: white;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .name-text {
              font-weight: bold;
              font-size: 1.3rem;
              letter-spacing: 1px;
            }
            .expiry-label {
              font-size: 0.8rem;
              opacity: 0.9;
              margin-right: 4px;
            }
            .expiry-value {
              font-size: 0.9rem;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;
    
    printWindow.document.write(pdfDocument);
    printWindow.document.close();
    
    // Wait for content to load then trigger PDF download
    printWindow.onload = () => {
      // Use browser's print to PDF functionality
      printWindow.print();
      
      // Close the window after a short delay
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  }

  getStudentAddress(): string {
    if (!this.studentProfile) {
      return 'School Address';
    }
    
    // Use the student's actual address
    const address = this.studentProfile.address;
    const addressParts = [];
    
    if (address.street) addressParts.push(address.street);
    if (address.city) addressParts.push(address.city);
    if (address.postalCode) addressParts.push(address.postalCode);
    if (address.country) addressParts.push(address.country);
    
    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }
    
    // Fallback to school address if no student address
    if (this.studentProfile.branchDescription && this.studentProfile.branchDescription.length > 0) {
      return 'School Address';
    }
    
    return 'Address not available';
  }

  getBranchName(): string {
    if (this.studentProfile?.branchDescription && this.studentProfile.branchDescription.length > 0) {
      return this.studentProfile.branchDescription[0].name || 'Lexis English School';
    }
    return this.studentProfile?.customerName || 'Lexis English School';
  }

  getCustomerName(): string {
    if (this.studentProfile?.customerName) {
      return this.studentProfile.customerName;
    }
    return this.getBranchName();
  }

  getClasses(): string {
    if (!this.studentProfile || !this.studentProfile.taxiSubjects || this.studentProfile.taxiSubjects.length === 0) {
      return 'No Classes';
    }
    
    // Get unique class names from taxiSubjects
    const classNames = this.studentProfile.taxiSubjects
      .map(taxi => taxi.name)
      .filter((name, index, self) => name && self.indexOf(name) === index); // Remove duplicates
    
    if (classNames.length === 0) {
      return 'No Classes';
    }
    
    return classNames.join(', ');
  }

  getCustomerAvatarUrl(): string | undefined {
    if (this.studentProfile?.customerAvatarUrl) {
      return this.studentProfile.customerAvatarUrl;
    }
    if (!this.studentProfile?.branchDescription || this.studentProfile.branchDescription.length === 0) {
      return undefined;
    }
    const branch = this.studentProfile.branchDescription[0];
    return branch.logoUrl || branch.logo || branch.avatarUrl || undefined;
  }

  getCustomerAvatarInitials(): string {
    const name = this.studentProfile?.customerName || this.getBranchName();
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getCustomerAvatarColor(): string {
    const colors = ['#6A4C93', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];
    const name = this.getCustomerName();
    const index =
      name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getQrValue(): string {
    if (!this.studentProfile) {
      return '';
    }
    const origin = typeof window !== 'undefined' && window?.location ? window.location.origin : 'http://localhost:4200';
    return `${origin}/dashboard/students/${this.studentProfile.id}`;
  }

  getAcademicYear(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear}/${currentYear + 1}`;
  }

  getExpiryDate(): string {
    const currentDate = new Date();
    const expiryDate = new Date(currentDate.getFullYear(), 5, 16); // June 16th of current year
    return expiryDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
