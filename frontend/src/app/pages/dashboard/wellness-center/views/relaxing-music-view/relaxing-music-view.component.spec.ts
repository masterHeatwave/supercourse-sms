import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelaxingMusicViewComponent } from './relaxing-music-view.component';

describe('RelaxingMusicViewComponent', () => {
  let component: RelaxingMusicViewComponent;
  let fixture: ComponentFixture<RelaxingMusicViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelaxingMusicViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelaxingMusicViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
