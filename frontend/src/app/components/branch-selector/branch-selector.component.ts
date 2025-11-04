import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { AppState } from '@store/app.state';
import { CustomerService } from '../../services/customer.service';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-branch-selector',
  standalone: true,
  imports: [CommonModule, DropdownModule, FormsModule, TranslateModule],
  templateUrl: './branch-selector.component.html'
})
export class BranchSelectorComponent implements OnInit, OnDestroy {
  selectedCustomerId: string | null = null;
  customerOptions: { id: string; name: string; is_main_customer?: boolean }[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>, private customerService: CustomerService) {}

  ngOnInit() {
    // Get current customer ID from store
    const customerIdSub = this.store
      .select((state) => state.auth.currentCustomerId)
      .subscribe((id) => {
        this.selectedCustomerId = id;
      });
    this.subscriptions.push(customerIdSub);

    // Get customer options from service and filter for branches (is_main_customer = false)
    const customerOptionsSub = this.customerService.getCurrentUserCustomers().subscribe((customers) => {
      this.customerOptions = customers.filter((customer) => customer.is_main_customer === false);
    });
    this.subscriptions.push(customerOptionsSub);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onCustomerChange() {
    if (this.selectedCustomerId) {
      this.customerService.setCurrentCustomer(this.selectedCustomerId);
    }
  }
}
