import { TestBed } from '@angular/core/testing';

import { InputDataService } from './input-data.service';

describe('InputDataService', () => {
  let service: InputDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
