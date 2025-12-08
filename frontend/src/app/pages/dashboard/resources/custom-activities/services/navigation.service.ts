import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private selectedButtonIdSubject = new BehaviorSubject<number>(1);
  selectedButtonId$: Observable<number> = this.selectedButtonIdSubject.asObservable();
  warning = false;

  constructor(private dataService: DataService, private router: Router, private translate: TranslateService) {}

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
      this.router.navigate(['/dashboard/resources/custom-activities']);
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
            return this.translate.instant('customActivities.going_back_delete'); //'Going back will delete all the data you entered.';
          }
        } else {
          if (this.warning) {
            return '';
          } else {
            //have data = true and newValue is 1
            this.warning = true;
            return this.translate.instant('customActivities.going_back_delete'); //'Going back will cancel all the edits you made.';
          }
        }
      }
    }
    return '';
  }
}
