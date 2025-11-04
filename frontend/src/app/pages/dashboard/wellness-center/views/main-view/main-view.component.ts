import { Component, inject } from '@angular/core';
import { MoodPickerComponent } from '../../components/mood-picker/mood-picker.component';
import { ToolSelectorComponent } from '../../components/tool-selector/tool-selector.component';
import { DropdownChangeEvent, DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoodCalendarComponent } from '../../components/mood-calendar/mood-calendar.component';
import { CalmTimeViewComponent } from '../calm-time-view/calm-time-view.component';
import { RelaxingMusicViewComponent } from '../relaxing-music-view/relaxing-music-view.component';
import { MeditationViewComponent } from '../meditation-view/meditation-view.component';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { MoodsService } from '@gen-api/moods/moods.service';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'main-view',
  standalone: true,
  imports: [
    MoodPickerComponent,
    ToolSelectorComponent,
    DropdownModule,
    CommonModule,
    FormsModule,
    MoodCalendarComponent,
    CalmTimeViewComponent,
    RelaxingMusicViewComponent,
    MeditationViewComponent
  ],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.scss'
})
export class WellnessCenterComponent {
  userId: string = '';
  userType: string = '';
  user: any = {};
  authHeader = '';
  classes: any[] = [];
  subperiods: any[] = [];

  selectedClassId: number | null = null;
  selectedSubperiodId: number | null = null;

  moodData: any;
  uniqueClasses: any;
  uniqueClass: any;
  semesters: any;
  selectedSemester: any;
  moods: any;
  reload: boolean = false;
  selectedView = 'main';

  store = inject(Store);

  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';

  constructor(private moodService: MoodsService, private taxisService: TaxisService) {}

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';
      this.uniqueClasses = '';
      this.selectedSemester = '';
      this.subperiods = [];
      this.moods = {};
      this.taxisService.getTaxisUserUserId(this.currentUserID).subscribe({
        next: (response1) => {
          this.classes = response1.data;
          this.taxisService.getTaxis({ branch: this.currentBranchID }).subscribe({
            next: (response2) => {
              const tempData = response2.data;

              const commonData = this.classes.filter(classItem =>
                tempData.some(tempItem => tempItem.id === classItem.id)
              );
              this.uniqueClasses = commonData;
            }
          })
        }
      })
    });
  }

  loadMoods() {
    this.reload = true;
    this.moodService.getMoodsUserUserIdClassClassId(this.currentUserID, this.uniqueClass._id).subscribe({
      next: (response) => {
        this.moodData = response.data;
        if(this.moodData.haveMoods){
          this.moods = this.moodData.moods;
        }
        else{
          this.moods = {};
        }
      }
    });
  }

  classDropdownChange(event: DropdownChangeEvent) {
    const today = new Date();
    this.subperiods = this.uniqueClass.academic_subperiods.filter((subperiod: any) => {
      const startDate = new Date(subperiod.start_date);
      return startDate <= today; // Keep only subperiods that start today or earlier
    });
    this.uniqueClass = {};
    this.uniqueClass = event.value;
    this.loadMoods();
  }

  semesterDropdownChange(event: DropdownChangeEvent) {
    if (this.moodData.haveMoods) {
      this.moods = this.moodData.moods.filter((mood: any) => {
        return mood.academic_subperiod === this.selectedSemester._id;
      });
    }
  }

  onViewChange(view: string) {
    this.selectedView = view;
  }

  onBackToMainView() {
    this.selectedView = 'main';
  }
}
