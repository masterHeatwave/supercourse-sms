import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewViewComponent } from './preview-view.component';

describe('PreviewViewComponent', () => {
  let component: PreviewViewComponent;
  let fixture: ComponentFixture<PreviewViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
