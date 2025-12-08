import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';
import { InventoryService } from '../../../gen-api/inventory/inventory.service';
import { Inventory, GetInventory200 } from '../../../gen-api/schemas';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-books-table',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent
  ],
  templateUrl: './books-table.component.html',
  styleUrl: './books-table.component.scss'
})
export class BooksTableComponent implements OnInit {
  @Input() userId?: string;
  
  inventoryData: Inventory[] = [];
  loading = false;
  error: string | null = null;
  
  // Prepare data for primary table
  get tableData() {
    return this.inventoryData.map(item => ({
      title: item.title,
      code: item.code,
      billingDate: this.formatDate(item.billing_date),
      returnDate: item.return_date ? this.formatDate(item.return_date) : 'Not returned',
      notes: item.notes || 'No notes',
      customer: item.customer.name,
      user: `${item.user.firstname} ${item.user.lastname}`
    }));
  }
  
  // Configure columns for primary table
  columns = [
    { field: 'title', header: 'Title' },
    { field: 'code', header: 'Code' },
    { field: 'billingDate', header: 'Billing Date' },
    { field: 'returnDate', header: 'Return Date' }
  ];
  
  constructor(private inventoryService: InventoryService) {}
  
  ngOnInit() {
    this.loadInventoryData();
  }
  
  loadInventoryData() {
    if (!this.userId) {
      this.error = 'User ID is required';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    this.inventoryService.getInventory({
      user: this.userId,
      item_type: 'ASSET'
    }).pipe(
      catchError(error => {
        this.error = 'Failed to load inventory data';
        this.loading = false;
        return of(null);
      })
    ).subscribe(response => {
      this.loading = false;
      if (response && response.success) {
        this.inventoryData = response.data;
        console.log('Inventory data', this.inventoryData);
      } else {
        this.error = 'No data received';
      }
    });
  }
  
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  // Handle edit action
  handleEdit(item: any) {
    console.log('Edit inventory item', item);
  }
  
  // Handle delete action
  handleDelete(item: any) {
    console.log('Delete inventory item', item);
  }
  
  // Handle add book action
  onAddBook() {
    console.log('Add new book for user', this.userId);
    // TODO: Implement navigation to add book form
  }
} 