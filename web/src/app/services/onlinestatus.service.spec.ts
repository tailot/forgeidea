import { TestBed } from '@angular/core/testing';

import { OnlineStatusService } from './onlinestatus.service';

describe('OnlinestatusService', () => {
  let service: OnlineStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnlineStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
