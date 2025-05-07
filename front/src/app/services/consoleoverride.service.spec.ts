import { TestBed } from '@angular/core/testing';

import { ConsoleoverrideService } from './consoleoverride.service';

describe('ConsoleoverrideService', () => {
  let service: ConsoleoverrideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsoleoverrideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
