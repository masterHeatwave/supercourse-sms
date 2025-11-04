import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent
  ],
  templateUrl: './history-table.component.html',
  styleUrl: './history-table.component.scss'
})
export class HistoryTableComponent {
  @Input() historyData: any[] = [];
  
  // Prepare data for primary table
  get tableData() {
    return this.historyData.map(item => ({
      title: {
        yearTitle: item.yearTitle,
        value: item.title
      },
      startDate: item.startDate,
      endDate: item.endDate,
      roles: item.roles,
      branches: item.branches,
      classes: item.classes
    }));
  }
  
  // Configure columns for primary table
  columns = [
    { 
      field: 'title', 
      header: 'Title',
      type: 'custom'
    },
    { field: 'startDate', header: 'Start date' },
    { field: 'endDate', header: 'End date' },
    { field: 'roles', header: 'Roles' },
    { field: 'branches', header: 'Branches' },
    { field: 'classes', header: 'Classes' }
  ];
  
  // Handle edit action
  handleEdit(item: any) {
    console.log('Edit item', item);
  }
  
  // Handle delete action
  handleDelete(item: any) {
    console.log('Delete item', item);
  }
} 