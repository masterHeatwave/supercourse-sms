import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { GetInventoryId200 } from '@gen-api/schemas';
import { InventoryDetailsComponent } from '@components/inventory/inventory-details/inventory-details.component';

@Component({
  selector: 'app-elibrary-single',
  standalone: true,
  imports: [CommonModule, ToastModule, TranslateModule, InventoryDetailsComponent],
  templateUrl: './single.component.html',
  styleUrls: ['./single.component.scss'],
  providers: [MessageService]
})
export class SingleElibraryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private inventoryService = inject(InventoryService);

  // Using any here because backend returns populated user/customer objects
  // even though the generated types declare strings
  item: any = null;
  itemId!: string;
  isLoading = false;

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.itemId) {
      this.router.navigate(['/dashboard/elibrary']);
      return;
    }
    this.fetch();
  }

  fetch() {
    this.isLoading = true;
    this.inventoryService.getInventoryId(this.itemId).subscribe({
      next: (resp: GetInventoryId200 | any) => {
        this.item = (resp as any)?.data || resp;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('api_messages.error_title'),
          detail: error?.error?.message || this.translate.instant('eLibrary.errors.load_failed')
        });
      }
    });
  }

  onBack() {
    this.router.navigate(['/dashboard/elibrary']);
  }

  onEdit() {
    this.router.navigate(['/dashboard/elibrary/edit', this.itemId]);
  }
}
