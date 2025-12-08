import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformUseAnalyticsComponent } from './platform-use-analytics.component';

describe('PlatformUseAnalyticsComponent', () => {
  let component: PlatformUseAnalyticsComponent;
  let fixture: ComponentFixture<PlatformUseAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformUseAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformUseAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
