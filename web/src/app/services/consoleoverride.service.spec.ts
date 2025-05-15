import { TestBed } from '@angular/core/testing';

import { ConsoleOverrideService } from './consoleoverride.service';

describe('ConsoleoverrideService', () => {
  let service: ConsoleOverrideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsoleOverrideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
