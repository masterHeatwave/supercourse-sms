import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryCheckboxComponent } from './primary-checkbox.component';

describe('PrimaryCheckboxComponent', () => {
  let component: PrimaryCheckboxComponent;
  let fixture: ComponentFixture<PrimaryCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryCheckboxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrimaryCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
