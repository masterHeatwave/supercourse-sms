import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingPairsAnswerComponent } from './matching-pairs-answer.component';

describe('MatchingPairsAnswerComponent', () => {
  let component: MatchingPairsAnswerComponent;
  let fixture: ComponentFixture<MatchingPairsAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingPairsAnswerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingPairsAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
