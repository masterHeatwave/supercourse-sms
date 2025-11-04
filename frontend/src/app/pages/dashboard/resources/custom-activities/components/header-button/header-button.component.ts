import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-header-button',
  standalone: true,
  imports: [],
  templateUrl: './header-button.component.html',
  styleUrl: './header-button.component.scss',
})
export class HeaderButtonComponent {
  @Input() id!: number;
  @Input() text!: string;

  @Output() buttonClick = new EventEmitter<number>();

  constructor(public navigationService: NavigationService) {}

  handleClick() {
    this.buttonClick.emit(this.id);
  }
}
