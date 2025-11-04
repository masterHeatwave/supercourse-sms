import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleStudentComponent } from './single-student.component';

describe('SingleStudentComponent', () => {
  let component: SingleStudentComponent;
  let fixture: ComponentFixture<SingleStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
