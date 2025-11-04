// primary-table.component.ts
import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { PaginatorModule } from 'primeng/paginator';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-primary-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    CalendarModule,
    PaginatorModule,
    OverlayPanelModule,
    TooltipModule,
    TranslateModule,
    InputSwitchModule
  ],
  templateUrl: './primary-table.component.html',
  styleUrl: './primary-table.component.scss'
})
export class PrimaryTableComponent {
  @Input() data: any[] = [];
  @Input() columns: {
    field: string;
    header: string;
    type?: string;
    filterType?: string;
    sortable?: boolean;
    matchModeOptions?: { label: string; value: string }[];
    getValue?: (rowData: any) => string;
    getTextColor?: (rowData: any) => string;
    buttonConfig?: {
      label: string;
      icon?: string;
      class?: string;
      onClick?: (rowData: any) => void;
      popover?: {
        content: (rowData: any) => string;
        showDelay?: number;
        hideDelay?: number;
      };
    };
    toggleConfig?: {
      onChange: (rowData: any, checked: boolean) => void;
      disabled?: (rowData: any) => boolean;
    };
    iconConfig?: {
      icon: string;
      getColor: (rowData: any) => string;
    };
  }[] = [];
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() rows: number = 10;
  @Input() first: number = 0;
  @Input() useVirtualScroll: boolean = true;
  @Input() globalFilterFields: string[] = [];
  @Input() showActions: boolean = true;
  @Input() viewMode: 'list' | 'grid' = 'list';
  @Input() selection: any[] = [];
  @Input() dataKey: string = 'id';
  @Input() selectionEnabled: boolean = true;

  @Output() pageChange = new EventEmitter<{ page: number; rows: number }>();
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowUnselect = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() editRow = new EventEmitter<any>();
  @Output() deleteRow = new EventEmitter<any>();
  @Output() viewRow = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<{ field: string; order: number }>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowsPerPageChange = new EventEmitter<number>();

  private sortState: { field: string; order: number } | null = null;
  sortedData: any[] = [];

  booleanOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  // ContentChild for custom column templates
  @ContentChild('titleTemplate') titleTemplate?: TemplateRef<any>;
  @ContentChild('gradesTemplate') gradesTemplate?: TemplateRef<any>;
  @ContentChild('achievementsTemplate') achievementsTemplate?: TemplateRef<any>;
  @ContentChild('attendanceTemplate') attendanceTemplate?: TemplateRef<any>;
  @ContentChild('behaviourTemplate') behaviourTemplate?: TemplateRef<any>;
  @ContentChild('rewardsTemplate') rewardsTemplate?: TemplateRef<any>;

