import { TestBed } from '@angular/core/testing';

import { AIImageGeneratorService } from './aiimage-generator.service';

describe('AIImageGeneratorService', () => {
  let service: AIImageGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AIImageGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
