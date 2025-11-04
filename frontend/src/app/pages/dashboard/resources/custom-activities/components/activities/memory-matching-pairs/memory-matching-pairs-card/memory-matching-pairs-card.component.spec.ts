import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryMatchingPairsCardComponent } from './memory-matching-pairs-card.component';

describe('MemoryMatchingPairsCardComponent', () => {
  let component: MemoryMatchingPairsCardComponent;
  let fixture: ComponentFixture<MemoryMatchingPairsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryMatchingPairsCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryMatchingPairsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
