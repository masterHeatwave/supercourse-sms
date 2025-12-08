import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
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
import { PrimaryNestedSelectComponent } from '@components/inputs/primary-nested-select/primary-nested-select.component';
import { CustomersService } from '@gen-api/customers/customers.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { selectUser } from '@store/auth/auth.selectors';
import { AppState } from '@store/app.state';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MediaUploadService } from '@services/media-upload.service';
import { take, forkJoin, Observable, of } from 'rxjs';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { API_ASSET_URL } from '@config/endpoints';

interface TreeNode {
  key: string;
  label: string;
  data: string;
  children?: TreeNode[];
}

interface PollOption {
  id: string;
  text: string;
}

@Component({
  selector: 'app-create-board-form',
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
    TranslateModule,
    OutlineButtonComponent,
    PrimaryNestedSelectComponent
  ],
  providers: [MessageService],
  templateUrl: './create-board-form.component.html',
  styleUrl: './create-board-form.component.scss'
})
export class CreateBoardFormComponent implements OnInit {
  @Input() postId: string | null = null; // If provided, component is in edit mode
  @Input() initialData: any = null; // Initial data for edit mode
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  #formBuilder = inject(FormBuilder);
  #customersService = inject(CustomersService);
  #taxisService = inject(TaxisService);
  #messageService = inject(MessageService);
  #translate = inject(TranslateService);
  #store = inject(Store<AppState>);
  #mediaUploadService = inject(MediaUploadService);

  postForm!: FormGroup;
  isSubmitting = false;
  uploadedImage: File | null = null;
  imagePreview: string | null = null;
  isEditMode = false;
  isUploadingImage = false;
  currentUserId: string = '';

  // Recipients tree data
  recipientsTree: TreeNode[] = [];
  selectedRecipients: any[] = [];

  // Poll data
  pollOptions: PollOption[] = [];
  showPollBuilder = false;

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
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  ngOnInit() {
    this.isEditMode = !!this.postId;
    this.initializeForm();
    this.loadRecipientsData();
    this.loadCurrentUserId();
    
    // If in edit mode and initial data is provided, populate the form
    if (this.isEditMode && this.initialData) {
      this.populateForm(this.initialData);
    }
  }

