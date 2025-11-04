import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOneAssignmentComponent } from './view-one-assignment.component';

describe('ViewOneAssignmentComponent', () => {
  let component: ViewOneAssignmentComponent;
  let fixture: ComponentFixture<ViewOneAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOneAssignmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewOneAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
