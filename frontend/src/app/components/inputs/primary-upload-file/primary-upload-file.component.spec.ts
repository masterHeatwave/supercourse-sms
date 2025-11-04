import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryUploadFileComponent } from './primary-upload-file.component';

describe('PrimaryUploadFileComponent', () => {
  let component: PrimaryUploadFileComponent;
  let fixture: ComponentFixture<PrimaryUploadFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryUploadFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrimaryUploadFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
