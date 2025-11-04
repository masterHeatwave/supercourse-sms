import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleStaffComponent } from './single-staff.component';

describe('SingleStaffComponent', () => {
  let component: SingleStaffComponent;
  let fixture: ComponentFixture<SingleStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleStaffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
