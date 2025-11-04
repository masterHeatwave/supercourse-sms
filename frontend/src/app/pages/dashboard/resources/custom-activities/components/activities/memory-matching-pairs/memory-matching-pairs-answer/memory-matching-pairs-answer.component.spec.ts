import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryMatchingPairsAnswerComponent } from './memory-matching-pairs-answer.component';

describe('MemoryMatchingPairsAnswerComponent', () => {
  let component: MemoryMatchingPairsAnswerComponent;
  let fixture: ComponentFixture<MemoryMatchingPairsAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryMatchingPairsAnswerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryMatchingPairsAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
