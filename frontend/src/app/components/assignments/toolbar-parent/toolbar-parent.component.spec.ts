import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarParentComponent } from './toolbar-parent.component';

describe('ToolbarParentComponent', () => {
  let component: ToolbarParentComponent;
  let fixture: ComponentFixture<ToolbarParentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarParentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarParentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
