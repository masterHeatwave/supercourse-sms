import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlocksAnswerComponent } from './blocks-answer.component';

describe('BlocksAnswerComponent', () => {
  let component: BlocksAnswerComponent;
  let fixture: ComponentFixture<BlocksAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlocksAnswerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlocksAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
