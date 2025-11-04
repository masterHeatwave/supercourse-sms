import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _isLoading = signal(false);

  isLoading = this._isLoading.asReadonly();

  setLoading(value: boolean) {
    this._isLoading.set(value);
  }
}
