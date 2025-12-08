import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyActivityComponent } from './my-activity.component';

describe('MyActivityComponent', () => {
  let component: MyActivityComponent;
  let fixture: ComponentFixture<MyActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
