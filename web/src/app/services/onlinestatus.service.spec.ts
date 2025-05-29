import { TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { OnlineStatusService } from './onlinestatus.service';

describe('OnlinestatusService', () => {
  let service: OnlineStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(OnlineStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
