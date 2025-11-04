import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryMatchingPairsItemComponent } from './memory-matching-pairs-item.component';

describe('MemoryMatchingPairsItemComponent', () => {
  let component: MemoryMatchingPairsItemComponent;
  let fixture: ComponentFixture<MemoryMatchingPairsItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryMatchingPairsItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryMatchingPairsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
