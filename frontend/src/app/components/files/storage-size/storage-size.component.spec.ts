import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageSizeComponent } from './storage-size.component';

describe('StorageSizeComponent', () => {
  let component: StorageSizeComponent;
  let fixture: ComponentFixture<StorageSizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageSizeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StorageSizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
