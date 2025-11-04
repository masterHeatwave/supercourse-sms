import { TestBed } from '@angular/core/testing';

import { PexelImageSearchService } from './pexel-image-search.service';

describe('PexelImageSearchService', () => {
  let service: PexelImageSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PexelImageSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
