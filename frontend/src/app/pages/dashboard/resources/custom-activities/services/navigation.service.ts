import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private selectedButtonIdSubject = new BehaviorSubject<number>(1);
  selectedButtonId$: Observable<number> = this.selectedButtonIdSubject.asObservable();
  warning = false;

  constructor(private dataService: DataService, private router: Router) {}

  getSelectedButtonId(): number {
    return this.selectedButtonIdSubject.getValue();
  }

  setSelectedButtonId(value: number, hasData: boolean): string {
    if (value >= 1 && value < 5) {
      let data = this.dataService.isDataValid(this.getSelectedButtonId(), value, hasData);
      if (data.isValid) {
        this.selectedButtonIdSubject.next(value);
        return 'ok';
      } else {
        return data.reason;
      }
    }
    return '';
  }

  increment(hasData: boolean): string {
    const newValue = this.getSelectedButtonId() + 1;
    let data = this.dataService.isDataValid(this.getSelectedButtonId(), newValue, hasData);
    if (newValue <= 4 && data.isValid) {
      this.selectedButtonIdSubject.next(newValue);
      this.warning = false;
      //console.log('warning false');
      return 'ok';
    } else {
      return data.reason;
    }
    return '';
  }

  goBack() {
    if (this.warning) {
      this.router.navigate(['/custom-activities']);
    }
  }

  resetWarning() {
    this.warning = false;
  }

  decrement(hasData: boolean): string {
    const newValue = this.getSelectedButtonId() - 1;
    if (newValue >= 1 && hasData === false) {
      this.selectedButtonIdSubject.next(newValue);
    } else {
      if (hasData && newValue >= 2) {
        this.selectedButtonIdSubject.next(newValue);
      } else {
        if (newValue === 0) {
          if (this.warning) {
            return '';
          } else {
            this.warning = true;
            return 'Going back will delete all the data you entered.';
          }
        }
      }
    }
    return '';
  }
}