  loadCurrentUserId() {
    this.#store.select(selectUser).pipe(take(1)).subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
      }
    });
  }

  populateForm(data: any) {
    // Handle scheduled date and publish option
    let publishOption = 'now';
    let scheduledDate = null;
    if (data.status === 'draft') {
      publishOption = 'draft';
    } else if (data.status === 'scheduled' && data.scheduled_at) {
      publishOption = 'later';
      scheduledDate = new Date(data.scheduled_at);
    }

    // Handle expiration date - check both possible field names
    let expirationDate = null;
    if (data.expires_at) {
      expirationDate = new Date(data.expires_at);
    } else if (data.expiration_date) {
      expirationDate = new Date(data.expiration_date);
    }

    this.postForm.patchValue({
      title: data.title || '',
      content: data.content || '',
      priority: data.priority || 'normal',
      pinPost: data.pinned || false,
      publishOption: publishOption,
      scheduledDate: scheduledDate,
      expirationDate: expirationDate,
      recipients: data.recipients || [],
      pollQuestion: data.poll?.question || '',
      pollAllowMultiple: data.poll?.allow_multiple || false,
      allowReplies: data.allow_replies !== undefined ? Boolean(data.allow_replies) : false,
      allowReactions: data.allow_reactions !== undefined ? Boolean(data.allow_reactions) : false
    });

    // Set image preview if exists
    if (data.featured_image) {
      this.imagePreview = this.getImageUrl(data.featured_image);
    }

    // Set poll options if exists
    if (data.poll?.options && data.poll.options.length > 0) {
      this.pollOptions = data.poll.options.map((opt: any, index: number) => ({
        id: `option-${index}`,
        text: opt.text || opt
      }));
      // Only show poll builder if poll has values
      if (this.pollOptions.length > 0 && data.poll.question) {
        this.showPollBuilder = true;
      }
    }
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    // If it's already a full URL or starts with assets/, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('assets/')) {
      return imagePath;
    }
    // Otherwise, prepend the asset URL (works for both local and production)
    return `${API_ASSET_URL}/${imagePath}`;
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
      recipients: [[]],
      pollQuestion: [''],
      pollAllowMultiple: [false],
      allowReplies: [false],
      allowReactions: [false]
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

  async loadRecipientsData() {
    try {
      // Load customers (branches)
      const customersResponse = await this.#customersService.getCustomers().toPromise();
      const customers = customersResponse?.data || [];

      // Load taxis (classes)
      const taxisResponse = await this.#taxisService.getTaxis().toPromise();
      const taxis = taxisResponse?.data || [];

      // Build "All" category with nested structure
      const allChildren: TreeNode[] = [
        {
          key: 'all_administrators',
          label: 'Administrators',
          data: 'all_administrators',
          children: []
        },
        {
          key: 'all_non_academic',
          label: 'Non-academic users',
          data: 'all_non_academic',
          children: []
        },
        {
          key: 'all_classes',
          label: 'Classes',
          data: 'all_classes',
          children: [
            {
              key: 'all_classes_teachers',
              label: 'Teachers',
              data: 'all_classes_teachers'
            },
            {
              key: 'all_classes_students',
              label: 'Students',
              data: 'all_classes_students'
            },
            {
              key: 'all_classes_parents',
              label: 'Parents & Guardians',
              data: 'all_classes_parents'
            }
          ]
        }
      ];

      // Build individual branch structures
      const branchNodes: TreeNode[] = customers.map(customer => {
        const branchTaxis = taxis.filter(taxi => taxi.branch === customer.id);
        
        return {
          key: `branch_${customer.id}`,
          label: customer.name || 'Unnamed Branch',
          data: `branch_${customer.id}`,
          children: [
            {
              key: `branch_${customer.id}_administrators`,
              label: 'Administrators',
              data: `branch_${customer.id}_administrators`,
              children: []
            },
            {
              key: `branch_${customer.id}_non_academic`,
              label: 'Non-academic users',
              data: `branch_${customer.id}_non_academic`,
              children: []
            },
            {
              key: `branch_${customer.id}_classes`,
              label: 'Classes',
              data: `branch_${customer.id}_classes`,
              children: [
                ...branchTaxis.map(taxi => ({
                  key: `taxi_${taxi.id}`,
                  label: taxi.name || 'Unnamed Class',
                  data: `taxi_${taxi.id}`,
                  children: []
                })),
                {
                  key: `branch_${customer.id}_classes_teachers`,
                  label: 'Teachers',
                  data: `branch_${customer.id}_classes_teachers`,
                  children: []
                },
                {
                  key: `branch_${customer.id}_classes_students`,
                  label: 'Students',
                  data: `branch_${customer.id}_classes_students`,
                  children: []
                }
              ]
            }
          ]
        };
      });

      // Build final tree structure
      this.recipientsTree = [
        {
          key: 'all',
          label: 'All',
          data: 'all',
          children: allChildren
        },
        ...branchNodes
      ];
    } catch (error) {
      console.error('Error loading recipients data:', error);
      this.#messageService.add({
        severity: 'error',
        summary: this.#translate.instant('api_messages.error_title'),
        detail: this.#translate.instant('board.create.messages.load_recipients_failed')
      });
    }
  }

  onRecipientsChange(selectedKeys: any[]) {
    this.selectedRecipients = selectedKeys || [];
    // Update form control
    this.postForm.patchValue({ recipients: selectedKeys || [] });
  }

  onAddNewPoll() {
    this.showPollBuilder = true;
    if (this.pollOptions.length === 0) {
      this.addPollOption();
      this.addPollOption();
    }
  }

  addPollOption() {
    const newOption: PollOption = {
      id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: ''
    };
    this.pollOptions.push(newOption);
  }

  removePollOption(index: number) {
    this.pollOptions.splice(index, 1);
  }

  getSelectedRecipientsData() {
    const branches: string[] = [];
    const taxis: string[] = [];
    const users: string[] = [];

    // Handle selected recipients from tree select (array of strings or objects)
    const selectedKeys = Array.isArray(this.selectedRecipients) ? this.selectedRecipients : [];
    
    selectedKeys.forEach(item => {
      // Handle both string and object formats from TreeSelect
      const key = typeof item === 'string' ? item : item?.key || item?.data;
      
      if (key && typeof key === 'string') {
        // Handle "All" category selections
        if (key === 'all') {
          // "All" selected - could include all branches/taxis/users
          // This would need to be handled by the backend
        } else if (key === 'all_administrators' || key === 'all_non_academic' || 
                   key === 'all_classes_teachers' || key === 'all_classes_students' || 
                   key === 'all_classes_parents') {
          // Global user type selections - handled by backend
        } else if (key.startsWith('branch_')) {
          // Extract branch ID (remove prefix and any suffixes)
          const branchId = key.replace('branch_', '').split('_')[0];
          if (branchId && !branches.includes(branchId)) {
            branches.push(branchId);
          }
        } else if (key.startsWith('taxi_')) {
          // Individual class/taxi selection
          const taxiId = key.replace('taxi_', '');
          if (taxiId && !taxis.includes(taxiId)) {
            taxis.push(taxiId);
          }
        } else if (key.startsWith('user_')) {
          // Individual user selection
          const userId = key.replace('user_', '');
          if (userId && !users.includes(userId)) {
            users.push(userId);
          }
        }
        // Handle branch-specific selections (administrators, non-academic, classes, teachers, students)
        // These are represented by keys like "branch_{id}_administrators"
        // The backend will need to interpret these patterns
      }
    });

    return { branches, taxis, users };
  }

  /**
   * Format date for API submission without timezone conversion
   * This ensures the date is sent as the user selected it, not shifted by timezone
   */
  private formatDateForAPI(date: Date | string | null): string | undefined {
    if (!date) {
      return undefined;
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return undefined;
    }
    
    // Get the date components in local timezone
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    // Return as ISO date string (YYYY-MM-DD) without time component
    return `${year}-${month}-${day}`;
  }


  onSubmit() {
    if (this.postForm.valid) {
      this.isSubmitting = true;

      const formValue = this.postForm.value;
      const recipientsData = this.getSelectedRecipientsData();

      // Validate poll if shown
      if (this.showPollBuilder) {
        const validOptions = this.pollOptions.filter(opt => opt.text.trim() !== '');
        if (validOptions.length < 2) {
          this.#messageService.add({
            severity: 'warn',
            summary: this.#translate.instant('board.create.messages.validation_error'),
            detail: this.#translate.instant('board.create.messages.poll_min_options')
          });
          this.isSubmitting = false;
          return;
        }
      }

      // Prepare post data
      const tags: string[] = [];
      if (formValue.pinPost) {
        tags.push('featured');
      }

      // Determine status based on publish option
      let status = 'draft';
      let scheduled_at = undefined;
      
      if (formValue.publishOption === 'now') {
        status = 'published';
      } else if (formValue.publishOption === 'later') {
        status = 'scheduled';
        scheduled_at = this.formatDateForAPI(formValue.scheduledDate);
      }

      // Prepare poll data if exists
      let poll = undefined;
      if (this.showPollBuilder && this.pollOptions.length >= 2) {
        const validOptions = this.pollOptions.filter(opt => opt.text.trim() !== '');
        if (validOptions.length >= 2) {
          poll = {
            question: formValue.pollQuestion,
            allowMultiple: formValue.pollAllowMultiple,
            options: validOptions.map(opt => ({
              id: opt.id,
              text: opt.text,
              voteCount: 0
            }))
          };
        }
      }
      
      // If in edit mode and poll was removed (was present but now showPollBuilder is false)
      // explicitly set poll to null to delete it
      if (this.isEditMode && this.initialData?.poll && !this.showPollBuilder) {
        poll = null;
      }

      // Handle image upload if new image is selected
      const uploadTasks: Observable<string>[] = [];
      let imageUploadTask: Observable<string> | undefined;

      if (this.uploadedImage && this.uploadedImage instanceof File) {
        this.isUploadingImage = true;
        imageUploadTask = this.#mediaUploadService.uploadFile(this.uploadedImage);
        uploadTasks.push(imageUploadTask);
      }

      // Get current user ID for author
      const userId = this.currentUserId || this.getCurrentUserId();

      // Prepare the final post data
      const postData: any = {
        title: formValue.title,
        content: formValue.content,
        author: userId,
        status: status as any,
        priority: formValue.priority,
        pinned: formValue.pinPost,
        recipients: recipientsData,
        allow_reactions: !!formValue.allowReactions,
        allow_replies: !!formValue.allowReplies,
        tags
      };

      // Don't set likedBy on create - users should explicitly like posts using the like button
      // Only set likedBy in edit mode if we need to update it (but this shouldn't be needed)

      // Only include optional date fields if they have values
      if (scheduled_at) {
        postData.scheduled_at = scheduled_at;
      }
      const expirationDateFormatted = this.formatDateForAPI(formValue.expirationDate);
      if (expirationDateFormatted) {
        postData.expires_at = expirationDateFormatted;
      }
      
      // Always include poll field - null if removed, undefined if not changed, or poll object if new/updated
      if (poll !== undefined) {
        postData.poll = poll;
      }

      // If no image upload needed, submit directly
      if (uploadTasks.length === 0) {
        // Keep existing image if in edit mode
        if (this.isEditMode && this.initialData && this.initialData.featured_image) {
          postData.featured_image = this.initialData.featured_image;
        }

        // Emit data with postId if in edit mode
        if (this.isEditMode && this.postId) {
          this.formSubmit.emit({ postId: this.postId, data: postData });
        } else {
          this.formSubmit.emit(postData);
        }
        this.isSubmitting = false;
        return;
      }

      // Upload image and then submit
      forkJoin(uploadTasks).subscribe({
        next: (results) => {
          this.isUploadingImage = false;
          
          // Set the uploaded image path
          if (imageUploadTask) {
            postData.featured_image = results[0];
          }

          // Emit data with postId if in edit mode
          if (this.isEditMode && this.postId) {
            this.formSubmit.emit({ postId: this.postId, data: postData });
          } else {
            this.formSubmit.emit(postData);
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.isUploadingImage = false;
          this.isSubmitting = false;
          console.error('Error uploading image:', error);
          this.#messageService.add({
            severity: 'error',
            summary: this.#translate.instant('api_messages.error_title'),
            detail: this.#translate.instant('board.create.messages.image_upload_failed')
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

  getCurrentUserId(): string {
    // This is a fallback method - should use currentUserId property instead
    let currentUserId = '';
    this.#store.select(selectUser).pipe(take(1)).subscribe(user => {
      if (user && user.id) {
        currentUserId = user.id;
      }
    });
    return currentUserId;
  }

  onCancel() {
    this.formCancel.emit();
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

