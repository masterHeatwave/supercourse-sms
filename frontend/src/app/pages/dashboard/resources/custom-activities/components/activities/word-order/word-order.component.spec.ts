import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordOrderComponent } from './word-order.component';

describe('WordOrderComponent', () => {
  let component: WordOrderComponent;
  let fixture: ComponentFixture<WordOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordOrderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
