import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import * as Constants from '../../Constants';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-player-mode',
  standalone: true,
  imports: [CardModule, ButtonModule, CommonModule, TranslateModule],
  templateUrl: './player-mode.component.html',
  styleUrl: './player-mode.component.scss'
})
export class PlayerModeComponent implements OnChanges {
  @Input() id!: number;
  @Input() hasData: boolean = false;
  @Input() selectedMode = '';
  constants = Constants;

  constructor(public navigationService: NavigationService, private dataService: DataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hasData']) {
      this.handleDataChange();
    }
  }

  handleDataChange(): void {
    if (this.hasData === true) {
      this.navigationService.setSelectedButtonId(2, true);
    }
  }

  onCardClick(mode: string): void {
    this.selectedMode = mode;
    this.dataService.setData('playerMode', mode);
  }
}
