import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SingleBoardComponent } from '@components/board/single-board/single-board.component';

@Component({
  selector: 'app-board-single-post',
  standalone: true,
  imports: [CommonModule, SingleBoardComponent],
  template: `
    <app-single-board 
      *ngIf="postId"
      [postId]="postId"
      (backClicked)="goBack()"
      (editClicked)="editPost($event)"
      (pollVoteSubmitted)="onPollVoteSubmitted()"
    ></app-single-board>
  `,
})
export class SinglePostComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);

  postId: string | null = null;

  ngOnInit(): void {
    this.postId = this.#route.snapshot.paramMap.get('id');
    if (!this.postId) {
      this.goBack();
    }
  }

  goBack() {
    this.#router.navigate(['/dashboard/board']);
  }

  editPost(id: string) {
    this.#router.navigate(['/dashboard/board/edit', id]);
  }

  onPollVoteSubmitted() {
    // Handle poll vote submission if needed
  }
}
