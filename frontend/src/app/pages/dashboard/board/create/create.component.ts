import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PostsService } from '@gen-api/posts/posts.service';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreateBoardFormComponent } from '@components/board/create-board-form/create-board-form.component';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    TranslateModule,
    CreateBoardFormComponent
  ],
  providers: [MessageService],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreatePostComponent {
  #postsService = inject(PostsService);
  #messageService = inject(MessageService);
  #router = inject(Router);
  #translate = inject(TranslateService);

  onPostCreated(postData: any) {
    this.#postsService
      .postPosts(postData)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (response) => {
          this.#messageService.add({
            severity: 'success',
            summary: this.#translate.instant('api_messages.success_title'),
            detail: this.#translate.instant('board.create.messages.created')
          });

          // Navigate back to board
          this.#router.navigate(['/dashboard/board']);
        },
        error: (error) => {
          console.error('Error creating post:', error);
          this.#messageService.add({
            severity: 'error',
            summary: this.#translate.instant('api_messages.error_title'),
            detail: this.#translate.instant('board.create.messages.create_failed')
          });
        }
      });
  }

  onCancel() {
    this.#router.navigate(['/dashboard/board']);
  }
}
