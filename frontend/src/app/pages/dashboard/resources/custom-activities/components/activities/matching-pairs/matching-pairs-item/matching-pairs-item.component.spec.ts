import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingPairsItemComponent } from './matching-pairs-item.component';

describe('MatchingPairsItemComponent', () => {
  let component: MatchingPairsItemComponent;
  let fixture: ComponentFixture<MatchingPairsItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingPairsItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingPairsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
