import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityTypeCardComponent } from './activity-type-card.component';

describe('ActivityTypeCardComponent', () => {
  let component: ActivityTypeCardComponent;
  let fixture: ComponentFixture<ActivityTypeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTypeCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityTypeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
