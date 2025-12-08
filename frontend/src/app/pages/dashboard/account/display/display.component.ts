import { Component } from '@angular/core';
import { DisplayViewComponent } from '@components/account/display-view/display-view.component';

@Component({
  selector: 'app-display-page',
  standalone: true,
  imports: [DisplayViewComponent],
  template: '<app-display-view></app-display-view>'
})
export class DisplayComponent {}

