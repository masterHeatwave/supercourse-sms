import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthcardComponent } from '@components/authcard/authcard.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, AuthcardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  context: string | null = null;

  ngOnInit(): void {
    this.context = this.route.snapshot.queryParamMap.get('context');
  }
  // Login functionality is handled by the AuthcardComponent
}
