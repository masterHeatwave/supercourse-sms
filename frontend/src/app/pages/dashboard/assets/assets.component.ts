import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, map, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { GetInventory200, Inventory } from '@gen-api/schemas';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, ToastModule, TranslateModule, InputTextModule, FormsModule, CardModule, TooltipModule, PaginatorModule],
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class AssetsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);

  inventoryService = inject(InventoryService);

  items: (Inventory & { billing_person?: string })[] = [];
  allItems: (Inventory & { billing_person?: string })[] = [];
  filteredItems: (Inventory & { billing_person?: string })[] = [];
  totalRecords = 0;
  isLoading = false;

  private reloadSubject = new BehaviorSubject<void>(undefined);
  private searchSubject = new Subject<string>();
  private searchSubscription: any;
  currentPage = 1;
  rowsPerPage = 10;
  searchTerm = '';

  // View options
  viewModes = [
    { icon: 'pi pi-th-large', value: 'grid' },
    { icon: 'pi pi-list', value: 'list' }
  ];

  currentViewMode = 'list';

  tableColumns = [
    { field: 'code', header: 'inventory.table.code', filterType: 'text', sortable: true },
    { field: 'billing_date', header: 'inventory.table.billingDate', type: 'date', filterType: 'date', sortable: true, getValue: (rowData: any) => this.formatDate(rowData.billing_date) },
    { field: 'return_date', header: 'inventory.table.returnDate', type: 'date', filterType: 'date', sortable: true, getValue: (rowData: any) => this.formatDate(rowData.return_date) },
    { field: 'billing_person', header: 'inventory.table.billingPerson', filterType: 'text', sortable: true, priority: 1 },
    { field: 'title', header: 'inventory.table.assetTitle', filterType: 'text', sortable: true }
  ];

  items$ = this.reloadSubject.pipe(
    tap(() => (this.isLoading = true)),
    switchMap(() =>
      this.inventoryService.getInventory(
        undefined,
        { params: { page: '1', limit: '1000', item_type: 'ASSET' } as any }
      )
    ),
    map((response: GetInventory200) => {
      const data = response.data || [];
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
      this.allItems = items;
      this.applyFilter();
    })
  );

  ngOnInit(): void {
    this.items$.subscribe();
    
    // Set up instant search with debounce (client-side filtering)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
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
    this.router.navigate(['/dashboard/assets/create']);
  }

  onRowSelect(item: Inventory) {
    if (!item?.id) return;
    this.router.navigate(['/dashboard/assets', item.id]);
  }

  onEdit(item: Inventory) {
    if (!item?.id) return;
    this.router.navigate(['/dashboard/assets/edit', item.id]);
  }

  onDelete(item: Inventory) {
    if (!item?.id) return;

    this.confirmationService.confirm({
      message: this.translate.instant('assets.confirm_delete.message', { name: item.title }),
      header: this.translate.instant('assets.confirm_delete.header'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventoryService.deleteInventoryId(item.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('api_messages.success_title'),
              detail: this.translate.instant('assets.messages.deleted')
            });
            this.reloadSubject.next();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('api_messages.error_title'),
              detail: error?.error?.message || this.translate.instant('assets.errors.delete_failed')
            });
          }
        });
      }
    });
  }

  onPageChange(event: any) {
    // Handle both PrimeNG paginator and PrimaryTable
    if (event.first !== undefined) {
      // From PrimeNG paginator (event.first is 0-indexed)
      this.currentPage = event.page !== undefined ? event.page + 1 : Math.floor(event.first / this.rowsPerPage) + 1;
      this.rowsPerPage = event.rows ?? this.rowsPerPage;
    } else {
      // From PrimaryTable (event.page is 0-indexed)
      this.currentPage = (event?.page ?? 0) + 1;
      this.rowsPerPage = event?.rows ?? this.rowsPerPage;
    }
    this.updatePaginatedItems();
  }

  onRowsPerPageChange(rows: number) {
    this.rowsPerPage = rows || this.rowsPerPage;
    this.currentPage = 1;
    this.updatePaginatedItems();
  }

  private applyFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredItems = [...this.allItems];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredItems = this.allItems.filter(item => {
        const title = (item.title || '').toLowerCase();
        const code = (item.code || '').toLowerCase();
        const billingPerson = (item.billing_person || '').toLowerCase();
        return title.includes(searchLower) || 
               code.includes(searchLower) || 
               billingPerson.includes(searchLower);
      });
    }
    
    this.totalRecords = this.filteredItems.length;
    this.updatePaginatedItems();
  }

  private updatePaginatedItems(): void {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    // Create new array reference to trigger change detection
    this.items = [...this.filteredItems.slice(startIndex, endIndex)];
  }

  onSearchInput(event?: any) {
    // Get the value from the event if available, otherwise use searchTerm
    const value = event?.target?.value ?? this.searchTerm;
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilter();
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

  setViewMode(mode: string) {
    this.currentViewMode = mode;
  }
}

