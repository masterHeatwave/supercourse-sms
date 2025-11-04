import { Injectable, inject, OnDestroy } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment';
import { faker } from '@faker-js/faker';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { UsersService } from '@gen-api/users/users.service';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { MaterialsService } from '@gen-api/materials/materials.service';
import { CustomerService } from '@services/customer.service';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { take, takeUntil } from 'rxjs/operators';
import { CustomersService } from '@gen-api/customers/customers.service';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class ClassFormFields implements OnDestroy {
    private academicPeriodsService = inject(AcademicPeriodsService);
    private usersService = inject(UsersService);
    private inventoryService = inject(InventoryService);
    private materialsService = inject(MaterialsService);
    private customerService = inject(CustomerService);
    private customersApiService = inject(CustomersService);
    private store = inject(Store<AppState>);
    
    private classInfoFields: FormlyFieldConfig[] = [];
    private dataLoaded = false;
    private academicPeriodsLoaded = false;
    private academicPeriodsData: any[] = [];
    private teachersData: any[] = [];
    private studentsData: any[] = [];
    private materialsData: any[] = [];
    private branchesData: any[] = [];
    private activeAcademicYear: any = null;
    private currentBranchName: string = 'Loading...';
    private destroy$ = new Subject<void>();

    constructor() {
        this.classInfoFields = this.buildClassInfoFields();
        this.setupAuthStateSubscription();
        
        // Load data after a short delay to ensure auth state is ready
        setTimeout(() => {
            this.loadDynamicData();
        }, 200);
    }

    getClassInfoFields(): FormlyFieldConfig[] {
        return this.classInfoFields;
    }

    getActiveAcademicYearId(): string | null {
        return this.activeAcademicYear?.id || null;
    }

    // Method to refresh fields when data is updated
    refreshFields(): FormlyFieldConfig[] {
        this.classInfoFields = this.buildClassInfoFields();
        return this.classInfoFields;
    }

    public refreshBranchData(): void {
        console.log('Manually refreshing branch data...');
        const currentBranchId = this.getCurrentBranchId();
        if (currentBranchId) {
            this.reloadDataForBranch(currentBranchId);
        } else {
            this.clearAllData();
        }
    }

    private attemptBranchLoad(): void {
        const currentBranchId = this.getCurrentBranchId();
        console.log('Attempting branch load for ID:', currentBranchId);
        
        if (currentBranchId) {
            console.log('Branch ID found, loading data...');
            this.reloadDataForBranch(currentBranchId);
        } else {
            console.log('No branch ID found, clearing data...');
            this.clearAllData();
        }
    }

    // Method to get fields with data loaded
    async getClassInfoFieldsWithData(): Promise<FormlyFieldConfig[]> {
        if (!this.dataLoaded) {
            // Wait for data to be loaded
            await new Promise<void>((resolve) => {
                const checkDataLoaded = () => {
                    if (this.dataLoaded) {
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
        this.academicPeriodsService.getAcademicPeriods().subscribe({
            next: (response: any) => {
                // Handle different possible response structures
                let academicPeriodsArray = [];
                
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        // Direct array
                        academicPeriodsArray = response.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        // AdvancedResults plugin response structure
                        academicPeriodsArray = response.data.results;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        // Nested data structure
                        academicPeriodsArray = response.data.data;
                    } else {
                        console.error('Unexpected academic periods data structure:', response.data);
                    }
                }
                
                if (academicPeriodsArray.length > 0) {
                    this.academicPeriodsData = academicPeriodsArray;
                    this.academicPeriodsLoaded = true;
                    this.classInfoFields = this.buildClassInfoFields();
                    this.markDataLoadedIfReady();
                } else {
                    console.error('No academic periods found in response');
                }
            },
            error: (error) => console.error('Error loading academic periods:', error)
        });
    }

    private markDataLoadedIfReady(): void {
        if (this.academicPeriodsLoaded && !this.dataLoaded) {
            this.dataLoaded = true;
        }
    }

    private loadTeachers(): void {
        // Get current branch ID for filtering
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load teachers');
            return;
        }

        // Load teachers filtered by branch and TEACHER role
        this.usersService.getUsersStaff({
            branch: currentBranchId,
            role: 'TEACHER'
        } as any).subscribe({
            next: (response: any) => {
                // Handle different possible response structures
                let teachersArray = [];
                
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        // Direct array
                        teachersArray = response.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        // AdvancedResults plugin response structure
                        teachersArray = response.data.results;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        // Nested data structure
                        teachersArray = response.data.data;
                    } else {
                        console.error('Unexpected teachers data structure:', response.data);
                    }
                }
                
                if (teachersArray.length > 0) {
                    this.teachersData = teachersArray;
                    this.classInfoFields = this.buildClassInfoFields();
                    console.log(`Loaded ${teachersArray.length} teachers for branch ${currentBranchId} with TEACHER role`);
                } else {
                    console.warn(`No teachers found for branch ${currentBranchId} with TEACHER role`);
                }
            },
            error: (error) => console.error('Error loading teachers:', error)
        });
    }

    private loadStudents(): void {
        // Get current branch ID for filtering
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load students');
            return;
        }

        // Load students filtered by branch
        this.usersService.getUsersStudents({
            branch: currentBranchId
        } as any).subscribe({
            next: (response: any) => {
                
                // Handle different possible response structures
                let studentsArray = [];
                
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        // Direct array
                        studentsArray = response.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        // AdvancedResults plugin response structure
                        studentsArray = response.data.results;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        // Nested data structure
                        studentsArray = response.data.data;
                    } else {
                        console.error('Unexpected students data structure:', response.data);
                    }
                }
                
                if (studentsArray.length > 0) {
                    this.studentsData = studentsArray;
                    this.classInfoFields = this.buildClassInfoFields();
                    console.log(`Loaded ${studentsArray.length} students for branch ${currentBranchId}`);
                    console.log('Students data:', this.studentsData);
                    console.log('Students options:', this.studentsData.map((student: any) => ({
                        label: `${student.firstname} ${student.lastname}`,
                        value: student.id
                    })));
                } else {
                    console.warn(`No students found for branch ${currentBranchId}`);
                }
            },
            error: (error) => console.error('Error loading students:', error)
        });
    }

    private loadMaterials(): void {
        this.materialsService.getMaterialsAssigned().subscribe({
            next: (response: any) => {
                
                // Handle different possible response structures
                let materialsArray = [];
                
                if (response?.data) {
                    if (Array.isArray(response.data)) {
                        // Direct array
                        materialsArray = response.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        // AdvancedResults plugin response structure
                        materialsArray = response.data.results;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        // Nested data structure
                        materialsArray = response.data.data;
                    } else {
                        console.error('Unexpected materials data structure:', response.data);
                    }
                }
                
                if (materialsArray.length > 0) {
                    this.materialsData = materialsArray;
                    this.classInfoFields = this.buildClassInfoFields();
                } else {
                    console.error('No materials found in response');
                }
            },
            error: (error: any) => {
                console.error('Error loading assigned materials:', error);
                // Fallback to inventory service if materials service fails
                this.inventoryService.getInventory().subscribe({
                    next: (fallbackResponse: any) => {
                        
                        // Handle different possible response structures for fallback
                        let fallbackArray = [];
                        
                        if (fallbackResponse?.data) {
                            if (Array.isArray(fallbackResponse.data)) {
                                // Direct array
                                fallbackArray = fallbackResponse.data;
                            } else if (fallbackResponse.data.results && Array.isArray(fallbackResponse.data.results)) {
                                // AdvancedResults plugin response structure
                                fallbackArray = fallbackResponse.data.results;
                            } else if (fallbackResponse.data.data && Array.isArray(fallbackResponse.data.data)) {
                                // Nested data structure
                                fallbackArray = fallbackResponse.data.data;
                            } else {
                                console.error('Unexpected inventory fallback data structure:', fallbackResponse.data);
                            }
                        }
                        
                        if (fallbackArray.length > 0) {
                            this.materialsData = fallbackArray;
                            this.classInfoFields = this.buildClassInfoFields();
                        } else {
                            console.error('No inventory fallback data found');
                        }
                    },
                    error: (fallbackError) => console.error('Error loading inventory fallback:', fallbackError)
                });
            }
        });
    }

    private loadBranches(): void {
        // Get current branch ID for filtering
        const currentBranchId = this.getCurrentBranchId();
        
        if (!currentBranchId) {
            console.warn('No branch selected, cannot load branches');
            this.currentBranchName = 'No Branch Selected';
            this.classInfoFields = this.buildClassInfoFields();
            return;
        }

        console.log(`Loading branch data for ID: ${currentBranchId}`);
        this.currentBranchName = 'Loading...';
        this.classInfoFields = this.buildClassInfoFields(); // Show loading state

        // Load branches - for now just load the current branch
        this.customersApiService.getCustomersId(currentBranchId).subscribe({
            next: (response: any) => {
                console.log('Branch API response:', response);
                if (response?.data) {
                    const branchData = response.data;
                    this.branchesData = [branchData]; // Single branch for now
                    this.currentBranchName = branchData.name || branchData.nickname || 'Current Branch';
                    this.activeAcademicYear = branchData.active_academic_year;
                    
                    console.log(`Loaded branch: ${this.currentBranchName} (${currentBranchId})`);
                    console.log('Branch data:', branchData);
                    console.log('Branches data array:', this.branchesData);
                    console.log('Default branch value:', this.getDefaultBranchValue());
                    
                    // Force rebuild fields with new data
                    this.classInfoFields = this.buildClassInfoFields();
                    console.log('Rebuilt class info fields with branch data');
                } else {
                    console.warn('No data in branch response');
                    this.currentBranchName = 'No Branch Available';
                    this.classInfoFields = this.buildClassInfoFields();
                }
            },
            error: (error) => {
                console.error('Error loading branch:', error);
                this.currentBranchName = 'Error Loading Branch';
                this.classInfoFields = this.buildClassInfoFields();
            }
        });
    }

    public fetchCurrentBranchName(): void {
        this.store.select(state => state.auth.currentCustomerId)
            .pipe(take(1))
            .subscribe(currentCustomerId => {
                if (currentCustomerId) {
                    this.customersApiService.getCustomersId(currentCustomerId).subscribe({
                        next: (response: any) => {
                            if (response?.data) {
                                const branchName = response.data.name || response.data.nickname || 'Current Branch';
                                this.currentBranchName = branchName;
                                this.activeAcademicYear = response.data.active_academic_year;
                                this.updateBranchFieldImmediate(branchName);
                                this.classInfoFields = this.buildClassInfoFields();
                            }
                        },
                        error: (error) => {
                            console.error('Error fetching current branch:', error);
                            this.currentBranchName = 'Current Branch';
                            this.updateBranchFieldImmediate('Current Branch');
                        }
                    });
                } else {
                    this.currentBranchName = 'No Branch Selected';
                    this.updateBranchFieldImmediate('No Branch Selected');
                }
            });
    }

    private initializeBranchField(): void {
        this.store.select(state => state.auth.currentCustomerId)
            .pipe(take(1))
            .subscribe(currentCustomerId => {
                if (currentCustomerId) {
                    this.customersApiService.getCustomersId(currentCustomerId).subscribe({
                        next: (response: any) => {
                            if (response?.data) {
                                const branchName = response.data.name || response.data.nickname || 'Current Branch';
                                this.currentBranchName = branchName;
                                this.activeAcademicYear = response.data.active_academic_year;
                                this.updateBranchFieldImmediate(branchName);
                                this.classInfoFields = this.buildClassInfoFields();
                            }
                        },
                        error: (error) => {
                            console.error('Error fetching current branch:', error);
                            this.currentBranchName = 'Current Branch';
                            this.updateBranchFieldImmediate('Current Branch');
                        }
                    });
                } else {
                    this.currentBranchName = 'No Branch Selected';
                    this.updateBranchFieldImmediate('No Branch Selected');
                }
            });
    }

    private updateBranchFieldImmediate(branchName: string): void {
        // Since we're rebuilding fields dynamically, we need to update the branch field
        // in the current field structure
        const branchField = this.findFieldByKey('branch');
        if (branchField?.props) {
            branchField.defaultValue = branchName;
            if (branchField.formControl) {
                branchField.formControl.patchValue(branchName);
            }
        }
    }

    private findFieldByKey(key: string): FormlyFieldConfig | null {
        const findInFields = (fields: FormlyFieldConfig[]): FormlyFieldConfig | null => {
            for (const field of fields) {
                if (field.key === key) {
                    return field;
                }
                if (field.fieldGroup) {
                    const found = findInFields(field.fieldGroup);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInFields(this.classInfoFields);
    }

    private getCurrentBranchId(): string | null {
        // Get current state synchronously
        let currentState: any = null;
        this.store.select(state => state.auth)
            .pipe(take(1))
            .subscribe(authState => {
                currentState = authState;
            });
        
        console.log('Current auth state:', currentState);
        console.log('Current customer ID:', currentState?.currentCustomerId);
        
        return currentState?.currentCustomerId || null;
    }

    private setupAuthStateSubscription(): void {
        // Subscribe to auth state changes to react to branch/role changes
        this.store.select(state => state.auth)
            .pipe(takeUntil(this.destroy$))
            .subscribe(authState => {
                console.log('Auth state changed:', authState);
                console.log('Current customer ID:', authState?.currentCustomerId);
                
                if (authState?.currentCustomerId) {
                    // Branch changed, reload all data
                    console.log('Branch available, reloading data...');
                    this.reloadDataForBranch(authState.currentCustomerId);
                } else {
                    // No branch selected, clear data
                    console.log('No branch selected, clearing data...');
                    this.clearAllData();
                }
            });

        // Also check immediately on setup with multiple attempts
        setTimeout(() => {
            this.attemptBranchLoad();
        }, 100);
        
        // Retry after 500ms if first attempt fails
        setTimeout(() => {
            if (this.currentBranchName === 'Loading...' || this.currentBranchName === 'No Branch Selected') {
                this.attemptBranchLoad();
            }
        }, 500);
        
        // Final retry after 1 second
        setTimeout(() => {
            if (this.currentBranchName === 'Loading...' || this.currentBranchName === 'No Branch Selected') {
                this.attemptBranchLoad();
            }
        }, 1000);
    }

    private reloadDataForBranch(branchId: string): void {
        console.log(`Branch changed to: ${branchId}, reloading data...`);
        
        // Clear existing data
        this.teachersData = [];
        this.studentsData = [];
        this.branchesData = [];
        this.currentBranchName = 'Loading...';
        
        // Rebuild fields immediately to show loading state
        this.classInfoFields = this.buildClassInfoFields();
        
        // Reload all data for the new branch
        this.loadBranches(); // Load branches first
        this.loadTeachers();
        this.loadStudents();
    }

    private clearAllData(): void {
        console.log('No branch selected, clearing all data...');
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


    private buildClassInfoFields(): FormlyFieldConfig[] {
        const isDev = environment.development;
        
        // Generate faker data for development (only for non-API dependent fields)
        const defaultValues = {
            academicPeriod: '',
            academicYear: this.activeAcademicYear?.id || '',
            name: isDev ? `Class ${faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'])}` : '',
            classColor: isDev ? faker.color.rgb() : '#ff0000',
            classId: isDev ? faker.string.alphanumeric({ length: 6, casing: 'upper' }) : '',
            subject: '',
            level: '',
            notes: isDev ? faker.lorem.paragraph() : '',
            teachers: [],
            students: [],
            materials: [],
            branch: this.getBranchIdForForm()
        };

        // Academic year is now automatically set from customer data

        // Build academic period options
        const academicPeriodOptions = [
            ...this.academicPeriodsData.map((period: any) => ({
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
                        selectOptions: [
                          { label: 'ENG', value: 'english' },
                          { label: 'FRA', value: 'french' },
                          { label: 'ESP', value: 'spanish' },
                          { label: 'ITA', value: 'italian' },
                          { label: 'DEU', value: 'german' },
                          { label: 'POR', value: 'portuguese' },
                          { label: 'RUS', value: 'russian' },
                          { label: 'ARAB', value: 'arabic' },
                          { label: 'CHI', value: 'chinese' },
                          { label: 'JAP', value: 'japanese' }
                        ]
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
                        selectOptions: [
                          { label: 'Pre-Junior', value: 'pre-junior' },
                          { label: 'A Junior', value: 'a-junior' },
                          { label: 'B Junior', value: 'b-junior' },
                          { label: 'C Junior', value: 'c-junior' },
                          { label: 'A Senior', value: 'a-senior' },
                          { label: 'B Senior', value: 'b-senior' },
                          { label: 'C Senior', value: 'c-senior' }
                        ]
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

