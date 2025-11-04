import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllDraftedAssignmentsComponent } from './view-all-drafted-assignments.component';

describe('ViewAllDraftedAssignmentsComponent', () => {
  let component: ViewAllDraftedAssignmentsComponent;
  let fixture: ComponentFixture<ViewAllDraftedAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllDraftedAssignmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewAllDraftedAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
