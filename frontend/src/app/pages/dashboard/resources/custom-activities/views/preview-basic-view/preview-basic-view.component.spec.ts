import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewBasicViewComponent } from './preview-basic-view.component';

describe('PreviewViewComponent', () => {
  let component: PreviewBasicViewComponent;
  let fixture: ComponentFixture<PreviewBasicViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewBasicViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewBasicViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
