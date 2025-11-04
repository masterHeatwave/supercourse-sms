import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordCardComponent } from './forgot-password-card.component';

describe('ForgotPasswordCardComponent', () => {
  let component: ForgotPasswordCardComponent;
  let fixture: ComponentFixture<ForgotPasswordCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
