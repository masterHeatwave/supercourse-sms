import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesStudentsComponent } from './classes-students.component';

describe('ClassesStudentsComponent', () => {
  let component: ClassesStudentsComponent;
  let fixture: ComponentFixture<ClassesStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesStudentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClassesStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
