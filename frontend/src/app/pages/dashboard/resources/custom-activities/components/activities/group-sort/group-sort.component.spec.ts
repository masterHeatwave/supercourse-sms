import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSortComponent } from './group-sort.component';

describe('LetterHuntComponent', () => {
  let component: GroupSortComponent;
  let fixture: ComponentFixture<GroupSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSortComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
