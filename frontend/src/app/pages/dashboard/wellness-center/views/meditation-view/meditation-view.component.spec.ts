import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeditationViewComponent } from './meditation-view.component';

describe('MeditationViewComponent', () => {
  let component: MeditationViewComponent;
  let fixture: ComponentFixture<MeditationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeditationViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeditationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
