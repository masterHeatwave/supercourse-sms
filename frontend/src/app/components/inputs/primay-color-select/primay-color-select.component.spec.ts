import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimayColorSelectComponent } from './primay-color-select.component';

describe('PrimayColorSelectComponent', () => {
  let component: PrimayColorSelectComponent;
  let fixture: ComponentFixture<PrimayColorSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimayColorSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrimayColorSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
