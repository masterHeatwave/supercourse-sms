import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MoodsService } from '@gen-api/moods/moods.service';
import { ButtonModule } from 'primeng/button';
import { videoType } from '../../types/types';
import { TranslateModule } from '@ngx-translate/core';

interface VideoItem {
  id: string;
  source: string;
  title: string;
  type: string;
  viewCount: number;
}

interface MeditationResponse {
  data: {
    moodVideos: VideoItem[];
  };
}

@Component({
  selector: 'app-meditation-view',
  standalone: true,
  imports: [ButtonModule, CommonModule, TranslateModule],
  templateUrl: './meditation-view.component.html',
  styleUrl: './meditation-view.component.scss'
})
export class MeditationViewComponent {
  @Output() backToMainView: EventEmitter<void> = new EventEmitter<void>();

  preload: string = 'auto';
  videoList: VideoItem[] = [];

  countedViews: Set<string> = new Set();

  constructor(private moodVideoService: MoodsService) {
    moodVideoService.getMoodsGetVideosByTypeVideoType<MeditationResponse>(videoType.MEDITATION).subscribe({
      next: (response) => {
        this.videoList = response.data.moodVideos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }
    });
  }

  onMetadataLoaded(video: HTMLVideoElement, videoItem: any) {}

  onPlay(video: HTMLVideoElement, videoItem: any) {}

  onPause(video: HTMLVideoElement, videoItem: any) {}

  registerView(videoItem: VideoItem) {
    this.moodVideoService.patchMoodsRegisterViewVideoId(videoItem.id);
  }

  onClick(event: MouseEvent) {
    this.backToMainView.emit();
  }
}
