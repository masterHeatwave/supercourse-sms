import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PostsService } from '@gen-api/posts/posts.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-board-single-post',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, TranslateModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="p-4">
      <div class="flex align-items-center justify-content-between mb-3">
        <button pButton type="button" [label]="'common.back' | translate" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
        <button pButton type="button" [label]="'common.edit' | translate" icon="pi pi-pencil" (click)="editPost()"></button>
      </div>

      <div *ngIf="loading" class="flex justify-content-center p-5">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>

      <div *ngIf="!loading && post" class="custom-card p-4">
        <img *ngIf="post.featured_image" [src]="post.featured_image" alt="Featured" class="w-full border-round mb-3" />
        <h1 class="text-3xl font-bold text-primary mb-2">{{ post.title }}</h1>
        <div class="text-600 mb-3">
          <span>{{ post.authorName }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatDate(post.published_at || post.createdAt) }}</span>
        </div>
        <div class="prose" [innerHTML]="post.content"></div>
        <div class="mt-3 flex gap-2" *ngIf="post.tags?.length">
          <span *ngFor="let tag of post.tags" class="bg-primary text-white text-xs px-2 py-1 border-round">{{ tag }}</span>
        </div>
      </div>
    </div>
  `,
})
export class SinglePostComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #posts = inject(PostsService);
  #msg = inject(MessageService);
  #translate = inject(TranslateService);

  loading = false;
  post: any | null = null;

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (!id) {
      this.#msg.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: 'Invalid post id' });
      this.goBack();
      return;
    }
    this.fetch(id);
  }

  fetch(id: string) {
    this.loading = true;
    this.#posts.getPostsId(id).subscribe({
      next: (data: any) => {
        // API returns an envelope { data, success, status }
        const raw = data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
        // Normalize for template
        this.post = {
          ...raw,
          id: raw?.id || raw?._id,
          authorName: typeof raw?.author === 'object' && raw?.author ? (raw.author.name || this.#translate.instant('common.unknown')) : (raw?.author || this.#translate.instant('common.unknown')),
        };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.#msg.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: this.#translate.instant('board.messages.failed_to_fetch') });
      },
    });
  }

  formatDate(date?: string) {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '';
    }
  }

  goBack() {
    this.#router.navigate(['/dashboard/board']);
  }

  editPost() {
    if (!this.post?.id) return;
    this.#router.navigate(['/dashboard/board/edit', this.post.id]);
  }
}
