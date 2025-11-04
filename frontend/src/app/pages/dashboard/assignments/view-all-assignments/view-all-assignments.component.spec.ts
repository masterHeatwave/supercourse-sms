import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllAssignmentsComponent } from './view-all-assignments.component';

describe('ViewAllAssignmentsComponent', () => {
  let component: ViewAllAssignmentsComponent;
  let fixture: ComponentFixture<ViewAllAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllAssignmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewAllAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
