import { Injectable, inject, OnDestroy } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment';
import { faker } from '@faker-js/faker';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { UsersService } from '@gen-api/users/users.service';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { MaterialsService } from '@gen-api/materials/materials.service';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { take, takeUntil } from 'rxjs/operators';
import { CustomersService } from '@gen-api/customers/customers.service';
import { Subject } from 'rxjs';
import { SUBJECT_OPTIONS, LEVEL_OPTIONS } from '../../../utils/subject-mapping.util';

@Injectable({
    providedIn: 'root'
})

export class ClassFormFields implements OnDestroy {
    private academicPeriodsService = inject(AcademicPeriodsService);
    private usersService = inject(UsersService);
    private inventoryService = inject(InventoryService);
    private materialsService = inject(MaterialsService);
    private customersApiService = inject(CustomersService);
    private store = inject(Store<AppState>);
    
    private classInfoFields: FormlyFieldConfig[] = [];
    private dataLoaded = false;
    private academicPeriodsData: any[] = [];
    private teachersData: any[] = [];
    private studentsData: any[] = [];
    private materialsData: any[] = [];
    private branchesData: any[] = [];
    private activeAcademicYear: any = null;
    private currentBranchName: string = 'Loading...';
    private destroy$ = new Subject<void>();
    
    // Track individual loading states
    private loadingStates = {
        academicPeriods: false,
        teachers: false,
        students: false,
        materials: false,
        branches: false
    };

    constructor() {
        this.classInfoFields = this.buildClassInfoFields();
        this.setupAuthStateSubscription();
        this.loadDynamicData();
    }

    getClassInfoFields(defaultValues?: any, isEditMode: boolean = false): FormlyFieldConfig[] {
        if (defaultValues) {
            return this.buildClassInfoFields(defaultValues, isEditMode);
        }
        return this.classInfoFields;
    }

    getActiveAcademicYearId(): string | null {
        return this.activeAcademicYear?.id || null;
    }

    /**
     * Get academic periods for the currently active academic year (both is_current and is_manual_active)
     * Used in create mode
     */
    getFilteredAcademicPeriods(): any[] {
        if (!this.activeAcademicYear?.id) {
            console.error('[ClassFormFields] No active academic year found');
            return [];
        }

        console.log('[ClassFormFields] Active academic year:', this.activeAcademicYear);

        console.log('[ClassFormFields] Academic periods data:', this.academicPeriodsData);

        // Filter periods that belong to the active academic year
        return this.academicPeriodsData.filter((period: any) => {
            const yearId = typeof period.academic_year === 'object' 
                ? period.academic_year?.id || period.academic_year?._id 
                : period.academic_year;
            
            return yearId === this.activeAcademicYear.id;
        });
    }

    /**
     * Get academic periods for a specific academic year ID
     * Used in edit mode
     */
    getAcademicPeriodsByYearId(yearId: string): any[] {
        if (!yearId) {
            return [];
        }

        return this.academicPeriodsData.filter((period: any) => {
            const periodYearId = typeof period.academic_year === 'object' 
                ? period.academic_year?.id || period.academic_year?._id 
                : period.academic_year;
            
            return periodYearId === yearId;
        });
    }


    // Method to get fields with data loaded
    async getClassInfoFieldsWithData(): Promise<FormlyFieldConfig[]> {
        if (!this.dataLoaded) {
            // Wait for data to be loaded with a timeout
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn('Timeout waiting for form data to load');
                    resolve();
                }, 5000);

