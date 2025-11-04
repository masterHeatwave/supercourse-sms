import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingPairsComponent } from './matching-pairs.component';

describe('MatchingPairsComponent', () => {
  let component: MatchingPairsComponent;
  let fixture: ComponentFixture<MatchingPairsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingPairsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingPairsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
