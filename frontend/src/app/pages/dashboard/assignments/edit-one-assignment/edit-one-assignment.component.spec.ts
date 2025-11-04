import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOneAssignmentComponent } from './edit-one-assignment.component';

describe('EditOneAssignmentComponent', () => {
  let component: EditOneAssignmentComponent;
  let fixture: ComponentFixture<EditOneAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOneAssignmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditOneAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
