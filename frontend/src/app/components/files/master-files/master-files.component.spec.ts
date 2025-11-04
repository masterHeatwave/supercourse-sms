import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterFilesComponent } from './master-files.component';

describe('MasterFilesComponent', () => {
  let component: MasterFilesComponent;
  let fixture: ComponentFixture<MasterFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterFilesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
