import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoodPickerComponent } from './mood-picker.component';

describe('MoodComponent', () => {
  let component: MoodPickerComponent;
  let fixture: ComponentFixture<MoodPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoodPickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MoodPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
