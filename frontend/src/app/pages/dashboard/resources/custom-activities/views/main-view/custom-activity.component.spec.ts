import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomActivityComponent } from './custom-activity.component';

describe('CustomActivityComponent', () => {
  let component: CustomActivityComponent;
  let fixture: ComponentFixture<CustomActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomActivityComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
