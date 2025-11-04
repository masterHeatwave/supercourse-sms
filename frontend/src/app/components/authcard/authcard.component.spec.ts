import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthcardComponent } from './authcard.component';

describe('AuthcardComponent', () => {
  let component: AuthcardComponent;
  let fixture: ComponentFixture<AuthcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthcardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
