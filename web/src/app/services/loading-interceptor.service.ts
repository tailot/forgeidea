// Angular Core
import { Injectable } from '@angular/core';

// Angular Common HTTP
import {
  HttpContextToken,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';

// RxJS
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Application-specific Services
import { LoadingService } from './loading.service';

// Environment
import { environment } from '../../environments/environment';

export const BYPASS_LOADING = new HttpContextToken<boolean>(() => false);

/**
 * HTTP Interceptor that manages a global loading state for HTTP requests.
 * It shows a loading indicator for requests targeting the relevant API URL
 * specified in the environment configuration and hides it when the request completes.
 * Individual requests can bypass this interceptor by setting the `BYPASS_LOADING`
 * context token to `true`.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private relevantApiUrl = environment.genkitApiUrl;

  /**
   * Constructs the LoadingInterceptor.
   * @param loadingService The service used to show and hide the global loading indicator.
   */
  constructor(private loadingService: LoadingService) { }

  /**
   * Intercepts outgoing HTTP requests to manage the global loading indicator.
   * If the request URL matches the `relevantApiUrl` and is not marked to bypass loading,
   * it shows the loading indicator before sending the request and hides it upon completion
   * (success or error).
   *
   * @param request The outgoing HTTP request to intercept.
   * @param next The next handler in the HTTP interceptor chain.
   * @returns An Observable of the HTTP event stream.
   */
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