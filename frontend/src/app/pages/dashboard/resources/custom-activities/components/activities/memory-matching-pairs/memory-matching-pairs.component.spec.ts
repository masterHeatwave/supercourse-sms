import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryMatchingPairsComponent } from './memory-matching-pairs.component';

describe('MemoryMatchingPairsComponent', () => {
  let component: MemoryMatchingPairsComponent;
  let fixture: ComponentFixture<MemoryMatchingPairsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryMatchingPairsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryMatchingPairsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