  constructor() {
    this.globalFilterFields = this.columns.map((col) => col.field);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.applySorting();
    }
  }

  onPageChange(event: any) {
    const page = Math.floor(event.first / event.rows) + 1;
    this.first = event.first;
    this.rows = event.rows;
    this.pageChange.emit({
      page: page,
      rows: event.rows
    });
  }

  onRowsPerPageChange(event: any) {
    this.rows = event.value;
    this.rowsPerPageChange.emit(event.value);
  }

  onSelectionChange(event: any) {
    this.selectionChange.emit(event);
  }

  onSortChange(event: any) {
    this.sortState = {
      field: event.field,
      order: event.order
    };
    this.applySorting();
    this.sortChange.emit(this.sortState);
  }

  private applySorting() {
    if (!this.sortState || !this.sortState.field) {
      this.sortedData = [...this.data];
      return;
    }

    this.sortedData = [...this.data].sort((a: any, b: any) => {
      const aValue = this.getSortValue(a, this.sortState!.field);
      const bValue = this.getSortValue(b, this.sortState!.field);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return this.sortState!.order === 1 ? -1 : 1;
      if (bValue == null) return this.sortState!.order === 1 ? 1 : -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return this.sortState!.order === 1 ? comparison : -comparison;
    });
  }

  private getSortValue(item: any, field: string): any {
    // Handle nested fields
    if (field.includes('.')) {
      const fields = field.split('.');
      let value = item;
      for (const f of fields) {
        value = value?.[f];
        if (value === undefined) return null;
      }
      return value;
    }

    // Handle special fields
    const column = this.columns.find((col) => col.field === field);
    if (column?.getValue) {
      return column.getValue(item);
    }

    return item[field];
  }

  onRowSelect(event: any) {
    this.rowSelect.emit(event.data);
  }

  onRowUnselect(event: any) {
    this.rowUnselect.emit(event.data);
  }

  onBooleanFilterChange(event: any, field: string) {
    this.filterChange.emit({ field, value: event.value });
  }

  onDateFilterChange(event: any, field: string) {
    this.filterChange.emit({ field, value: event });
  }

  onEditClick(item: any) {
    this.editRow.emit(item);
  }

  onDeleteClick(item: any) {
    this.deleteRow.emit(item);
  }

  onViewClick(item: any) {
    this.viewRow.emit(item);
  }

  onButtonClick(col: any, rowData: any) {
    console.log('Primary table button clicked:', col.field, col.buttonConfig, rowData);
    console.log('Button config onClick exists?', !!col.buttonConfig?.onClick);
    console.log('typeof onClick:', typeof col.buttonConfig?.onClick);
    if (col.buttonConfig?.onClick) {
      console.log('Calling onClick function...');
      col.buttonConfig.onClick(rowData);
    } else {
      console.log('No onClick function found in buttonConfig');
    }
  }

   onToggleChange(col: any, rowData: any, checked: boolean) {
     if (col.toggleConfig?.onChange) {
       col.toggleConfig.onChange(rowData, checked);
     }
   }

   isToggleDisabled(col: any, rowData: any): boolean {
     if (!col.toggleConfig || !col.toggleConfig.disabled) {
       return false;
     }
     try {
       return !!col.toggleConfig.disabled(rowData);
     } catch {
       return false;
     }
   }

  getButtonTooltip(col: any, rowData: any): string {
    if (col.buttonConfig?.popover?.content) {
      return col.buttonConfig.popover.content(rowData);
    }
    return '';
  }

  getButtonIcon(col: any, rowData: any): string {
    if (col.buttonConfig?.getIcon) {
      return col.buttonConfig.getIcon(rowData);
    }
    return col.buttonConfig?.icon || '';
  }

  getButtonClass(col: any, rowData: any): string {
    if (col.buttonConfig?.getClass) {
      return col.buttonConfig.getClass(rowData);
    }
    return col.buttonConfig?.class || '';
  }

  getAttendanceDot(rowData: any, col: any): 'present' | 'absent' | null {
    const value = col.getValue ? col.getValue(rowData) : rowData[col.field];
    if (value === true) return 'present';
    if (value === false) return 'absent';
    return null;
  }

  // Helper methods for grid view
  getDisplayName(item: any): string {
    if (item.firstname && item.lastname) {
      return `${item.firstname} ${item.lastname}`.trim();
    }
    return item.username || 'Unknown';
  }

  getRoleValue(item: any): string {
    const roleColumn = this.columns.find(col => col.field === 'roles');
    if (roleColumn && roleColumn.getValue) {
      return roleColumn.getValue(item);
    }
    return '';
  }

  getRoleSeverity(item: any): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const roleValue = this.getRoleValue(item).toLowerCase();
    if (roleValue.includes('manager') || roleValue.includes('admin')) {
      return 'warning';
    } else if (roleValue.includes('teacher')) {
      return 'info';
    }
    return 'secondary';
  }

  getClassValue(item: any): string {
    const classColumn = this.columns.find(col => col.field === 'taxis');
    if (classColumn && classColumn.getValue) {
      return classColumn.getValue(item);
    }
    return '';
  }

  getBranchesValue(item: any): string {
    const branchesColumn = this.columns.find(col => col.field === 'branches');
    if (branchesColumn && branchesColumn.buttonConfig?.popover?.content) {
      const content = branchesColumn.buttonConfig.popover.content(item);
      return content === 'No branches assigned' ? '' : content;
    }
    return '';
  }

  getProfileImageSrc(item: any): string {
    if (item.avatar) {
      // If avatar is already a full URL, return it as is
      if (item.avatar.startsWith('http') || item.avatar.startsWith('data:')) {
        return item.avatar;
      }
      // If avatar is a relative path, construct the full URL
      return `${environment.assetUrl}/${item.avatar}`;
    }
    return 'assets/images/no-image.png';
  }

  onImageError(event: any) {
    // If the image fails to load, set it to the no-image fallback
    event.target.src = 'assets/images/no-image.png';
  }
}
