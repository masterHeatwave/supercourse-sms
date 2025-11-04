import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    RouterModule, RouterLink, RouterLinkActive,
    ButtonModule
  ],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss'
})

export class ResourcesComponent {
  
}
