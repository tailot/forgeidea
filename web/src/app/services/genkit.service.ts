import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BYPASS_LOADING } from './loading-interceptor.service';

export interface ScoreIdeaRequestData {
  idea: string;
}

export interface GenerateIdeaCategoriesRequestData {
  count?: number,
  language?: string;
  context?: string;
}

export interface GenerateIdeaRequestData {
  category: string;
  language?: string;
}

export interface RandomIdeaRequestData {
  language?: string;
}

export interface SubjectRequestData {
  idea: string;
  language?: string;
}

export interface GenerateTasksRequestData {
  idea: string;
  language?: string;
}

export interface DiscardTasksRequestData {
  idea: string;
  tasks: string;
  tasksdiscard: string;
  language?: string;
}

/*
export interface ZoomTaskRequestData {
  idea: string;
  task: string;
  language?: string;
}
*/

export interface RequirementScoreRequestData {
  category: string;
  maxscore: number;
  language: string;
}

export interface OperationRequestData {
  idea1: string;
  idea2?: string;
  operation: "Combine" | "Integrate";
  language?: string;
}

export interface HelpTaskRequestData {
  idea: string;
  task: string;
  language?: string;
}

export interface GetPromptRequestData {
  generator: string;
  promptname: string;
}

export interface EncryptedPayloadData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

export interface ExecFlowRequestData {
  encryptedPromptPayload: EncryptedPayloadData;
  promptVariables?: Record<string, any>;
}


export interface IdeaDocument {
  key: string;
  name?: string;
  content: string;
  createdAt: number;
}

export interface Idea {
  id: string;
  text: string;
  category?: string;
  language?: string;
  documents?: IdeaDocument[]
}


export interface GenkitFlowResponse<T> {
  result?: T;
  output?: T;
  [key: string]: any;
}


@Injectable({
  providedIn: 'root'
})
export class GenkitService {

  private apiUrlBase = environment.genkitApiUrl;
  private requestTimeout = 60000;

  private cache = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {
    if (!this.apiUrlBase) {
      console.error("CRITICAL ERROR: Genkit API URL not configured in environment.ts!");
    }
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return headers;
  }
  private handleError(error: HttpErrorResponse, flowName: string): Observable<never> {
    let userFriendlyErrorMessage = `An unexpected error occurred while calling the flow '${flowName}'.`;

    if (error.error instanceof ErrorEvent) {
      console.error(`Network or client error calling ${flowName}:`, error.error.message);
      userFriendlyErrorMessage = `Network error while calling ${flowName}: ${error.error.message}`;
    } else {
      console.error(
        `Error from Genkit backend (Flow: ${flowName}, Code: ${error.status}): `, error.error);

      let backendMessage = '';
      if (error.error) {
        if (typeof error.error === 'string') { backendMessage = error.error; }
        else if (error.error.message) { backendMessage = error.error.message; }
        else if (error.error.details) { backendMessage = error.error.details; }
        else if (error.error.error?.message) { backendMessage = error.error.error.message; }
      }

      switch (error.status) {
        case 400: userFriendlyErrorMessage = `Invalid request for ${flowName}. Check the submitted data. ${backendMessage ? 'Detail: ' + backendMessage : ''}`; break;
        case 401: userFriendlyErrorMessage = `Authentication failed for ${flowName}. Check the API key or authentication method.`; break;
        case 403: userFriendlyErrorMessage = `Access denied to ${flowName}. You do not have permission.`; break;
        case 404: userFriendlyErrorMessage = `Flow '${flowName}' not found. The URL (${error.url}) might be incorrect.`; break;
        case 429: userFriendlyErrorMessage = `Too many requests to ${flowName}. Try again later.`; break;
        case 500: case 502: case 503: case 504:
          userFriendlyErrorMessage = `Internal Genkit server error (Flow: ${flowName}, Code: ${error.status}). Try again later. ${backendMessage ? 'Detail: ' + backendMessage : ''}`; break;
        default: userFriendlyErrorMessage = `HTTP error ${error.status} calling ${flowName}. ${backendMessage ? 'Detail: ' + backendMessage : ''}`;
      }
    }
    return throwError(() => new Error(userFriendlyErrorMessage));
  }

  private extractResult<T>(response: GenkitFlowResponse<T>, flowName: string): T {
    const result = response.result ?? response.output;
    if (result === undefined || result === null) {
      console.error(`Response from ${flowName} does not contain valid 'result' or 'output':`, response);
      throw new Error(`Invalid response format from ${flowName}. Missing data.`);
    }
    return result;
  }

  private generateCacheKey(flowName: string, data: any): string {
    try {
      const dataString = JSON.stringify(data, Object.keys(data || {}).sort());
      return `${flowName}::${dataString}`;
    } catch (e) {
      console.warn(`GenkitService: Could not stringify data for cache key for flow ${flowName}`, data, e);
      return `${flowName}::${Date.now()}`;
    }
  }

  callGenerateIdeaCategories(
    data?: GenerateIdeaCategoriesRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'generateIdeaCategories';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data: data || {} };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string[]>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callGenerateIdea(
    data: GenerateIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'generateIdeaFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<Idea>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        map(ideaText => ({
          text: typeof ideaText === 'string' ? ideaText : JSON.stringify(ideaText), // Ensure text is a string
          category: data.category,
          language: data.language
        } as Idea)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callRandomIdea(
    data?: RandomIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'randomIdeaFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data: data || {} };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<Idea>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        map(ideaText => ({
          text: typeof ideaText === 'string' ? ideaText : JSON.stringify(ideaText), // Ensure text is a string
          language: data?.language
        } as Idea)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callSubject(
    data: SubjectRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'subjectFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callGenerateTasks(
    data: GenerateTasksRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'generateTasks';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string[]>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callOperation(
    data: OperationRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'ideaOperationFlow'; // Correct flow name from backend
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callDiscardTasks(
    data: DiscardTasksRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'discardTasksFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string[]>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }
/*
  callZoomTask(
    data: ZoomTaskRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'zoomTaskFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }
  */
  callScoreIdea(
    data: ScoreIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<number> {
    const flowName = 'scoreIdeaFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        map(responseText => {
          const score = parseInt(responseText, 10);
          if (isNaN(score)) {
            console.error(`GenkitService (${flowName}): Failed to parse score from response: "${responseText}"`);
            throw new Error(`Could not parse the score received from ${flowName}. Response: "${responseText}"`);
          }
          if (score < 1 || score > 10) {
             console.warn(`GenkitService (${flowName}): Score ${score} is outside the expected range (1-10). Response: "${responseText}"`);

          }
          return score;
        }),
        catchError(error => {
          this.cache.delete(cacheKey);
          if (error instanceof Error && (error.message.startsWith('Could not parse the score received from') || error.message.startsWith('Score'))) {
            return throwError(() => error);
          }
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callRequirementScore(
    data: RequirementScoreRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'requirementScoreFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callHelpTask(
    data: HelpTaskRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'helpTaskFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callGetPrompt(
    data: GetPromptRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<EncryptedPayloadData> {
    const flowName = 'getPrompt';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<EncryptedPayloadData>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  callExecFlow(
    data: ExecFlowRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'execFlow';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    const body = { data };
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<string>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult(response, flowName)),
        catchError(error => {
          this.cache.delete(cacheKey);
          return this.handleError(error, flowName);
        }),
        tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    this.cache.set(cacheKey, request$);
    return request$;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('GenkitService: Cache cleared.');
  }
}