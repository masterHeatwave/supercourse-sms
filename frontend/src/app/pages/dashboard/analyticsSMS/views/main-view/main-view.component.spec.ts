import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsMainViewComponent } from './main-view.component';

describe('AnalyticsMainViewComponent', () => {
  let component: AnalyticsMainViewComponent;
  let fixture: ComponentFixture<AnalyticsMainViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsMainViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsMainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
