import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';

/**
 * Reusable component for displaying inventory item details (assets/books)
 * Supports both asset and elibrary contexts with proper formatting
 */
@Component({
  selector: 'app-inventory-details',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TranslateModule, SpinnerComponent, OutlineButtonComponent],
  templateUrl: './inventory-details.component.html'
})
export class InventoryDetailsComponent {
  @Input() item: any = null;
  @Input() isLoading = false;
  @Input() showActions = true;
  @Input() context: 'asset' | 'elibrary' = 'asset';
  
  @Output() back = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  get itemTypeLabel(): string {
    return this.context === 'elibrary' ? 'Book' : 'Asset';
  }

  get noDataMessageKey(): string {
    return this.context === 'elibrary' ? 'eLibrary.messages.no_data' : 'inventory.messages.no_data';
  }

  getBillingPersonName(user: any): string {
    console.log('getBillingPersonName called with:', { user, item: this.item });
    
    if (!user) {
      // For elibrary items, show customer name when user is null
      if (this.item?.item_type === 'ELIBRARY' && this.item?.customer?.name) {
        console.log('Returning customer name for elibrary:', this.item.customer.name);
        return this.item.customer.name;
      }
      // For assets, show "No user assigned" when user is null
      if (this.item?.item_type === 'ASSET') {
        return 'No user assigned';
      }
      return '-';
    }
    
    // Handle different possible user name formats
    const userName = (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : '') ||
           user.name ||
           user.full_name ||
           (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
           user.username ||
           user.code ||
           '-';
    
    console.log('Returning user name:', userName);
    return userName;
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Elibrary specific methods
  formatTags(tags: string[] | null | undefined): string {
    if (!tags || tags.length === 0) return '-';
    return tags.join(', ');
  }

  formatUrl(url: string | null | undefined): string {
    if (!url) return '-';
    return url;
  }

  getHeaderTitle(): string {
    // Auto-detect context based on item_type if not explicitly set
    const actualContext = this.item?.item_type === 'ELIBRARY' ? 'elibrary' : this.context;
    
    if (actualContext === 'elibrary') {
      return this.item?.title || 'Book';
    }
    return (this.item?.title || 'Asset') + ' (' + (this.item?.code || '-') + ')';
  }

  getSectionTitle(section: string): string {
    // Auto-detect context based on item_type if not explicitly set
    const actualContext = this.item?.item_type === 'ELIBRARY' ? 'elibrary' : this.context;
    
    const sections: Record<string, Record<string, string>> = {
      asset: {
        section2: 'Dates',
        section3: 'Notes'
      },
      elibrary: {
        section2: 'Dates',
        section3: 'Notes'
      }
    };
    return sections[actualContext]?.[section] || 'Section';
  }

  getFieldLabel(field: string): string {
    // Auto-detect context based on item_type if not explicitly set
    const actualContext = this.item?.item_type === 'ELIBRARY' ? 'elibrary' : this.context;
    
    const labels: Record<string, Record<string, string>> = {
      asset: {
        field1: 'inventory.fields.billingPerson',
        field2: 'inventory.table.title',
        field3: 'inventory.fields.billingDate',
        field4: 'inventory.fields.returnDate',
        field5: 'inventory.fields.notes',
        field6: '',
        field7: ''
      },
      elibrary: {
        field1: 'inventory.fields.billingPerson',
        field2: 'inventory.table.title',
        field3: 'inventory.fields.billingDate',
        field4: 'inventory.fields.returnDate',
        field5: 'inventory.fields.notes',
        field6: '',
        field7: ''
      }
    };
    return labels[actualContext]?.[field] || '';
  }

  getFieldValue(field: string): string {
    // Auto-detect context based on item_type if not explicitly set
    const actualContext = this.item?.item_type === 'ELIBRARY' ? 'elibrary' : this.context;
    
    const values: Record<string, Record<string, string>> = {
      asset: {
        field1: this.getBillingPersonName(this.item?.user),
        field2: this.item?.title || '-',
        field3: this.formatDate(this.item?.billing_date),
        field4: this.formatDate(this.item?.return_date),
        field5: this.item?.notes || '-',
        field6: '-',
        field7: '-'
      },
      elibrary: {
        field1: this.getBillingPersonName(this.item?.user),
        field2: this.item?.title || '-',
        field3: this.formatDate(this.item?.billing_date),
        field4: this.formatDate(this.item?.return_date),
        field5: this.item?.notes || '-',
        field6: '-',
        field7: '-'
      }
    };
    return values[actualContext]?.[field] || '-';
  }

  onBack() {
    this.back.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  onDelete() {
    this.delete.emit();
  }
}
