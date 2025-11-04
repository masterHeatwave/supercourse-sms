import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionControllerComponent } from './question-controller.component';

describe('QuestionControllerComponent', () => {
  let component: QuestionControllerComponent;
  let fixture: ComponentFixture<QuestionControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionControllerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
