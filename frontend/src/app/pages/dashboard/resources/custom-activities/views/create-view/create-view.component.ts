import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { MainContentComponent } from '../../components/main-content/main-content.component';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { NavigationService } from '../../services/navigation.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';

@Component({
  selector: 'app-create-view',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, MainContentComponent],
  templateUrl: './create-view.component.html',
  styleUrl: './create-view.component.scss'
})
export class CreateViewComponent {
  userId!: string;

  store = inject(Store);

  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';

  constructor(
    private router: Router,
    private dataService: DataService,
    private navigationService: NavigationService,
    private customActivityService: CustomActivitiesService
  ) {
    //const nav = this.router.getCurrentNavigation();
    //console.log(nav);
    //this.userId = nav?.extras?.queryParams?.['userId'];
    dataService.getUserId().subscribe({
      next: (value) => {
        this.userId = value;
      }
    });
  }

  ngOnInit() {
    this.navigationService.resetWarning();
    this.navigationService.setSelectedButtonId(1, false);

    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';
    });
    this.dataService.setData('userId', this.currentUserID);
  }
}
