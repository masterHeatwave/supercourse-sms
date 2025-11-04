import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalmTimeViewComponent } from './calm-time-view.component';

describe('CalmTimeViewComponent', () => {
  let component: CalmTimeViewComponent;
  let fixture: ComponentFixture<CalmTimeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalmTimeViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalmTimeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
