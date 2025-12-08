import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, FormsModule, ButtonModule, ToggleButtonModule, TranslateModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  dateRange: Date[] = [];
  private langChangeSub!: Subscription;

  constructor(private config: PrimeNGConfig, private translateService: TranslateService) {}

  ngOnInit() {
    this.updateCalendarTranslation();
    this.langChangeSub = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      this.updateCalendarTranslation();
    });
  }

  ngOnDestroy() {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }

  private updateCalendarTranslation() {
    this.translateService.get('analytics').subscribe((res) => {
      this.config.setTranslation(res);
    });
  }
}
