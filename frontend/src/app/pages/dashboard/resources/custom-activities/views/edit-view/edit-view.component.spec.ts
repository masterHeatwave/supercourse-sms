import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditViewComponent } from './edit-view.component';

describe('EditViewComponent', () => {
  let component: EditViewComponent;
  let fixture: ComponentFixture<EditViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
