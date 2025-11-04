import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchStudentViewComponent } from './launch-student-view.component';

describe('LaunchStudentViewComponent', () => {
  let component: LaunchStudentViewComponent;
  let fixture: ComponentFixture<LaunchStudentViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaunchStudentViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaunchStudentViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
