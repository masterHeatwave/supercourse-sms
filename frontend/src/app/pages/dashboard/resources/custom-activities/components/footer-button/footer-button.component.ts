import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-footer-button',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './footer-button.component.html',
  styleUrl: './footer-button.component.scss',
})
export class FooterButtonComponent {
  @Input() text: string = 'Text';
  @Input() showOn: Array<number> = [];

  @Output() buttonClick = new EventEmitter<number>();

  selectedNavigation: number = 1;

  constructor(public navigationService: NavigationService) {}

  handleClick() {
    this.buttonClick.emit();
  }
}
