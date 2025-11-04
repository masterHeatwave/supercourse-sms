import { Component, ElementRef, Input, SimpleChanges, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';

declare function createUnityInstance(a: any, b: any, c: any): any;

@Component({
  selector: 'app-unity',
  standalone: true,
  imports: [],
  templateUrl: './unity.component.html',
  styleUrl: './unity.component.scss'
})
export class UnityComponent {
  @ViewChild('unityContainer', { static: true }) unityContainer!: ElementRef;

  unityInstance: any;
  unityReady: boolean = false;
  @Input() data = {
    _id: '',
    activityType: '',
    playerMode: '',
    title: '',
    description: '',
    template: '',
    settings: {},
    questions: [
      {
        questionNumber: 1,
        questionText: '',
        document: '',
        option: '',
        answers: [
          {
            answerText: '',
            TTSText: '',
            imageURL: '',
            label: '',
            isCorrect: false,
            item1: {
              answerText: '',
              imageURL: '',
              TTSText: ''
            },
            item2: {
              answerText: '',
              imageURL: '',
              TTSText: ''
            }
          }
        ],
        distractors: [],
        imageURL: '',
        groupNumber: 1,
        groupName: '',
        items: [
          {
            group: 1,
            itemNumber: 1,
            answer: {
              imageURL: '',
              TTSText: '',
              answerText: ''
            }
          }
        ]
      }
    ]
  };

  @Input() extraSettings = {
    animations: false,
    timer: 0,
    players: 0,
    questions: 0
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['extraSettings']) {
      if (this.unityReady && this.unityInstance) {
        this.unityInstance.SendMessage(
          'DataManager',
          'ReceiveData',
          JSON.stringify({
            data: this.data,
            extraSettings: this.extraSettings
          })
        );
      }
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    var container = document.querySelector('#unity-container') as HTMLElement;
    var canvas = document.querySelector('#unity-canvas') as HTMLElement;
    var loadingBar = document.querySelector('#unity-loading-bar') as HTMLElement;
    var progressBarFull = document.querySelector('#unity-progress-bar-full') as HTMLElement;
    var fullscreenButton = document.querySelector('#unity-fullscreen-button') as HTMLElement;
    var warningBanner = document.querySelector('#unity-warning') as HTMLElement;

    function unityShowBanner(msg: string, type: string) {
      function updateBannerVisibility() {
        warningBanner!.style.display = warningBanner!.children.length ? 'block' : 'none';
      }
      var div = document.createElement('div');
      div.innerHTML = msg;
      warningBanner!.appendChild(div);
      if (type == 'error') div.style.backgroundColor = 'red';
      else {
        if (type == 'warning') div.style.backgroundColor = 'yellow';
        setTimeout(function () {
          warningBanner!.removeChild(div);
          updateBannerVisibility();
        }, 5000);
      }
      updateBannerVisibility();
    }

    var buildUrl = environment.unityBaseUrl + '/Build'; //'assets/Unity/Build';
    var loaderUrl = buildUrl + '/Build.loader.js';
    var config = {
      dataUrl: buildUrl + '/Build.data',
      frameworkUrl: buildUrl + '/Build.framework.js',
      codeUrl: buildUrl + '/Build.wasm',
      streamingAssetsUrl: environment.unityBaseUrl + '/StreamingAssets', //'/assets/Unity/StreamingAssets', //'assets/Unity/StreamingAssets',
      companyName: 'Super Course ELT Publishings',
      productName: 'Super Course games',
      productVersion: '4.0.5',
      showBanner: unityShowBanner
    };

    // config.matchWebGLToCanvasSize = false;

    // config.autoSyncPersistentDataPath = true;

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
      document.getElementsByTagName('head')[0].appendChild(meta);
      container.className = 'unity-mobile';
      canvas.className = 'unity-mobile';

      // config.devicePixelRatio = 1;
    } else {
      canvas.style.width = '960px';
      canvas.style.height = '540px';
    }

    loadingBar.style.display = 'block';

    var script = document.createElement('script');
    script.src = loaderUrl;
    script.onload = () => {
      createUnityInstance(canvas, config, (progress: number) => {
        progressBarFull.style.width = 100 * progress + '%';
      })
        .then((unityInstance: any) => {
          this.unityInstance = unityInstance;
          loadingBar.style.display = 'none';
          fullscreenButton.style.display = 'block';
          fullscreenButton.onclick = () => {
            this.unityInstance.SetFullscreen(1);
          };
        })
        .catch((message: string) => {
          alert(message);
        });
    };

    document.body.appendChild(script);

    (window as any).dataReady = (data: any) => {
      console.log('data', data);
    };

    (window as any).unityReady = () => {
      if (this.unityInstance) {
        this.unityReady = true;
        const obj = {
          data: this.data,
          extraSettings: this.extraSettings
        };
        console.log(obj);
        this.unityInstance.SendMessage(
          'DataManager',
          'ReceiveData',
          JSON.stringify({
            data: this.data,
            extraSettings: this.extraSettings
          })
        );
      } else {
        console.log('unity is not ready');
      }
    };
  }
}
