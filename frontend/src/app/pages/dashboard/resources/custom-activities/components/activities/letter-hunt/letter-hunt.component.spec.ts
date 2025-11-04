import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetterHuntComponent } from './letter-hunt.component';

describe('LetterHuntComponent', () => {
  let component: LetterHuntComponent;
  let fixture: ComponentFixture<LetterHuntComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetterHuntComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetterHuntComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
