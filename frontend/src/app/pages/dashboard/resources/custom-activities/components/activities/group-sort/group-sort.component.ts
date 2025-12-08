import { Component, Input } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnswerComponent } from './answer/answer.component';
import { ImageSelectorComponent } from '../../image-selector/image-selector.component';
import { INITIAL_GROUP } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import { Question } from '../../../types';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'group-sort-activity',
  standalone: true,
  imports: [DragDropModule, CommonModule, FormsModule, AnswerComponent, ImageSelectorComponent, WarningDialogComponent, TranslateModule],
  templateUrl: './group-sort.component.html',
  styleUrls: ['./group-sort.component.scss']
})
export class GroupSortComponent {
  @Input() groups = [JSON.parse(JSON.stringify(INITIAL_GROUP))];
  warningMessage: string = 'Warning';
  isWarningDialogVisible: boolean = false;
  editIndex: number | null = null;

  constructor(private dataService: DataService, private translate: TranslateService) {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      //this.groups = questions;
    });
  }

  dropQuestion(event: CdkDragDrop<any[]>, groupIndex: number) {
    moveItemInArray(this.groups[groupIndex].items, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.groups);
  }

  dropGroup(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.groups, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.groups);
  }

  addGroup() {
    //this.groups.push(JSON.parse(JSON.stringify(INITIAL_GROUP)));
    const group = JSON.parse(JSON.stringify(INITIAL_GROUP));
    group.groupNumber = this.groups.length;
    //group.groupName = this.translate.instant(group.groupName);
    this.groups.push(group);
    this.dataService.setData('questions', this.groups);
  }

  removeGroup(groupIndex: number) {
    if (this.groups.length > 1) {
      this.groups.splice(groupIndex, 1);
      this.resequenceGroups();
    } else {
      //this.warningMessage = 'You cannot have less than one group.';
      this.warningMessage = this.translate.instant('customActivities.you_cannot_have_less_than_one_group');
      this.isWarningDialogVisible = true;
    }
    this.dataService.setData('questions', this.groups);
  }

  resequenceGroups() {
    this.groups.forEach((group, i) => {
      group.groupNumber = i + 1;
    });
  }

  resequenceItems(groupIndex: number) {
    const group = this.groups[groupIndex];
    group.items.forEach((item: any, i: number) => {
      item.itemNumber = i + 1;
    });
  }

  onGroupNameChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    this.groups[index].groupName = input.value;
  }

  addQuestion(groupIndex: number) {
    if (this.groups[groupIndex].items.length < 100) {
      this.groups[groupIndex].items.push({
        group: this.groups[groupIndex].groupNumber,
        itemNumber: this.groups[groupIndex].items.length + 1,
        answer: {
          imageURL: '',
          TTSText: '',
          answerText: ''
        }
      });
    }
    this.dataService.setData('questions', this.groups);
  }

  handleDeleteClicked(groupIndex: number, itemIndex: number) {
    if (this.groups[groupIndex].items.length > 1) {
      this.groups[groupIndex].items.splice(itemIndex, 1);
      this.resequenceItems(groupIndex);
    } else {
      this.warningMessage = this.translate.instant('customActivities.you_cannot_have_less_than_one_item_in_each_group'); //'You cannot have less than one item in each group.';
      this.isWarningDialogVisible = true;
    }
    this.dataService.setData('questions', this.groups);
  }

  handleErrorMessage(msg: string) {
    this.warningMessage = msg;
    this.isWarningDialogVisible = true;
  }

  handleImageURLChanged(imageUrl: string, groupIndex: number) {
    this.groups[groupIndex].imageURL = imageUrl;
    this.dataService.setData('questions', this.groups);
  }

  handleImageURLChange(newValue: string, groupIndex: number, itemIndex: number) {
    this.groups[groupIndex].items[itemIndex].answer.imageURL = newValue;
    this.dataService.setData('questions', this.groups);
  }

  handleInputChange(newValue: string, groupIndex: number, itemIndex: number) {
    this.groups[groupIndex].items[itemIndex].answer.answerText = newValue;
    this.dataService.setData('questions', this.groups);
  }

  handleTTSTextChange(newValue: string, groupIndex: number, itemIndex: number) {
    this.groups[groupIndex].items[itemIndex].answer.TTSText = newValue;
    this.dataService.setData('questions', this.groups);
  }

  enableEdit(index: number) {
    this.editIndex = index;
  }

  saveEdit() {
    this.editIndex = null;
    this.dataService.setData('questions', this.groups);
  }
}