                const checkDataLoaded = () => {
                    if (this.dataLoaded) {
                        clearTimeout(timeout);
                        resolve();
                    } else {
                        setTimeout(checkDataLoaded, 100);
                    }
                };
                checkDataLoaded();
            });
        }
        return this.classInfoFields;
    }



    private loadDynamicData(): void {
        // Load branches first to ensure branch data is available
        this.loadBranches();
        this.loadAcademicPeriods();
        this.loadTeachers();
        this.loadStudents();
        this.loadMaterials();
    }


    private loadAcademicPeriods(): void {
        this.academicPeriodsService.getAcademicPeriods()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const academicPeriodsArray = this.extractDataFromResponse(response);
                    
                    if (academicPeriodsArray.length > 0) {
                        this.academicPeriodsData = academicPeriodsArray;
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.error('No academic periods found in response');
                    }
                    this.loadingStates.academicPeriods = true;
                    this.markDataLoadedIfReady();
                },
                error: (error) => {
                    console.error('Error loading academic periods:', error);
                    this.loadingStates.academicPeriods = true; // Mark as loaded even on error to prevent infinite loading
                    this.markDataLoadedIfReady();
                }
            });
    }

    private extractDataFromResponse(response: any): any[] {
        if (!response?.data) {
            return [];
        }

        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
            return response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        console.error('Unexpected data structure:', response.data);
        return [];
    }

    private markDataLoadedIfReady(): void {
        // Check if all critical data is loaded
        const allLoaded = this.loadingStates.academicPeriods && 
                         this.loadingStates.teachers && 
                         this.loadingStates.students && 
                         this.loadingStates.materials &&
                         this.loadingStates.branches;
        
        if (allLoaded && !this.dataLoaded) {
            this.dataLoaded = true;
            console.log('All form data loaded successfully');
        }
    }

    private loadTeachers(): void {
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load teachers');
            this.loadingStates.teachers = true;
            this.markDataLoadedIfReady();
            return;
        }

        this.usersService.getUsersStaff({
            branch: currentBranchId,
            role: 'TEACHER'
        } as any)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const teachersArray = this.extractDataFromResponse(response);
                    
                    if (teachersArray.length > 0) {
                        this.teachersData = teachersArray;
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.warn(`No teachers found for branch ${currentBranchId} with TEACHER role`);
                    }
                    this.loadingStates.teachers = true;
                    this.markDataLoadedIfReady();
                },
                error: (error) => {
                    console.error('Error loading teachers:', error);
                    this.loadingStates.teachers = true;
                    this.markDataLoadedIfReady();
                }
            });
    }

    private loadStudents(): void {
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load students');
            this.loadingStates.students = true;
            this.markDataLoadedIfReady();
            return;
        }

        this.usersService.getUsersStudents({
            branch: currentBranchId
        } as any)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const studentsArray = this.extractDataFromResponse(response);
                    
                    if (studentsArray.length > 0) {
                        this.studentsData = studentsArray;
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.warn(`No students found for branch ${currentBranchId}`);
                    }
                    this.loadingStates.students = true;
                    this.markDataLoadedIfReady();
                },
                error: (error) => {
                    console.error('Error loading students:', error);
                    this.loadingStates.students = true;
                    this.markDataLoadedIfReady();
                }
            });
    }

    private loadMaterials(): void {
        this.materialsService.getMaterialsAssigned()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const materialsArray = this.extractDataFromResponse(response);
                    
                    if (materialsArray.length > 0) {
                        this.materialsData = materialsArray;
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.error('No materials found in response');
                    }
                    this.loadingStates.materials = true;
                    this.markDataLoadedIfReady();
                },
                error: (error: any) => {
                    console.error('Error loading assigned materials:', error);
                    // Fallback to inventory service if materials service fails
                    this.loadMaterialsFallback();
                }
            });
    }

    private loadMaterialsFallback(): void {
        this.inventoryService.getInventory()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (fallbackResponse: any) => {
                    const fallbackArray = this.extractDataFromResponse(fallbackResponse);
                    
                    if (fallbackArray.length > 0) {
                        this.materialsData = fallbackArray;
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.error('No inventory fallback data found');
                    }
                    this.loadingStates.materials = true;
                    this.markDataLoadedIfReady();
                },
                error: (fallbackError) => {
                    console.error('Error loading inventory fallback:', fallbackError);
                    this.loadingStates.materials = true;
                    this.markDataLoadedIfReady();
                }
            });
    }

    private loadBranches(): void {
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load branches');
            this.currentBranchName = 'No Branch Selected';
            this.classInfoFields = this.buildClassInfoFields();
            this.loadingStates.branches = true;
            this.markDataLoadedIfReady();
            return;
        }

        this.currentBranchName = 'Loading...';
        this.classInfoFields = this.buildClassInfoFields();

        this.customersApiService.getCustomersId(currentBranchId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    if (response?.data) {
                        const branchData = response.data;
                        this.branchesData = [branchData];
                        this.currentBranchName = branchData.name || branchData.nickname || 'Current Branch';
                        this.activeAcademicYear = branchData.active_academic_year;
                        
                        this.classInfoFields = this.buildClassInfoFields();
                    } else {
                        console.warn('No data in branch response');
                        this.currentBranchName = 'No Branch Available';
                        this.classInfoFields = this.buildClassInfoFields();
                    }
                    this.loadingStates.branches = true;
                    this.markDataLoadedIfReady();
                },
                error: (error) => {
                    console.error('Error loading branch:', error);
                    this.currentBranchName = 'Error Loading Branch';
                    this.classInfoFields = this.buildClassInfoFields();
                    this.loadingStates.branches = true;
                    this.markDataLoadedIfReady();
                }
            });
    }


    private getCurrentBranchId(): string | null {
        let currentState: any = null;
        this.store.select(state => state.auth)
            .pipe(take(1))
            .subscribe(authState => {
                currentState = authState;
            });
        
        return currentState?.currentCustomerId || null;
    }

    private setupAuthStateSubscription(): void {
        this.store.select(state => state.auth)
            .pipe(takeUntil(this.destroy$))
            .subscribe(authState => {
                if (authState?.currentCustomerId) {
                    this.reloadDataForBranch(authState.currentCustomerId);
                } else {
                    this.clearAllData();
                }
            });
    }

    private reloadDataForBranch(branchId: string): void {
        // Clear existing data
        this.teachersData = [];
        this.studentsData = [];
        this.branchesData = [];
        this.currentBranchName = 'Loading...';
        
        // Reset loading states
        this.loadingStates.teachers = false;
        this.loadingStates.students = false;
        this.loadingStates.branches = false;
        this.dataLoaded = false;
        
        // Rebuild fields immediately to show loading state
        this.classInfoFields = this.buildClassInfoFields();
        
        // Reload all data for the new branch
        this.loadBranches();
        this.loadTeachers();
        this.loadStudents();
    }

    private clearAllData(): void {
        this.teachersData = [];
        this.studentsData = [];
        this.branchesData = [];
        this.currentBranchName = 'No Branch Selected';
        this.classInfoFields = this.buildClassInfoFields();
    }

    private getDefaultBranchValue(): string {
        // Return the current branch name for display
        if (this.currentBranchName && this.currentBranchName !== 'Loading...' && this.currentBranchName !== 'No Branch Selected') {
            return this.currentBranchName;
        }
        
        // If we have branches data, use the first one's name
        if (this.branchesData.length > 0) {
            const branchData = this.branchesData[0];
            return branchData.name || branchData.nickname || 'Current Branch';
        }
        
        // No branch available
        return 'No Branch Available';
    }

    private getBranchIdForForm(): string {
        // Get current branch ID from auth state for form submission
        const currentBranchId = this.getCurrentBranchId();
        if (currentBranchId) {
            return currentBranchId;
        }
        
        // Fallback to first branch ID if available
        if (this.branchesData.length > 0) {
            return this.branchesData[0].id;
        }
        
        return '';
    }


    private buildClassInfoFields(providedDefaults?: any, isEditMode: boolean = false): FormlyFieldConfig[] {
        const isDev = environment.development;
        
        // Generate faker data for development (only for non-API dependent fields)
        const defaultValues = {
            academicPeriod: providedDefaults?.academicPeriod || '',
            academicYear: providedDefaults?.academicYear || this.activeAcademicYear?.id || '',
            name: providedDefaults?.name || (isDev ? `Class ${faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'])}` : ''),
            classColor: providedDefaults?.classColor || (isDev ? faker.color.rgb() : '#ff0000'),
            subject: providedDefaults?.subject || '',
            level: providedDefaults?.level || '',
            notes: providedDefaults?.notes || (isDev ? faker.lorem.paragraph() : ''),
            teachers: providedDefaults?.teachers || [],
            students: providedDefaults?.students || [],
            materials: providedDefaults?.materials || [],
            branch: providedDefaults?.branch || this.getBranchIdForForm()
        };

        // Academic year is now automatically set from customer data

        // Build academic period options
        // In create mode: filter periods from the active academic year (both is_current and is_manual_active)
        // In edit mode: filter periods from the selected academic year
        let periodsToShow = this.academicPeriodsData;
        
        if (isEditMode && providedDefaults?.academicYear) {
            // Edit mode: show periods for the selected academic year
            periodsToShow = this.getAcademicPeriodsByYearId(providedDefaults.academicYear);
        } else if (!isEditMode && this.activeAcademicYear?.id) {
            // Create mode: show periods for the active academic year
            periodsToShow = this.getFilteredAcademicPeriods();
        }

        const academicPeriodOptions = [
            ...periodsToShow.map((period: any) => ({
                label: period.name,
                value: period.id
            }))
        ];

        // Build teachers options
        const teachersOptions = this.teachersData.map((teacher: any) => ({
            label: `${teacher.firstname} ${teacher.lastname}`,
            value: teacher.id
        }));

        // Build students options
        const studentsOptions = this.studentsData.map((student: any) => ({
            label: `${student.firstname} ${student.lastname}`,
            value: student.id
        }));

        // Build materials options
        const materialsOptions = this.materialsData.map((material: any) => ({
            label: material.name || material.title,
            value: material.id
        }));

        // Build branches options
        const branchesOptions = this.branchesData.map((branch: any) => ({
            label: branch.name || branch.nickname || 'Branch',
            value: branch.id
        }));

        return [
            {
              fieldGroupClassName: '',
              fieldGroup: [
                {
                  template: '<h3 class="text-primary font-bold text-xl mb-2">Class info</h3>',
                },
                {
                  fieldGroupClassName: 'grid',
                  fieldGroup: [
                    {
                      template: '<div class="flex align-items-center h-full"><span>Academic info :</span></div>',
                      className: 'col-12 md:col-2 flex align-items-center'
                    },
                    {
                      key: 'academicPeriod',
                      type: 'primary-select',
                      className: 'col-12 md:col-3',
                      defaultValue: defaultValues.academicPeriod,
                      props: {
                        required: true,
                        placeholder: 'Academic Period',
                        selectOptions: academicPeriodOptions
                      }
                    },
                  ]
                },
                {
                  fieldGroupClassName: 'grid mt-3',
                  fieldGroup: [
                    {
                      key: 'name',
                      type: 'primary-input',
                      className: 'col-12 md:col-2',
                      defaultValue: defaultValues.name,
                      props: {
                        required: true,
                        placeholder: 'Name'
                      }
                    },
                    {
                      key: 'classColor',
                      type: 'primay-color-select',
                      className: 'col-12 md:col-2',
                      defaultValue: defaultValues.classColor,
                      props: {
                        placeholder: 'Color',
                        colorOptions: [
                          { label: 'Red', value: 'red', hex: '#FF0000' },
                          { label: 'Green', value: 'green', hex: '#00FF00' },
                          { label: 'Blue', value: 'blue', hex: '#0000FF' },
                          { label: 'Yellow', value: 'yellow', hex: '#FFFF00' },
                          { label: 'Orange', value: 'orange', hex: '#FFA500' },
                          { label: 'Purple', value: 'purple', hex: '#800080' },
                          { label: 'Pink', value: 'pink', hex: '#FFC0CB' }
                        ]
                      }
                    },
                    {
                      key: 'branch',
                      type: 'primary-input',
                      className: 'col-12 md:col-2',
                      defaultValue: this.getDefaultBranchValue(),
                      props: {
                        required: true,
                        placeholder: 'No Branch Available',
                        disabled: true,
                      }
                    },
                    {
                      key: 'subject',
                      type: 'primary-select',
                      className: 'col-12 md:col-2',
                      defaultValue: defaultValues.subject,
                      props: {
                        required: true,
                        placeholder: 'Subject',
                        selectOptions: SUBJECT_OPTIONS
                      }
                    },
                    {
                      key: 'level',
                      type: 'primary-select',
                      className: 'col-12 md:col-2',
                      defaultValue: defaultValues.level,
                      props: {
                        required: true,
                        placeholder: 'Level',
                        selectOptions: LEVEL_OPTIONS
                      }
                    }
                  ]
                },
                {
                  template: '<h3 class="text-primary font-bold text-xl mt-4 mb-2">Notes:</h3>',
                },
                {
                  key: 'notes',
                  type: 'primary-textarea',
                  className: 'col-12',
                  defaultValue: defaultValues.notes,
                  props: {
                    required: false,
                    placeholder: 'Notes',
                    inputType: 'textArea',
                    rows: 4
                  }
                },
                {
                  template: '<div class="border-1 border-primary w-full mt-4 mb-2"></div>'
                },
                {
                  template: '<h3 class="text-primary font-bold text-xl mt-4 mb-2">Assign</h3>',
                },
                {
                  fieldGroupClassName: 'grid',
                  fieldGroup: [
                    {
                      key: 'teachers',
                      type: 'primary-multi-select',
                      className: 'col-12 md:col-4',
                      defaultValue: [],
                      props: {
                        label: 'Teachers',
                        placeholder: 'Teachers',
                        selectOptions: teachersOptions
                      }
                    },
                    {
                      key: 'students',
                      type: 'primary-multi-select',
                      className: 'col-12 md:col-4',
                      defaultValue: [],
                      props: {
                        label: 'Students',
                        placeholder: 'Students',
                        selectOptions: studentsOptions
                      }
                    },
                    {
                      key: 'materials',
                      type: 'primary-multi-select',
                      className: 'col-12 md:col-4',
                      defaultValue: [],
                      props: {
                        label: 'Materials',
                        placeholder: 'Materials',
                        selectOptions: materialsOptions
                      }
                    }
                  ]
                },
                {
                  template: '<div class="border-1 border-primary w-full mt-4 mb-2"></div>'
                },
                {
                  template: '<div id="sessions-container"></div>'
                }
              ]
            }
          ];
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

