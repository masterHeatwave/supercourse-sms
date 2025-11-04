import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionBlockCardComponent } from './question-block-card.component';

describe('QuestionBlockCardComponent', () => {
  let component: QuestionBlockCardComponent;
  let fixture: ComponentFixture<QuestionBlockCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionBlockCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionBlockCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
