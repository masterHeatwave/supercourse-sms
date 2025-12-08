import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { videoType } from '../../types/types';
import { MoodsService } from '@gen-api/moods/moods.service';
import { TranslateModule } from '@ngx-translate/core';

interface VideoItem {
  id: string;
  source: string;
  title: string;
  type: string;
  viewCount: number;
}

interface CalmTimeResponse {
  data: {
    moodVideos: VideoItem[];
  };
}

@Component({
  selector: 'app-calm-time-view',
  standalone: true,
  imports: [ButtonModule, CommonModule, TranslateModule],
  templateUrl: './calm-time-view.component.html',
  styleUrl: './calm-time-view.component.scss'
})
export class CalmTimeViewComponent {
  @Output() backToMainView: EventEmitter<void> = new EventEmitter<void>();
  preload: string = 'auto';
  countedViews: Set<string> = new Set(); // Prevent duplicate counts
  watchProgress: Map<string, number> = new Map();
  videoList: VideoItem[] = [
    {
      id: '',
      source: '',
      title: '',
      type: '',
      viewCount: 0
    }
  ];

  constructor(private moodVideoService: MoodsService) {
    this.moodVideoService.getMoodsGetVideosByTypeVideoType<CalmTimeResponse>(videoType.CALM_TIME).subscribe({
      next: (response) => {
        this.videoList = response.data.moodVideos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      }
    });
  }

  onMetadataLoaded(video: HTMLVideoElement, videoItem: any) {}

  onPlay(video: HTMLVideoElement, videoItem: any) {}

  onPause(video: HTMLVideoElement, videoItem: any) {}

  onTimeUpdate(video: HTMLVideoElement, videoItem: VideoItem) {
    if (this.countedViews.has(videoItem.id)) return; // Already counted

    const currentTime = video.currentTime;
    this.watchProgress.set(videoItem.id, currentTime);

    if (currentTime >= 5) {
      this.countedViews.add(videoItem.id);
      this.registerView(videoItem);
    }
  }

  registerView(videoItem: VideoItem) {
    this.moodVideoService.patchMoodsRegisterViewVideoId(videoItem.id);
  }

  onClick(event: MouseEvent) {
    this.backToMainView.emit();
  }
}
