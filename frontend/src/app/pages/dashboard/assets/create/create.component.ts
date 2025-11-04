import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryFormComponent } from '@components/inventory/inventory-form/inventory-form.component';

@Component({
  selector: 'app-create-asset',
  standalone: true,
  imports: [CommonModule, ToastModule, InventoryFormComponent],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
  providers: [MessageService]
})
export class CreateAssetComponent {}
