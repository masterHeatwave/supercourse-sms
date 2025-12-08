import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ImageTextComponent } from '../image-text/image-text.component';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { InfoDialogComponent } from '@components/dialogs/info-dialog/info-dialog.component';
import { MoodsService } from '@gen-api/moods/moods.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
//import { SERVER_URL } from '../../constants';

@Component({
  selector: 'mood-picker',
  standalone: true,
  imports: [ImageTextComponent, ButtonModule, WarningDialogComponent, InfoDialogComponent, TranslateModule],
  templateUrl: './mood-picker.component.html',
  styleUrl: './mood-picker.component.scss'
})
export class MoodPickerComponent {
  imageUrl = '';
  text: string = '';
  label: string = '';
  warningMessage = '';
  isWarningDialogVisible = false;
  infoMessage = '';
  isInfoDialogVisible = false;
  private langChangeSub!: Subscription;
  @Input() currentClass: any = {};
  @Input() currentSemester: any;
  @Input() userId: any = '';
  @Input() moods: any;
  @Output() moodSaved: EventEmitter<void> = new EventEmitter<void>();
  //months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(private moodsService: MoodsService, private translate: TranslateService) {}

  ngOnInit() {
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.resetMood();
    });
  }

  ngOnDestroy() {
    this.langChangeSub?.unsubscribe();
  }

  onClick(event: { text: string; label: string }) {
    //const moodKey = event.text;
    //const labelKey = event.label;

    this.text = event.text.toLocaleLowerCase();
    this.label = event.label.toLocaleLowerCase();
    this.imageUrl = 'assets/images/wellness-center/' + this.text + '.png';
  }

  /*onClick(event: any) {
    //let txt;
    const element = event.currentTarget as HTMLElement;
    const moodKey: any = element.getAttribute('text')?.toLowerCase();
    const labelKey: any = element.getAttribute('label');
    //console.log('labelKey', labelKey);

    /*if (event.target?.name) {
      txt = event.target.name.toLowerCase();
    } else {
      txt = (event.target as HTMLElement).textContent?.toLowerCase();
    }*/
  //this.text = moodKey; //txt!.toString();
  //this.label = labelKey;
  //this.imageUrl = 'assets/images/wellness-center/' + this.text + '.png';
  //}

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
    this.label = '';
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
        //this.infoMessage = 'Mood saved!';
        //this.isInfoDialogVisible = true;
        this.translate.get('wellnessCenter.moodSaved').subscribe((translated: string) => {
          this.infoMessage = translated;
          this.isInfoDialogVisible = true;
        });
        this.moodSaved.emit();
      },
      error: (err) => {
        console.log(err);
        this.showTranslatedError(err.error.data.error.message);
        //this.warningMessage = err.error.data.error.message;
        //this.isWarningDialogVisible = true;
      }
    });

    this.resetMood();
  }

  private showTranslatedError(key: string) {
    this.translate.get(`wellnessCenter.${key}`).subscribe((msg) => {
      console.log(key);
      this.warningMessage = msg;
      this.isWarningDialogVisible = true;
    });
  }

  cancelClick(event: Event) {
    this.resetMood();
  }
}
