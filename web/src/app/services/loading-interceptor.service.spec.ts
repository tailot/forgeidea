import { TestBed } from '@angular/core/testing';

import { LoadingInterceptor } from './loading-interceptor.service';
import { LoadingService } from './loading.service';

describe('LoadingInterceptorService', () => {
  let service: LoadingInterceptor;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingInterceptor, LoadingService]
    });
    service = TestBed.inject(LoadingInterceptor);
    loadingService = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
