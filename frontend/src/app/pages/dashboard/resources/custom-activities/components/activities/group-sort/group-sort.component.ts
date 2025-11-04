import { Component, inject, Input } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnswerComponent } from './answer/answer.component';
import { ImageSelectorComponent } from '../../image-selector/image-selector.component';
import { INITIAL_GROUP } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import { Question } from '../../../types';
import { WarningDialogComponent } from '../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'group-sort-activity',
  standalone: true,
  imports: [DragDropModule, CommonModule, FormsModule, AnswerComponent, ImageSelectorComponent, WarningDialogComponent],
  templateUrl: './group-sort.component.html',
  styleUrls: ['./group-sort.component.scss']
})
export class GroupSortComponent {
  @Input() groups = [JSON.parse(JSON.stringify(INITIAL_GROUP))];
  warningMessage: string = 'Warning';
  isWarningDialogVisible: boolean = false;
  editIndex: number | null = null;
  
  dataService = inject(DataService);
  
  constructor() {
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
    this.groups.push(JSON.parse(JSON.stringify(INITIAL_GROUP)));
    this.dataService.setData('questions', this.groups);
  }

  removeGroup(groupIndex: number) {
    if (this.groups.length > 1) {
      this.groups.splice(groupIndex, 1);
    } else {
      this.warningMessage = 'You cannot have less than one group.';
      this.isWarningDialogVisible = true;
    }
    this.dataService.setData('questions', this.groups);
  }

  addQuestion(groupIndex: number) {
    if (this.groups[groupIndex].items.length < 100) {
      this.groups[groupIndex].items.push({
        group: this.groups[groupIndex].groupNumber,
        itemNumber: 1,
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
    } else {
      this.warningMessage = 'You cannot have less than one item in each group.';
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
