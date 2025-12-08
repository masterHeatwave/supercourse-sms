import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DialogModule, ButtonModule, DividerModule, BreadcrumbModule, CommonModule, MenuModule, WarningDialogComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnChanges {
  selectedButtonId: number = 1;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';
  items: MenuItem[] = [];

  @Input() activityData = {
    _id: '',
    title: '',
    description: ''
  };

  @Input() hasData: boolean = false;

  constructor(public navigationService: NavigationService, private router: Router, private translate: TranslateService) {
    this.translate.onLangChange.subscribe(() => {
      this.updateItems();
    });
  }

  ngOnInit() {
    this.navigationService.selectedButtonId$.subscribe((id) => {
      this.selectedButtonId = id;
      this.updateItems();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hasData']) {
      if (this.hasData) {
        this.navigationService.setSelectedButtonId(2, this.hasData);
      }
      this.updateItems();
    }
  }

  onClick(id: number) {
    let status = this.navigationService.setSelectedButtonId(id, this.hasData);
    if (status !== 'ok' && status !== '') {
      this.warningMessage = status;
      this.isWarningDialogVisible = true;
    }
    if (this.navigationService.getSelectedButtonId() >= 1) {
      this.navigationService.resetWarning();
    }
    /*else {
      this.selectedButtonId = id;
      this.updateItems();
    }*/
  }

  dialogClick(): void {
    this.isWarningDialogVisible = false;
  }

  updateItems(): void {
    this.items = [];

    if (!this.hasData) {
      this.items.push({
        label: this.hasData
          ? this.translate.instant('customActivities.edit_activity_type_button')
          : this.translate.instant('customActivities.choose_activity_type_button'),
        command: () => this.onClick(1),
        styleClass: this.selectedButtonId === 1 ? 'selected' : ''
      });
    }

    this.items.push(
      {
        label: this.hasData
          ? this.translate.instant('customActivities.edit_player_mode_button')
          : this.translate.instant('customActivities.choose_player_mode_button'),
        command: () => this.onClick(2),
        styleClass: this.selectedButtonId === 2 ? 'selected' : ''
      },
      {
        label: this.hasData
          ? this.translate.instant('customActivities.edit_content_button')
          : this.translate.instant('customActivities.add_content_button'),
        command: () => this.onClick(3),
        styleClass: this.selectedButtonId === 3 ? 'selected' : ''
      },
      {
        label: this.hasData
          ? this.translate.instant('customActivities.edit_template_button')
          : this.translate.instant('customActivities.choose_template_button'),
        command: () => this.onClick(4),
        styleClass: this.selectedButtonId === 4 ? 'selected' : ''
      }
    );
  }
}
