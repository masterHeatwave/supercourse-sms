import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EditorModule } from 'primeng/editor';
import { PostsService } from '@gen-api/posts/posts.service';
import { PostPostsBodyStatus } from '@gen-api/schemas/postPostsBodyStatus';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface RecipientGroup {
  label: string;
  value: string;
  checked: boolean;
  children?: RecipientGroup[];
}

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    CheckboxModule,
    RadioButtonModule,
    CalendarModule,
    FileUploadModule,
    ToastModule,
    EditorModule,
    TranslateModule
  ],
  providers: [MessageService],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreatePostComponent implements OnInit {
  #formBuilder = inject(FormBuilder);
  #postsService = inject(PostsService);
  #messageService = inject(MessageService);
  #router = inject(Router);
  #translate = inject(TranslateService);

  postForm!: FormGroup;
  isSubmitting = false;
  uploadedImage: File | null = null;
  imagePreview: string | null = null;

  // Recipients options
  recipients: RecipientGroup[] = [
    {
      label: 'board.create.recipients.all',
      value: 'all',
      checked: true,
      children: [
        { label: 'board.create.recipients.administrators', value: 'administrators', checked: true },
        { label: 'board.create.recipients.non_academic_users', value: 'non_academic_users', checked: true },
        {
          label: 'board.create.recipients.classes',
          value: 'classes',
          checked: true,
          children: [
            { label: 'board.create.recipients.teachers', value: 'teachers', checked: true },
            { label: 'board.create.recipients.students', value: 'students', checked: true },
            { label: 'board.create.recipients.parents_guardians', value: 'parents_guardians', checked: true }
          ]
        },
        {
          label: 'Anexos 30',
          value: 'anexos_30',
          checked: false,
          children: [
            { label: 'board.create.recipients.administrators', value: 'anexos_administrators', checked: false },
            { label: 'board.create.recipients.non_academic_users', value: 'anexos_non_academic', checked: false },
            {
              label: 'board.create.recipients.classes',
              value: 'anexos_classes',
              checked: false,
              children: [
                { label: 'Senior A Group 1', value: 'senior_a_group_1', checked: false },
                { label: 'board.create.recipients.teachers', value: 'anexos_teachers', checked: false },
                { label: 'board.create.recipients.students', value: 'anexos_students', checked: false },
                { label: '(class_name)', value: 'custom_class', checked: false }
              ]
            }
          ]
        }
      ]
    }
  ];

  // Priority options
  priorityOptions = [
    { label: 'board.create.priority.low', value: 'low', color: 'blue' },
    { label: 'board.create.priority.normal', value: 'normal', color: 'green' },
    { label: 'board.create.priority.high', value: 'high', color: 'red' }
  ];

  // Pin options
  pinOptions = [
    { label: 'board.create.pin.yes', value: true },
    { label: 'board.create.pin.no', value: false }
  ];

  // Publish options
  publishOptions = [
    { label: 'board.create.publish.now', value: 'now' },
    { label: 'board.create.publish.later', value: 'later' },
    { label: 'board.create.publish.draft', value: 'draft' }
  ];

  // Editor configuration
  editorConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
    ],
    placeholder: 'Write your post content here...'
  };

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.postForm = this.#formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['normal', Validators.required],
      pinPost: [false],
      publishOption: ['now', Validators.required],
      scheduledDate: [null],
      expirationDate: [null],
      allowReplies: [false],
      allowReactions: [true],
      recipients: [[]]
    });

    // Watch for publish option changes
    this.postForm.get('publishOption')?.valueChanges.subscribe((value) => {
      const scheduledDateControl = this.postForm.get('scheduledDate');
      if (value === 'later') {
        scheduledDateControl?.setValidators([Validators.required]);
      } else {
        scheduledDateControl?.clearValidators();
      }
      scheduledDateControl?.updateValueAndValidity();
    });
  }

  onImageUpload(event: any) {
    const file = event.files[0];
    if (file) {
      this.uploadedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      this.#messageService.add({
        severity: 'success',
        summary: this.#translate.instant('api_messages.success_title'),
        detail: this.#translate.instant('board.create.messages.image_uploaded')
      });
    }
  }

  onImageRemove() {
    this.uploadedImage = null;
    this.imagePreview = null;
  }

  onRecipientChange(recipient: RecipientGroup, event: any) {
    const checked = event.checked || event;
    recipient.checked = checked;

    // If this has children, update them too
    if (recipient.children) {
      this.updateChildrenRecursively(recipient.children, checked);
    }

    // Update parent if all siblings are checked/unchecked
    this.updateParentRecipients();
  }
  private updateChildrenRecursively(children: RecipientGroup[], checked: boolean) {
    children.forEach((child) => {
      child.checked = checked;
      if (child.children) {
        this.updateChildrenRecursively(child.children, checked);
      }
    });
  }

  private updateParentRecipients() {
    // Logic to update parent checkboxes based on children state
    // This is a simplified version - you might want to implement more complex logic
  }

  getSelectedRecipients(): string[] {
    const selected: string[] = [];
    this.collectSelectedRecipients(this.recipients, selected);
    return selected;
  }

  private collectSelectedRecipients(recipients: RecipientGroup[], selected: string[]) {
    recipients.forEach((recipient) => {
      if (recipient.checked && recipient.value !== 'all') {
        selected.push(recipient.value);
      }
      if (recipient.children) {
        this.collectSelectedRecipients(recipient.children, selected);
      }
    });
  }

  onAddNewPoll() {
    // Implement poll functionality
    this.#messageService.add({
      severity: 'info',
      summary: this.#translate.instant('board.create.messages.feature_title'),
      detail: this.#translate.instant('board.create.messages.poll_todo')
    });
  }

  onSubmit() {
    if (this.postForm.valid) {
      this.isSubmitting = true;

      const formValue = this.postForm.value;
      const selectedRecipients = this.getSelectedRecipients();

      // Prepare post data
      const tags: string[] = [];
      if (formValue.pinPost) {
        tags.push('featured');
      }
      const postData = {
        title: formValue.title,
        content: formValue.content,
        author: 'Current User', // This should be fetched from the current user context
        status: formValue.publishOption === 'draft' ? PostPostsBodyStatus.draft : PostPostsBodyStatus.published,
        tags,
        featured_image: this.uploadedImage ? 'uploaded' : undefined // This would be handled by file upload
      };

      this.#postsService
        .postPosts(postData)
        .pipe(finalize(() => (this.isSubmitting = false)))
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
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.postForm.controls).forEach((key) => {
        this.postForm.get(key)?.markAsTouched();
      });

      this.#messageService.add({
        severity: 'warn',
        summary: this.#translate.instant('board.create.messages.validation_error'),
        detail: this.#translate.instant('board.create.messages.fill_required')
      });
    }
  }

  onCancel() {
    this.#router.navigate(['/dashboard/board']);
  }

  // Helper method to check if a field has error
  hasError(fieldName: string): boolean {
    const field = this.postForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper method to get field error message
  getErrorMessage(fieldName: string): string {
    const field = this.postForm.get(fieldName);
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
