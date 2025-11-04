import { Component, Input } from '@angular/core';
import { FooterButtonComponent } from '../footer-button/footer-button.component';
import { NavigationService } from '../../services/navigation.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DataService } from '../../services/data.service';
import { LoadingComponent } from '../loading/loading.component';
import { WarningDialogComponent } from '../dialogs/warning-dialog/warning-dialog.component';
import { InfoDialogComponent } from '../dialogs/info-dialog/info-dialog.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    FooterButtonComponent,
    DialogModule,
    ButtonModule,
    DividerModule,
    LoadingComponent,
    WarningDialogComponent,
    InfoDialogComponent,
    CommonModule
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  isLoading: boolean = false;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';
  isInfoDialogVisible: boolean = false;
  infoMessage: string = '';
  private subscription!: Subscription;

  @Input() activityData: object = {};
  @Input() hasData: boolean = false;

  constructor(private dataService: DataService, public navigationService: NavigationService, private router: Router) {}

  ngOnInit() {
    this.dataService.onResponse.subscribe(() => {
      this.isLoading = false;
    });
  }

  onClick(button: string) {
    switch (button) {
      case 'back': {
        let status = this.navigationService.decrement(this.hasData);
        if (status !== 'ok' && status !== '') {
          this.warningMessage = status;
          this.isWarningDialogVisible = true;
        } else {
          this.navigationService.goBack();
        }
        break;
      }
      case 'continue': {
        let status = this.navigationService.increment(this.hasData);
        if (status !== 'ok' && status !== '') {
          this.warningMessage = status;
          this.isWarningDialogVisible = true;
        }
        break;
      }
      case 'save': {
        this.isLoading = true;
        this.dataService.saveData().subscribe({
          next: (response) => {
            this.isLoading = false;
            //console.log(response);
            this.infoMessage = 'Activity saved successfully'; //response.message;
            this.isInfoDialogVisible = true;
          },
          error: (err) => {
            this.isLoading = false;
            //console.log(err);
            this.warningMessage = err.error || err.message;
            this.isWarningDialogVisible = true;
          }
        });
        break;
      }
      case 'saveAndLaunch': {
        this.isLoading = true;
        this.dataService.saveData().subscribe({
          next: (response) => {
            this.isLoading = false;
            //console.log(response);
            this.infoMessage = 'Activity saved successfully'; //response.message;
            this.isInfoDialogVisible = true;
          },
          error: (err) => {
            this.isLoading = false;
            //console.log(err);
            this.warningMessage = err.error || err.message;
            this.isWarningDialogVisible = true;
          }
        });
        break;
      }
    }
  }

  onInfoClose() {
    this.isInfoDialogVisible = false;
    this.router.navigate(['/dashboard/custom-activities']);
  }

  dialogClick(): void {
    this.isWarningDialogVisible = false;
  }
}
