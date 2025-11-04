import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingPairsQuestionComponent } from './matching-pairs-question.component';

describe('MatchingPairsQuestionComponent', () => {
  let component: MatchingPairsQuestionComponent;
  let fixture: ComponentFixture<MatchingPairsQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingPairsQuestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingPairsQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
