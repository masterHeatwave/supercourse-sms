import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [ButtonModule, TranslateModule, RouterLink],
  templateUrl: './primary-button.component.html',
  styleUrl: './primary-button.component.scss'
})
export class PrimaryButtonComponent {
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon: string = '';
  @Input() iconPos: 'left' | 'right' = 'left';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() styleClass: string = '';
  @Input() size: 'small' | 'medium' | 'large' | undefined = 'small';
  @Input() fullWidth: boolean = false;
  @Input() clear: boolean = false;
  @Input() href: string = '';
  @Input() query: { [key: string]: string | number | boolean } | null = null;
  @Input() form: string = '';
}
