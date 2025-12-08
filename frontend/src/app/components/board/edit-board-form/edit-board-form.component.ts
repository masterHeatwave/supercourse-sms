import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  selector: 'app-edit-board-form',
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
  templateUrl: './edit-board-form.component.html',
  styleUrl: './edit-board-form.component.scss'
})
export class EditBoardFormComponent implements OnInit {
  @Input() postId!: string;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  #posts = inject(PostsService);
  #fb = inject(FormBuilder);
  #msg = inject(MessageService);
  #translate = inject(TranslateService);

  loading = false;
  saving = false;
  form!: FormGroup;
  currentTags: string[] = [];
  currentStatus: any;

  ngOnInit(): void {
    if (!this.postId) {
      this.#msg.add({ 
        severity: 'error', 
        summary: this.#translate.instant('api_messages.error_title'), 
        detail: 'Invalid post id' 
      });
      this.onCancel();
      return;
    }
    this.load();
  }

  private buildForm(data: any) {
    this.form = this.#fb.group({
      title: [data.title || '', [Validators.required, Validators.minLength(3)]],
      content: [data.content || '', [Validators.required, Validators.minLength(10)]],
      pinPost: [data.pinned || false]
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
        this.#msg.add({ 
          severity: 'error', 
          summary: this.#translate.instant('api_messages.error_title'), 
          detail: this.#translate.instant('board.messages.failed_to_fetch') 
        });
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

    const body: any = {
      title: value.title,
      content: value.content,
      pinned: value.pinPost,
      tags: this.currentTags,
      status: this.currentStatus,
    };

    this.formSubmit.emit({ postId: this.postId, data: body });
    this.saving = false;
  }

  onCancel() {
    this.formCancel.emit();
  }

  // Helper method to check if a field has error
  hasError(fieldName: string): boolean {
    const field = this.form?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper method to get field error message
  getErrorMessage(fieldName: string): string {
    const field = this.form?.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}

