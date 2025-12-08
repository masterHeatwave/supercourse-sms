import { TestBed } from '@angular/core/testing';

import { StorageStateService } from './storage-state.service';

describe('StorageStateService', () => {
  let service: StorageStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
