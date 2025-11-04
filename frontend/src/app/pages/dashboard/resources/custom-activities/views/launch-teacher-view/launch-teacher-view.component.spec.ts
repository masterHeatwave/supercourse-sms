import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchTeacherViewComponent } from './launch-teacher-view.component';

describe('LaunchTeacherViewComponent', () => {
  let component: LaunchTeacherViewComponent;
  let fixture: ComponentFixture<LaunchTeacherViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaunchTeacherViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaunchTeacherViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
