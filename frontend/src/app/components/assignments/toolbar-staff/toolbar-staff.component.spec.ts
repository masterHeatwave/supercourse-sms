import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarStaffComponent } from './toolbar-staff.component';

describe('ToolbarStaffComponent', () => {
  let component: ToolbarStaffComponent;
  let fixture: ComponentFixture<ToolbarStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarStaffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
