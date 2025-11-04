import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ImageTextComponent } from '../image-text/image-text.component';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarningDialogComponent } from '../dialogs/warning-dialog/warning-dialog.component';
import { InfoDialogComponent } from '../dialogs/info-dialog/info-dialog.component';
import { MoodsService } from '@gen-api/moods/moods.service';
//import { SERVER_URL } from '../../constants';

@Component({
  selector: 'mood-picker',
  standalone: true,
  imports: [ImageTextComponent, ButtonModule, WarningDialogComponent, InfoDialogComponent],
  templateUrl: './mood-picker.component.html',
  styleUrl: './mood-picker.component.scss'
})
export class MoodPickerComponent {
  imageUrl = '';
  text: string = '';
  warningMessage = '';
  isWarningDialogVisible = false;
  infoMessage = '';
  isInfoDialogVisible = false;
  @Input() currentClass: any = {};
  @Input() currentSemester: any;
  @Input() userId: any = '';
  @Input() moods: any;
  @Output() moodSaved: EventEmitter<void> = new EventEmitter<void>();
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(private moodsService: MoodsService) {}

  onClick(event: any) {
    let txt;
    if (event.target?.name) {
      txt = event.target.name.toLowerCase();
    } else {
      txt = (event.target as HTMLElement).textContent?.toLowerCase();
    }
    this.text = txt!.toString();
    this.imageUrl = 'assets/images/wellness-center/' + txt + '.png';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentClass'] && changes['currentClass'].currentValue) {
      //this.processMoods();
      //console.log('currentClass', this.currentClass);
    }
    if (changes['currentSemester'] && changes['currentSemester'].currentValue) {
      //this.processMoods();
      //console.log('currentSemester', this.currentSemester);
    }
  }

  resetMood() {
    this.imageUrl = '';
    this.text = '';
  }

  applyClick(event: Event) {
    const date = new Date();

    const startDate = new Date(this.currentSemester?.start_date || null);
    const endDate = new Date(this.currentSemester?.end_date || null);
    if (date >= startDate && date <= endDate) {
      var matchingAcademicTerm: any = this.currentSemester;
    }

    const newMood: any = {
      userId: this.userId,
      academic_subperiod: matchingAcademicTerm?._id || null, //this.currentSemester._id,
      taxisId: this.currentClass?._id || null,
      date: date,
      mood: this.text
    };

    this.moodsService.postMoods(newMood).subscribe({
      next: (response) => {
        console.log(response.data);
        this.infoMessage = 'Mood saved!';
        this.isInfoDialogVisible = true;
        this.moodSaved.emit();
      },
      error: (err) => {
        console.log(err);
        this.warningMessage = err.error.data.error.message;
        this.isWarningDialogVisible = true;
      }
    });

    this.resetMood();
  }

  cancelClick(event: Event) {
    this.resetMood();
  }
}
