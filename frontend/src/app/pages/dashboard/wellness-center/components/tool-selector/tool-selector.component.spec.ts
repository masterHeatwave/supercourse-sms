import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolSelectorComponent } from './tool-selector.component';

describe('ToolSelectorComponent', () => {
  let component: ToolSelectorComponent;
  let fixture: ComponentFixture<ToolSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
