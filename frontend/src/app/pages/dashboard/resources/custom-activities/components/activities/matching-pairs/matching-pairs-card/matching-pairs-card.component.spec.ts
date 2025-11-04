import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingPairsCardComponent } from './matching-pairs-card.component';

describe('MatchingPairsCardComponent', () => {
  let component: MatchingPairsCardComponent;
  let fixture: ComponentFixture<MatchingPairsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingPairsCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingPairsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
