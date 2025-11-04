import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrimaryToggleComponent } from './primary-toggle.component';

describe('PrimaryToggleComponent', () => {
  let component: PrimaryToggleComponent;
  let fixture: ComponentFixture<PrimaryToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryToggleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrimaryToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
