import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolAnalyticsComponent } from './school-analytics.component';

describe('SchoolAnalyticsComponent', () => {
  let component: SchoolAnalyticsComponent;
  let fixture: ComponentFixture<SchoolAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
