import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { studentsConf, studentsInterfaceConf, teachersConf, teachersInterfaceConf } from '@config/os_roles.config';
import { Session } from '@gen-api/schemas';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { Store } from '@ngrx/store';
import { IAuthState } from '@store/auth/auth.model';
import { selectAuthState } from '@store/auth/auth.selectors';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-online-session',
  standalone: true,
  imports: [],
  templateUrl: './online-session.component.html',
  styleUrl: './online-session.component.scss'
})
export class OnlineSessionComponent implements OnInit {
  sessionId: string | null = null;
  session: Session | null = null;
  roomName: string = '';
  user: any | null = null;
  selectedRole: string = '';

  #router = inject(Router);
  #route = inject(ActivatedRoute);
  #sessionsService = inject(SessionsService);
  #store = inject(Store);

  ngOnInit(): void {
    this.#store.select(selectAuthState).subscribe((authState: IAuthState) => {
      this.user = authState.user;
      if (authState.currentRoleTitle) {
        this.selectedRole = authState.currentRoleTitle;
      }
      this.sessionId = this.#route.snapshot.paramMap.get('id');
      this.startOnlineSession();
    })
  }

  startOnlineSession() {

    if (!this.sessionId || !this.user || !this.selectedRole) return;

    this.#sessionsService
      .getSessionsId(this.sessionId)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.session = response.data;
            this.roomName = this.session.taxi.name;
          }



          this.#sessionsService.postSessionsOnlineSessionToken({ id: this.user.id, roomName: this.roomName, currentRoleTitle: this.selectedRole })
            .subscribe({
              next: (response) => {

                console.log(response.data.token)
                const domain = 'sc-vcr.xyz';
                let conf = {};
                let interfaceConf = {};

                if (['STUDENT', 'PARENT'].includes(this.selectedRole)) {
                  conf = studentsConf;
                  interfaceConf = studentsInterfaceConf;
                }

                if (['ADMIN', 'MANAGER', 'TEACHER'].includes(this.selectedRole)) {
                  conf = teachersConf;
                  interfaceConf = teachersInterfaceConf;
                }

                const options = {
                  roomName: this.roomName,
                  // width: '100%',
                  // height: '100%',
                  configOverwrite: conf,
                  interfaceConfigOverwrite: interfaceConf,
                  parentNode: document.querySelector('#online-session-container'),
                  // userInfo: {
                  //   displayName: this.userService.userName
                  // },
                  lang: 'el',
                  jwt: response.data.token
                };

                const api = new JitsiMeetExternalAPI(domain, options);

                api.addEventListeners({
                  readyToClose: this.handleClose,
                  // videoConferenceJoined: handleVideoConferenceJoined,
                  // videoConferenceLeft: handleVideoConferenceLeft,
                  // participantLeft: handleParticipantLeft,
                  // participantJoined: handleParticipantJoined,
                  // participantRoleChanged: handleParticipantRoleChanged,
                  // participantKickedOut: handleParticipantKickedOut,
                  // audioMuteStatusChanged: handleMuteStatus,
                  // videoMuteStatusChanged: handleVideoStatus,
                  // incomingMessage: handleIncomingMessage,
                  // outgoingMessage: handleOutgoingMessage,
                  // recordingStatusChanged: handleRecordingStatusChanged
                })

              },
              error: (error) => {
                console.error('Error creating online session token:', error);
              }
            })
        },
        error: (error) => {
          console.error('Error loading session:', error);
        }
      });
  }

  handleClose = (event: any) => {
    this.#router.navigate([`/dashboard/sessions/${this.sessionId}`]);
  }

}
