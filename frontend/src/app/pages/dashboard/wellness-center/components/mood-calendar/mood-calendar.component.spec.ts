import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoodCalendarComponent } from './mood-calendar.component';

describe('MoodCalendarComponent', () => {
  let component: MoodCalendarComponent;
  let fixture: ComponentFixture<MoodCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoodCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoodCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
