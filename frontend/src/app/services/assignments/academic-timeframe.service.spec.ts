import { TestBed } from '@angular/core/testing';

import { AcademicTimeframeService } from './academic-timeframe.service';

describe('AcademicTimeframeService', () => {
  let service: AcademicTimeframeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AcademicTimeframeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
