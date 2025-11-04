import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterRecourcesComponent } from './master-recources.component';

describe('MasterRecourcesComponent', () => {
  let component: MasterRecourcesComponent;
  let fixture: ComponentFixture<MasterRecourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterRecourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterRecourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
