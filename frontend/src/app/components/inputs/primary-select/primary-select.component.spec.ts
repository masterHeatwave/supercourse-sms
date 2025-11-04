import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimarySelectComponent } from './primary-select.component';

describe('PrimarySelectComponent', () => {
  let component: PrimarySelectComponent;
  let fixture: ComponentFixture<PrimarySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimarySelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrimarySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
