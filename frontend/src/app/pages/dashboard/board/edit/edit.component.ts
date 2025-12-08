import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PostsService } from '@gen-api/posts/posts.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreateBoardFormComponent } from '@components/board/create-board-form/create-board-form.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    TranslateModule,
    CreateBoardFormComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div *ngIf="loading" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <i class="pi pi-spin pi-spinner text-primary" style="font-size: 3rem;"></i>
    </div>
    <app-create-board-form
      *ngIf="!loading && postId && postData"
      [postId]="postId"
      [initialData]="postData"
      (formSubmit)="onPostUpdated($event)"
      (formCancel)="goBack()"
    ></app-create-board-form>
  `,
})
export class EditPostComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #posts = inject(PostsService);
  #msg = inject(MessageService);
  #translate = inject(TranslateService);

  postId: string | null = null;
  postData: any = null;
  loading = false;

  ngOnInit(): void {
    this.postId = this.#route.snapshot.paramMap.get('id');
    if (!this.postId) {
      this.#msg.add({ 
        severity: 'error', 
        summary: this.#translate.instant('api_messages.error_title'), 
        detail: 'Invalid post id' 
      });
      this.goBack();
      return;
    }

    // Fetch the post data
    this.loadPostData();
  }

  loadPostData() {
    if (!this.postId) return;

    this.loading = true;
    this.#posts.getPostsId(this.postId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: any) => {
          this.postData = response.data || response;
        },
        error: (err) => {
          console.error('Error loading post:', err);
          this.#msg.add({ 
            severity: 'error', 
            summary: this.#translate.instant('api_messages.error_title'), 
            detail: this.#translate.instant('board.messages.failed_to_fetch') 
          });
          this.goBack();
        }
      });
  }

  onPostUpdated(event: { postId: string; data: any }) {
    this.#posts.putPostsId(event.postId, event.data).subscribe({
      next: () => {
        this.#msg.add({ 
          severity: 'success', 
          summary: this.#translate.instant('api_messages.success_title'), 
          detail: this.#translate.instant('board.messages.post_updated')
        });
        this.#router.navigate(['/dashboard/board']);
      },
      error: (err) => {
        console.error(err);
        this.#msg.add({ 
          severity: 'error', 
          summary: this.#translate.instant('api_messages.error_title'), 
          detail: this.#translate.instant('board.messages.update_failed') 
        });
      }
    });
  }

  goBack() {
    this.#router.navigate(['/dashboard/board']);
  }
}
