import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarStudentComponent } from './toolbar-student.component';

describe('ToolbarStudentComponent', () => {
  let component: ToolbarStudentComponent;
  let fixture: ComponentFixture<ToolbarStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
