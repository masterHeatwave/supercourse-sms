import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryTableComponent } from './primary-table.component';

describe('PrimaryTableComponent', () => {
  let component: PrimaryTableComponent;
  let fixture: ComponentFixture<PrimaryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrimaryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
