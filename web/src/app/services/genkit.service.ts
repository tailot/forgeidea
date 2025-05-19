// Angular Core
import { Injectable } from '@angular/core';

// Angular Common/HTTP
import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

// RxJS
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay, tap, timeout } from 'rxjs/operators';

// Application-specific
import { BYPASS_LOADING } from './loading-interceptor.service';
import { environment } from '../../environments/environment';

export interface WithLanguage {
  language?: string;
}

export interface WithMandatoryLanguage {
  language: string;
}

export interface WithIdeaText {
  idea: string;
}

export interface WithCategory {
  category: string;
}

export interface BaseIdeaIdentity {
  id: string;
  text: string;
}

export interface ScoreIdeaRequestData extends WithIdeaText {}

export interface GenerateIdeaCategoriesRequestData extends WithLanguage {
  count?: number;
  context?: string;
}

export interface RandomIdeaRequestData {
  language?: string;
}

export interface GenerateIdeaRequestData extends WithCategory, WithLanguage {}

export interface SubjectRequestData extends WithIdeaText, WithLanguage {}

export interface GenerateTasksRequestData extends  SubjectRequestData {}


export interface DiscardTasksRequestData extends WithIdeaText, WithLanguage {
  tasks: string;
  tasksdiscard: string;
}

export interface RequirementScoreRequestData extends WithCategory, WithMandatoryLanguage {
  maxscore: number;
}

export interface OperationRequestData extends WithLanguage {
  idea1: string;
  idea2?: string;
  operation: "Combine" | "Integrate";
}

export interface HelpTaskRequestData extends WithIdeaText, WithLanguage {
  task: string;
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

export interface Idea extends BaseIdeaIdentity, WithLanguage {
  category?: string;
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
    const headers = new HttpHeaders({
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

  private _callFlow<TRequest, TResponseRaw, TResponseFinal = TResponseRaw>(
    flowName: string,
    data: TRequest | undefined,
    bypassCache: boolean,
    noLoading: boolean,
    options: {
      isDataOptional?: boolean; // True if data can be {} when undefined
      transformFn?: (rawResult: TResponseRaw, originalData: TRequest | undefined) => TResponseFinal;
    } = {}
  ): Observable<TResponseFinal> {
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    
    const body = options.isDataOptional ? { data: data || {} } : { data };
    
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<TResponseRaw>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1),
        map(response => this.extractResult<TResponseRaw>(response, flowName)),
        map(rawResult => {
          if (options.transformFn) {
            return options.transformFn(rawResult, data);
          }
          return rawResult as unknown as TResponseFinal;
        }),
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
  callGenerateIdeaCategories(
    data?: GenerateIdeaCategoriesRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'generateIdeaCategories';
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    return this._callFlow<GenerateIdeaCategoriesRequestData, string[], string[]>(
      flowName,
      data,
      bypassCache,
      noLoading,
      { isDataOptional: true }
    );
  }

  callGenerateIdea(
    data: GenerateIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'generateIdeaFlow';    
    return this._callFlow<GenerateIdeaRequestData, any, Idea>( // Assuming backend might return string or Idea-like object
      flowName,
      data,
      bypassCache,
      noLoading,
      {
        transformFn: (rawResult, originalData) => ({
          text: typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult),
          category: originalData!.category,
          language: originalData!.language
        } as Idea)
      }
    );
  }

  callRandomIdea(
    data?: RandomIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'randomIdeaFlow';    
    return this._callFlow<RandomIdeaRequestData, any, Idea>( // Assuming backend might return string or Idea-like object
      flowName,
      data,
      bypassCache,
      noLoading,
      {
        isDataOptional: true,
        transformFn: (rawResult, originalData) => ({
          text: typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult),
          language: originalData?.language
        } as Idea)
      }
    );
  }

  callSubject(
    data: SubjectRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'subjectFlow';    
    return this._callFlow<SubjectRequestData, string>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callGenerateTasks(
    data: GenerateTasksRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'generateTasks';    
    return this._callFlow<GenerateTasksRequestData, string[]>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callOperation(
    data: OperationRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'ideaOperationFlow';    
    return this._callFlow<OperationRequestData, string>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callDiscardTasks(
    data: DiscardTasksRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'discardTasksFlow';    
    return this._callFlow<DiscardTasksRequestData, string[]>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callScoreIdea(
    data: ScoreIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<number> {
    const flowName = 'scoreIdeaFlow';    
    return this._callFlow<ScoreIdeaRequestData, string, number>(
      flowName,
      data,
      bypassCache,
      noLoading,
      {
        transformFn: (responseText) => {
            const score = parseInt(responseText, 10);
            if (isNaN(score)) {
              console.error(`GenkitService (${flowName}): Failed to parse score from response: "${responseText}"`);
              throw new Error(`Could not parse the score received from ${flowName}. Response: "${responseText}"`);
            }
            if (score < 1 || score > 10) {
               console.warn(`GenkitService (${flowName}): Score ${score} is outside the expected range (1-10). Response: "${responseText}"`);
            }
            return score;
        },
      }
    );
  }

  callRequirementScore(
    data: RequirementScoreRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'requirementScoreFlow';    
    return this._callFlow<RequirementScoreRequestData, string>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callHelpTask(
    data: HelpTaskRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'helpTaskFlow';    
    return this._callFlow<HelpTaskRequestData, string>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callGetPrompt(
    data: GetPromptRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<EncryptedPayloadData> {
    const flowName = 'getPrompt';    
    return this._callFlow<GetPromptRequestData, EncryptedPayloadData>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  callExecFlow(
    data: ExecFlowRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string> {
    const flowName = 'execFlow';    
    return this._callFlow<ExecFlowRequestData, string>(
      flowName,
      data,
      bypassCache,
      noLoading
    );
  }

  clearCache(): void {
    this.cache.clear();
    console.log('GenkitService: Cache cleared.');
  }
}