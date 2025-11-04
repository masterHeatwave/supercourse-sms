import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CustomerService } from '@services/customer.service';
import { EditSchoolDialogComponent } from './edit-school-dialog/edit-school-dialog.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { Customer } from '@gen-api/schemas/customer';
import { catchError, of } from 'rxjs';

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
  imports: [CommonModule, ButtonModule, ToastModule, EditSchoolDialogComponent, OutlineButtonComponent],
  templateUrl: './school-info.component.html',
  styleUrl: './school-info.component.scss',
  providers: [MessageService]
})
export class SchoolInfoComponent implements OnInit {
  schoolInfo: SchoolInfo = {
    name: 'Loading...',
    description: 'Loading school information...',
    heroImage: 'assets/images/school-hero.jpg'
  };
  loading = true;
  error = false;
  showEditDialog = false;
  customerData: Customer | null = null;

  @ViewChild('editDialog') editDialog!: EditSchoolDialogComponent;

  constructor(private customerService: CustomerService, private messageService: MessageService) {}

  ngOnInit() {
    this.loadMainCustomer();
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

  onEdit() {
    if (this.customerData) {
      this.showEditDialog = true;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'School information not loaded. Please refresh the page and try again.'
      });
    }
  }

  onSchoolUpdated(updateData: any) {
    // Set loading state on the dialog
    if (this.editDialog) {
      this.editDialog.setLoading(true);
    }

    this.customerService
      .updateMainCustomer(updateData)
      .pipe(
        catchError((error) => {
          console.error('Error updating school information:', error);
          let errorMessage = 'Failed to update school information. Please try again.';

          if (error.status === 403) {
            errorMessage = 'You do not have permission to update school information. Please contact an administrator.';
          } else if (error.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: errorMessage
          });

          // Reset loading state on error
          if (this.editDialog) {
            this.editDialog.setLoading(false);
          }

          return of(null);
        })
      )
      .subscribe((response) => {
        // Reset loading state
        if (this.editDialog) {
          this.editDialog.setLoading(false);
        }

        if (response?.data) {
          // Update the local data
          this.customerData = response.data;
          this.schoolInfo = {
            name: response.data.name || 'School Name',
            description: response.data.description || 'No description available for this school.',
            heroImage: response.data.avatar || 'assets/images/school-hero.jpg',
            avatar: response.data.avatar,
            website: response.data.website,
            email: response.data.email,
            phone: response.data.phone,
            address: response.data.address
          };

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'School information updated successfully!'
          });

          this.showEditDialog = false;
        }
      });
  }

  onDialogHide() {
    this.showEditDialog = false;
  }

  onRetry() {
    this.loadMainCustomer();
  }
}
