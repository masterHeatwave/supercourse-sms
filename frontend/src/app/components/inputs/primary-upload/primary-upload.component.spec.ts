import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryUploadComponent } from './primary-upload.component';

describe('PrimaryUploadComponent', () => {
  let component: PrimaryUploadComponent;
  let fixture: ComponentFixture<PrimaryUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryUploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrimaryUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
