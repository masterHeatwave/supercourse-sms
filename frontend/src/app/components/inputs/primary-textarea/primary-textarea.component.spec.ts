import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryTextareaComponent } from './primary-textarea.component';

describe('PrimaryTextareaComponent', () => {
  let component: PrimaryTextareaComponent;
  let fixture: ComponentFixture<PrimaryTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryTextareaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrimaryTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 