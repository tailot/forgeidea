import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { environment } from '../../environments/environment';

export const BYPASS_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private relevantApiUrl = environment.genkitApiUrl;

  constructor(private loadingService: LoadingService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if the request should bypass the loading indicator
    if (request.context.get(BYPASS_LOADING)) {
      return next.handle(request);
    }

    if (this.relevantApiUrl && request.url.startsWith(this.relevantApiUrl) ) {
      this.loadingService.show();
      return next.handle(request).pipe(
        finalize(() => {
          this.loadingService.hide();
        })
      );
    } else {
      return next.handle(request);
    }
  }
}