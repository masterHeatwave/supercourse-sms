import { CommonModule, KeyValue } from '@angular/common';
import { Component, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { ImageTextComponent } from '../image-text/image-text.component';
import { ButtonModule } from 'primeng/button';
import { InfoDialogComponent } from '../dialogs/info-dialog/info-dialog.component';

@Component({
  selector: 'mood-calendar',
  standalone: true,
  imports: [CommonModule, ImageTextComponent, ButtonModule, InfoDialogComponent],
  templateUrl: './mood-calendar.component.html',
  styleUrl: './mood-calendar.component.scss'
})
export class MoodCalendarComponent {
  @Input() moods: any[] = [];
  isInfoDialogVisible: boolean = false;
  infoMessage: string = '';

  monthsMoods: {
    [key: string]: { day: number; mood: string; note: string }[];
  } = {};
  sortedMonthsArray: {
    key: string;
    value: { day: number; mood: string; note: string }[];
  }[] = [];
  text: string = '';
  imageUrl = 'assets/images/wellness-center/' + this.text + '.png';
  order: string = 'asc';

  @ViewChildren(ImageTextComponent)
  imageComponents!: QueryList<ImageTextComponent>;

  flattenedMoods: { i: number; j: number; component?: ImageTextComponent }[] = [];

  updateComponentRefs() {
    this.flattenedMoods = [];
    let i = 0;
    for (const month of this.sortedMonthsArray) {
      const days = month.value;
      for (let j = 0; j < days.length; j++) {
        this.flattenedMoods.push({ i, j });
      }
      i++;
    }

    this.imageComponents?.forEach((comp, index) => {
      if (this.flattenedMoods[index]) {
        this.flattenedMoods[index].component = comp;
      }
    });
  }

  ngAfterViewInit() {
    this.updateComponentRefs();
    this.imageComponents.changes.subscribe(() => this.updateComponentRefs());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['moods'] && changes['moods'].currentValue) {
      if(this.moods.length > 0){
        this.processMoods();
      }
      else{
        this.monthsMoods = {};    
      }
    }
  }

  processMoods() {
    this.monthsMoods = {};
    this.moods.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.moods.forEach((item) => {
      const date = new Date(item.date);
      const month = date.toLocaleString('en', {
        month: 'long',
        year: 'numeric'
      });
      const day = date.getDate();

      if (!this.monthsMoods[month]) {
        this.monthsMoods[month] = [];
      }

      this.monthsMoods[month].push({
        day,
        mood: item.mood,
        note: item.note ?? 'after the lesson'
      });
    });

    if (this.order === 'asc') {
      this.sortedMonthsArray = Object.entries(this.monthsMoods)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => new Date(a.key).getTime() - new Date(b.key).getTime());
    } else {
      this.sortedMonthsArray = Object.entries(this.monthsMoods)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => new Date(b.key).getTime() - new Date(a.key).getTime());
    }
    this.updateComponentRefs();
  }

  /*getMonths(): string[] {
    return Object.keys(this.monthsMoods);
  }*/
  getMonths(sortOrder: 'asc' | 'desc' = 'asc'): string[] {
    return Object.keys(this.monthsMoods).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);

      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }

  sortByDate = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => {
    if (this.order === 'asc') {
      return new Date(a.key).getTime() - new Date(b.key).getTime();
    } else {
      return new Date(b.key).getTime() - new Date(a.key).getTime();
    }
  };

  onClick(event: MouseEvent) {
    this.order === 'asc' ? (this.order = 'desc') : (this.order = 'asc');
    this.processMoods();
  }

  onImageClick(event: MouseEvent, i: number, j: number, mood: string, month: string, note: string) {
    const item = this.flattenedMoods.find((x) => x.i === i && x.j === j);
    if (item?.component) {
      this.infoMessage = 'Date: ' + item.component.text + ' ' + month + '.\nMood: ' + mood; // +
      //'.\nNote: ' +
      //note +
      //'.';
      this.isInfoDialogVisible = true;
    }
  }
}
