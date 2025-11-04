import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss'
})
export class FormErrorComponent {
  @Input() error: any;
  @Input() size?: 'sm' | 'md' | 'lg' = 'sm';
  @Input() color?: string = 'text-red-500';
}
