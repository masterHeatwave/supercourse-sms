import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';

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
export class BooksTableComponent {
  @Input() booksData: any[] = [];
  
  // Prepare data for primary table
  get tableData() {
    return this.booksData.map(item => ({
      title: {
        value: item.title
      },
      cefr: item.cefr,
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active
    }));
  }
  
  // Configure columns for primary table
  columns = [
    { 
      field: 'title', 
      header: 'Title',
      type: 'custom'
    },
    { field: 'cefr', header: 'CEFR' },
    { field: 'startDate', header: 'Start date' },
    { field: 'endDate', header: 'End date' },
    { 
      field: 'active', 
      header: 'Active',
      type: 'boolean'
    }
  ];
  
  // Handle edit action
  handleEdit(item: any) {
    console.log('Edit book', item);
  }
  
  // Handle delete action
  handleDelete(item: any) {
    console.log('Delete book', item);
  }
} 