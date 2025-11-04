import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PostsService } from '@gen-api/posts/posts.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CheckboxModule,
    EditorModule,
    ToastModule,
    TranslateModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="p-4">
      <div class="flex align-items-center justify-content-between mb-3">
        <button pButton type="button" [label]="'common.back' | translate" icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
        <h2 class="m-0 text-2xl font-bold text-primary">{{ 'common.edit' | translate }} {{ 'board.title' | translate }}</h2>
      </div>

      <div *ngIf="loading" class="flex justify-content-center p-5">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>

      <form *ngIf="!loading && form" [formGroup]="form" (ngSubmit)="onSubmit()" class="custom-card p-4">
        <div class="flex flex-column gap-3">
          <div>
            <label class="text-sm text-700 mb-1 block">{{ 'board.create.fields.title' | translate }}</label>
            <input pInputText type="text" formControlName="title" class="w-full" />
          </div>

          <div>
            <label class="text-sm text-700 mb-1 block">{{ 'board.create.fields.content' | translate }}</label>
            <p-editor formControlName="content" [style]="{ height: '300px' }"></p-editor>
          </div>

          <div class="flex align-items-center gap-2">
            <p-checkbox inputId="pinPost" binary="true" formControlName="pinPost"></p-checkbox>
            <label for="pinPost">{{ 'board.create.options.pin' | translate }}</label>
          </div>

          <div class="flex gap-2">
            <button pButton type="submit" [label]="'common.save' | translate" [disabled]="saving || form.invalid"></button>
            <button pButton type="button" [label]="'common.cancel' | translate" class="p-button-secondary p-button-outlined" (click)="goBack()"></button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class EditPostComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #posts = inject(PostsService);
  #fb = inject(FormBuilder);
  #msg = inject(MessageService);
  #translate = inject(TranslateService);

  loading = false;
  saving = false;
  form!: FormGroup;
  postId!: string;
  currentTags: string[] = [];
  currentStatus: any;

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (!id) {
      this.#msg.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: 'Invalid post id' });
      this.goBack();
      return;
    }
    this.postId = id;
    this.load();
  }

  private buildForm(data: any) {
    this.form = this.#fb.group({
      title: [data.title || '', [Validators.required, Validators.minLength(3)]],
      content: [data.content || '', [Validators.required, Validators.minLength(10)]],
      pinPost: [Array.isArray(data.tags) && data.tags.includes('featured')]
    });
  }

  load() {
    this.loading = true;
    this.#posts.getPostsId(this.postId).subscribe({
      next: (data: any) => {
        const raw = data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
        this.currentTags = Array.isArray(raw?.tags) ? raw.tags.slice() : [];
        this.currentStatus = raw?.status;
        this.buildForm(raw);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.#msg.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: this.#translate.instant('board.messages.failed_to_fetch') });
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    const value = this.form.value;

    // Update tags for featured
    let tags = this.currentTags.slice();
    const hasFeatured = tags.includes('featured');
    if (value.pinPost && !hasFeatured) tags.push('featured');
    if (!value.pinPost && hasFeatured) tags = tags.filter(t => t !== 'featured');

    const body: any = {
      title: value.title,
      content: value.content,
      tags,
      status: this.currentStatus,
    };

    this.#posts.putPostsId(this.postId, body).subscribe({
      next: () => {
        this.saving = false;
        this.#msg.add({ severity: 'success', summary: this.#translate.instant('api_messages.success_title'), detail: this.#translate.instant('common.save') + ' ' + this.#translate.instant('board.title') });
        this.#router.navigate(['/dashboard/board', this.postId]);
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.#msg.add({ severity: 'error', summary: this.#translate.instant('api_messages.error_title'), detail: this.#translate.instant('board.messages.failed_to_fetch') });
      }
    });
  }

  goBack() {
    this.#router.navigate(['/dashboard/board']);
  }
}
