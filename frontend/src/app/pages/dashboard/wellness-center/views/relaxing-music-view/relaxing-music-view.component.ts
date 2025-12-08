import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MoodsService } from '@gen-api/moods/moods.service';
import { videoType } from '../../types/types';
import { TranslateModule } from '@ngx-translate/core';

interface VideoItem {
  id: string;
  source: string;
  title: string;
  type: string;
  viewCount: number;
}

interface RelaxingMusicResponse {
  data: {
    moodVideos: VideoItem[];
  };
}

@Component({
  selector: 'app-relaxing-music-view',
  standalone: true,
  imports: [ButtonModule, CommonModule, TranslateModule],
  templateUrl: './relaxing-music-view.component.html',
  styleUrl: './relaxing-music-view.component.scss'
})
export class RelaxingMusicViewComponent {
  @Output() backToMainView: EventEmitter<void> = new EventEmitter<void>();

  preload: string = 'auto';
  videoList: VideoItem[] = [];

  countedViews: Set<string> = new Set();

  constructor(private moodVideoService: MoodsService) {
    this.moodVideoService.getMoodsGetVideosByTypeVideoType<RelaxingMusicResponse>(videoType.RELAXING_MUSIC).subscribe({
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
