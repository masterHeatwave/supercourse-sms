import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewAssignmentComponent } from './create-new-assignment.component';

describe('CreateNewAssignmentComponent', () => {
  let component: CreateNewAssignmentComponent;
  let fixture: ComponentFixture<CreateNewAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewAssignmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateNewAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
