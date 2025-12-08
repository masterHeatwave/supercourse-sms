import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResourcesComponent } from './resources.component';
import { MaterialsService } from '@gen-api/materials/materials.service';
import { of, throwError } from 'rxjs';

describe('ResourcesComponent', () => {
  let component: ResourcesComponent;
  let fixture: ComponentFixture<ResourcesComponent>;
  let materialsService: jasmine.SpyObj<MaterialsService>;

  beforeEach(async () => {
    const materialsServiceSpy = jasmine.createSpyObj('MaterialsService', ['getMaterialsTaxisTaxiId']);

    await TestBed.configureTestingModule({
      imports: [ResourcesComponent, HttpClientTestingModule],
      providers: [
        { provide: MaterialsService, useValue: materialsServiceSpy }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResourcesComponent);
    component = fixture.componentInstance;
    materialsService = TestBed.inject(MaterialsService) as jasmine.SpyObj<MaterialsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load materials when classId is provided', () => {
    const mockMaterials = [
      { id: '1', name: 'Book 1', description: 'Description 1', category: 'Coursebook' },
      { id: '2', name: 'Book 2', description: 'Description 2', category: 'Activity Book' }
    ];
    const mockResponse = { success: true, data: mockMaterials, count: 2 };

    materialsService.getMaterialsTaxisTaxiId.and.returnValue(of(mockResponse));
    component.classId = 'taxi123';
    
    component.ngOnInit();
    
    expect(materialsService.getMaterialsTaxisTaxiId).toHaveBeenCalledWith('taxi123');
    expect(component.materials).toEqual(mockMaterials);
    expect(component.loading).toBe(false);
  });

  it('should handle empty materials list', () => {
    const mockResponse = { success: true, data: [], count: 0 };

    materialsService.getMaterialsTaxisTaxiId.and.returnValue(of(mockResponse));
    component.classId = 'taxi123';
    
    component.ngOnInit();
    
    expect(component.materials).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('should handle API errors gracefully', () => {
    materialsService.getMaterialsTaxisTaxiId.and.returnValue(throwError(() => new Error('API Error')));
    component.classId = 'taxi123';
    
    component.ngOnInit();
    
    expect(component.materials).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('should not load materials when classId is null', () => {
    component.classId = null;
    
    component.ngOnInit();
    
    expect(materialsService.getMaterialsTaxisTaxiId).not.toHaveBeenCalled();
  });

  it('should return default icon when material has no icon_url', () => {
    const material = { id: '1', name: 'Book 1' };
    const iconUrl = component.getIconUrl(material as any);
    
    expect(iconUrl).toBe('assets/images/default-material-icon.png');
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: 'invalid-url'
      }
    } as any;

    component.handleImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('assets/images/default-material-icon.png');
  });
});

