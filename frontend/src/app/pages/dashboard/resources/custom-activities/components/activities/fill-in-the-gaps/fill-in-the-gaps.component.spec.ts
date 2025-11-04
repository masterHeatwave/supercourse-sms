import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FillInTheGapsComponent } from './fill-in-the-gaps.component';

describe('FillInTheGapsComponent', () => {
  let component: FillInTheGapsComponent;
  let fixture: ComponentFixture<FillInTheGapsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FillInTheGapsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FillInTheGapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
