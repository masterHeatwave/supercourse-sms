import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockAnswerComponent } from './block-answer.component';

describe('BlockAnswerComponent', () => {
  let component: BlockAnswerComponent;
  let fixture: ComponentFixture<BlockAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockAnswerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
