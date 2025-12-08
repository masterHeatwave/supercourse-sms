import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardOverviewComponent } from '@components/board/board-overview/board-overview.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    BoardOverviewComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {}
