import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningAnalyticsComponent } from './learning-analytics.component';

describe('LearningAnalyticsComponent', () => {
  let component: LearningAnalyticsComponent;
  let fixture: ComponentFixture<LearningAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
