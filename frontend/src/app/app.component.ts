import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { AuthActions } from '@store/auth/auth.actions';
import { SocketService } from '@services/socket/socket.service';
import { AuthStoreService } from '@services/messaging/auth-store.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'supercourse-sms-web';

  constructor(
    private translate: TranslateService,
    private store: Store<AppState>,
    private socketService: SocketService,
    private authService: AuthStoreService 
  ) {
    translate.addLangs(['en', 'el']);
    translate.setDefaultLang('en');
    translate.use('en');
    
    // ✅ Initialize socket immediately
    // console.log.log('🚀 App initializing socket service');
  }

  ngOnInit() {
    // Initialize auth state to reset loading state on app bootstrap
    this.store.dispatch(AuthActions.init());
    
    // ✅ Wait for user authentication, then authenticate socket
    this.authService.getCurrentUserID$()
      .pipe(
        filter(userId => !!userId), // Wait for valid userId
        take(1) // Only take first emission
      )
      .subscribe(userId => {
        // console.log.log('🔐 User authenticated, initializing socket for userId:', userId);
        
        // Socket service will automatically authenticate via its setupAuthSubscription
        // But we can also manually ensure connection is ready
        this.socketService.waitForConnection().then(() => {
          // console.log.log('✅ Socket ready for use');
        });
      });
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }
}