import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolvedViewComponent } from './solved-view.component';

describe('SolvedViewComponent', () => {
  let component: SolvedViewComponent;
  let fixture: ComponentFixture<SolvedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolvedViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolvedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
