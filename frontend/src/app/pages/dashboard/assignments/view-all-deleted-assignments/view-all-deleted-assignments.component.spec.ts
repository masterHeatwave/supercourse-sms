import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllDeletedAssignmentsComponent } from './view-all-deleted-assignments.component';

describe('ViewAllDeletedAssignmentsComponent', () => {
  let component: ViewAllDeletedAssignmentsComponent;
  let fixture: ComponentFixture<ViewAllDeletedAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllDeletedAssignmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewAllDeletedAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
