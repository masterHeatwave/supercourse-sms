import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CustomersService } from '@gen-api/customers/customers.service';
import { PublicService } from '@gen-api/public/public.service';
import { AppState } from '@store/app.state';
import { map, Observable, switchMap, of, catchError } from 'rxjs';
import { AuthActions } from '@store/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(
    private customersService: CustomersService,
    private publicService: PublicService,
    private store: Store<AppState>
  ) {}

  /**
   * Get customer details by ID
   */
  getCustomerDetails(customerId: string) {
    return this.customersService.getCustomersId(customerId);
  }

  /**
   * Get all customers the current user has access to
   */
  getCurrentUserCustomers(): Observable<{ id: string; name: string; is_primary?: boolean; is_main_customer?: boolean }[]> {
    // First attempt to get all customers using the service
    return this.customersService.getCustomers().pipe(
      map((response) => {
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map((customer) => ({
            id: customer.id,
            name: customer.name,
            is_primary: customer.is_primary,
            is_main_customer: customer.is_main_customer
          }));
        }
        return [];
      }),
      // If the API call fails, fall back to the user's customers from the auth state
      catchError(() => {
        return this.store
          .select((state) => state.auth.user)
          .pipe(
            switchMap((user) => {
              if (!user || !user.customers || user.customers.length === 0) {
                return of([]);
              }

              // For now, return placeholders
              return of(user.customers.map((id) => ({ id, name: `Branch ${id.substring(0, 8)}...`, is_main_customer: false })));
            })
          );
      })
    );
  }

  /**
   * Get the main customer details
   */
  getMainCustomer() {
    return this.customersService.getCustomersMain();
  }

  /**
   * Update customer details
   */
  updateCustomer(customerId: string, customerData: any) {
    return this.customersService.putCustomersId(customerId, customerData);
  }

  /**
   * Update main customer details
   */
  updateMainCustomer(customerData: any) {
    // First get the main customer to get its ID, then update it
    return this.getMainCustomer().pipe(
      switchMap((response) => {
        if (response?.data?.id) {
          return this.updateCustomer(response.data.id, customerData);
        }
        throw new Error('Main customer not found');
      })
    );
  }

  /**
   * Set the current customer ID in the store
   */
  setCurrentCustomer(customerId: string): void {
    this.store.dispatch(AuthActions.setCurrentCustomer({ customerId }));
  }

  /**
   * Get all main schools for login selection (public endpoint)
   */
  getPublicSchools(): Observable<Array<{ label: string; value: string }>> {
    return this.publicService.getPublicCustomers().pipe(
      map((response) => {
        if (response?.data && Array.isArray(response.data)) {
          return response.data.map((school) => ({
            label: school.name,
            value: school.slug
          }));
        }
        return [];
      }),
      catchError(() => {
        // Return empty array on error
        return of([]);
      })
    );
  }
}
