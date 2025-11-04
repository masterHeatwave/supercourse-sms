import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { GetInventory200, Inventory } from '@gen-api/schemas';

@Component({
  selector: 'app-elibrary',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, ToastModule, TranslateModule, InputTextModule, FormsModule],
  templateUrl: './elibrary.component.html',
  styleUrls: ['./elibrary.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ElibraryComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);

  inventoryService = inject(InventoryService);

  items: (Inventory & { billing_person?: string })[] = [];
  totalRecords = 0;
  isLoading = false;

  private reloadSubject = new BehaviorSubject<void>(undefined);
  currentPage = 1;
  rowsPerPage = 10;
  searchTerm = '';

  tableColumns = [
    { field: 'code', header: 'inventory.table.code', filterType: 'text', sortable: true },
    { field: 'title', header: 'inventory.table.title', filterType: 'text', sortable: true },
    { field: 'billing_person', header: 'inventory.table.billingPerson', filterType: 'text', sortable: true, priority: 1 },
    { field: 'billing_date', header: 'inventory.table.billingDate', type: 'date', filterType: 'date', sortable: true, getValue: (rowData: any) => this.formatDate(rowData.billing_date) },
    { field: 'return_date', header: 'inventory.table.returnDate', type: 'date', filterType: 'date', sortable: true, getValue: (rowData: any) => this.formatDate(rowData.return_date) }
  ];

  items$ = this.reloadSubject.pipe(
    tap(() => (this.isLoading = true)),
    switchMap(() =>
      this.inventoryService.getInventory(
        undefined,
        { params: { page: this.currentPage, limit: this.rowsPerPage, search: this.searchTerm || undefined, item_type: 'ELIBRARY' } as any }
      )
    ),
    map((response: GetInventory200) => {
      const data = response.data || [];
      this.totalRecords = (response.count as number) || data.length;
      return data;
    }),
    map((items) => {
      // Map inventory items with user details (user data is already available in InventoryUser)
      return items.map(item => ({
        ...item,
        billing_person: this.getBillingPersonNameFromUser(item.user)
      }));
    }),
    tap((items) => {
      this.isLoading = false;
      this.items = items;
    })
  );

  ngOnInit(): void {
    this.items$.subscribe();
  }

  private getBillingPersonNameFromUser(user: any): string {
    if (!user) {
      return '-';
    }
    
    // Handle the actual API response structure
    return (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : '') ||
           user.username ||
           user.code ||
           user.id ||
           '-';
  }

  private getBillingPersonName(item: any): string {
    // Try different possible user name fields
    if (item?.user) {
      return item.user.name || 
             item.user.full_name || 
             (item.user.first_name && item.user.last_name ? `${item.user.first_name} ${item.user.last_name}` : '') ||
             (item.user.firstname && item.user.lastname ? `${item.user.firstname} ${item.user.lastname}` : '') ||
             item.user.username ||
             item.user.code ||
             item.user.id ||
             '-';
    }
    
    // Fallback to customer name if no user
    if (item?.customer) {
      return item.customer.name || item.customer.id || '-';
    }
    
    return '-';
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/elibrary/create']);
  }

  onRowSelect(item: Inventory) {
    if (!item?.id) return;
    this.router.navigate(['/dashboard/elibrary', item.id]);
  }

  onEdit(item: Inventory) {
    if (!item?.id) return;
    this.router.navigate(['/dashboard/elibrary/edit', item.id]);
  }

  onDelete(item: Inventory) {
    if (!item?.id) return;

    this.confirmationService.confirm({
      message: this.translate.instant('eLibrary.confirm_delete.message', { name: item.title }),
      header: this.translate.instant('eLibrary.confirm_delete.header'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventoryService.deleteInventoryId(item.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('api_messages.success_title'),
              detail: this.translate.instant('eLibrary.messages.deleted')
            });
            this.reloadSubject.next();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('api_messages.error_title'),
              detail: error?.error?.message || this.translate.instant('eLibrary.errors.delete_failed')
            });
          }
        });
      }
    });
  }

  // PrimaryTable pagination hooks
  onPageChange(event: { page: number; rows: number }) {
    // Assuming PrimeNG paginator is 0-indexed for page
    this.currentPage = (event?.page ?? 0) + 1;
    this.rowsPerPage = event?.rows ?? this.rowsPerPage;
    this.reloadSubject.next();
  }

  onRowsPerPageChange(rows: number) {
    this.rowsPerPage = rows || this.rowsPerPage;
    this.currentPage = 1;
    this.reloadSubject.next();
  }

  onSearch() {
    this.currentPage = 1;
    this.reloadSubject.next();
  }

  getBillingPersonOptions(): string[] {
    // Get unique billing person names for filtering
    const uniqueNames = [...new Set(this.items.map(item => item.billing_person).filter((name): name is string => name !== undefined && name !== '-'))];
    return uniqueNames.sort();
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }
}
