import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventoryFormComponent } from '@components/inventory/inventory-form/inventory-form.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-elibrary',
  standalone: true,
  imports: [CommonModule, ToastModule, InventoryFormComponent],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  providers: [MessageService]
})
export class EditElibraryComponent implements OnInit {
  private route = inject(ActivatedRoute);

  inventoryId?: string;

  ngOnInit(): void {
    this.inventoryId = this.route.snapshot.paramMap.get('id') || undefined;
  }
}
