import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { OutlineButtonComponent } from '../../buttons/outline-button/outline-button.component';

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
    OutlineButtonComponent
  ],
  templateUrl: './student-id-modal.component.html',
  styleUrl: './student-id-modal.component.scss'
})
export class StudentIdModalComponent {
  @Input() visible: boolean = false;
  @Input() studentProfile: StudentProfile | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @ViewChild('printArea', { static: false }) printArea!: ElementRef;

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
            .qr-placeholder {
              width: 60px;
              height: 60px;
              border: 2px solid #333;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 1px;
              width: 50px;
              height: 50px;
            }
            .qr-cell {
              background: white;
              border: 1px solid #ddd;
            }
            .qr-cell.qr-filled {
              background: #333;
            }
            .logo-shield {
              width: 80px;
              height: 80px;
              background: #2196F3;
              border: 3px solid white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-symbols {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 2px;
              margin-bottom: 4px;
            }
            .symbol {
              font-size: 0.8rem;
              line-height: 1;
            }
            .logo-year {
              color: white;
              font-weight: bold;
              font-size: 0.8rem;
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
            .qr-placeholder {
              width: 60px;
              height: 60px;
              border: 2px solid #333;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 1px;
              width: 50px;
              height: 50px;
            }
            .qr-cell {
              background: white;
              border: 1px solid #ddd;
            }
            .qr-cell.qr-filled {
              background: #333;
            }
            .logo-shield {
              width: 80px;
              height: 80px;
              background: #2196F3;
              border: 3px solid white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-symbols {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 2px;
              margin-bottom: 4px;
            }
            .symbol {
              font-size: 0.8rem;
              line-height: 1;
            }
            .logo-year {
              color: white;
              font-weight: bold;
              font-size: 0.8rem;
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

  getSchoolName(): string {
    if (!this.studentProfile?.branchDescription || this.studentProfile.branchDescription.length === 0) {
      return 'Lexis English School';
    }
    return this.studentProfile.branchDescription[0].name || 'Lexis English School';
  }

  getGrade(): string {
    // You can customize this based on your grade system
    // For now, we'll use a simple mapping based on age
    if (!this.studentProfile) return 'Grade 10';
    
    const age = this.studentProfile.age.years;
    if (age >= 18) return 'Grade 12';
    if (age >= 17) return 'Grade 11';
    if (age >= 16) return 'Grade 10';
    if (age >= 15) return 'Grade 9';
    if (age >= 14) return 'Grade 8';
    if (age >= 13) return 'Grade 7';
    if (age >= 12) return 'Grade 6';
    return 'Grade 5';
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
