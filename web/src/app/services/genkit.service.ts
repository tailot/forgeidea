/**
 * @fileoverview Defines the `GenkitService` for the Angular web application.
 *
 * This service is the central point of communication with the Genkit backend.
 * It encapsulates all HTTP POST requests to various Genkit flows, providing
 * strongly-typed methods for each flow interaction. The service handles:
 *  - Constructing request bodies and headers.
 *  - Making HTTP POST calls to specific Genkit flow endpoints.
 *  - Processing responses, including extracting relevant data from the
 *    `GenkitFlowResponse` structure.
 *  - Implementing a caching mechanism (`shareReplay` with a local map) to avoid
 *    redundant API calls for identical requests.
 *  - Standardized error handling for HTTP errors, providing user-friendly messages.
 *  - Request timeout and retry logic.
 *  - Optional bypassing of the loading interceptor for specific calls.
 *
 * It also defines numerous interfaces that model the expected request and response
 * data structures for each Genkit flow, promoting type safety throughout the application.
 * The base URL for the Genkit API is sourced from the application's environment configuration.
 */
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

/** Interface for request data that can optionally include a language property. */
export interface WithLanguage {
  /** Optional language code (e.g., 'en', 'es'). */
  language?: string;
}

/** Interface for request data that must include a language property. */
export interface WithMandatoryLanguage {
  /** Required language code (e.g., 'en', 'es'). */
  language: string;
}

/** Interface for request data that includes an idea text. */
export interface WithIdeaText {
  /** The text of the idea. */
  idea: string;
}

/** Interface for request data that includes a category. */
export interface WithCategory {
  /** The category name. */
  category: string;
}

/** Base interface for identifying an idea, typically by ID and text. */
export interface BaseIdeaIdentity {
  /** The unique identifier of the idea. */
  id: string;
  /** The main text content of the idea. */
  text: string;
}

/** Data structure for requests to the 'scoreIdeaFlow'. Inherits idea text from `WithIdeaText`. */
export interface ScoreIdeaRequestData extends WithIdeaText {}

/** Data structure for requests to the 'generateIdeaCategories' flow. */
export interface GenerateIdeaCategoriesRequestData extends WithLanguage {
  /** Optional number of categories to generate. */
  count?: number;
  /** Optional context to influence category generation. */
  context?: string;
}

/** Data structure for requests to the 'randomIdeaFlow'. */
export interface RandomIdeaRequestData {
  /** Optional language for the generated random idea. */
  language?: string;
}

/** Data structure for requests to the 'generateIdeaFlow'. Requires category and optionally language. */
export interface GenerateIdeaRequestData extends WithCategory, WithLanguage {}

/** Data structure for requests to the 'subjectFlow'. Requires idea text and optionally language. */
export interface SubjectRequestData extends WithIdeaText, WithLanguage {}

/** Data structure for requests to the 'generateTasks' flow. Inherits from `SubjectRequestData`. */
export interface GenerateTasksRequestData extends  SubjectRequestData {}

/** Data structure for requests to the 'discardTasksFlow'. */
export interface DiscardTasksRequestData extends WithIdeaText, WithLanguage {
  /** A string representing the current list of tasks, typically newline-separated. */
  tasks: string;
  /** A string representing the list of tasks to be discarded, typically newline-separated. */
  tasksdiscard: string;
}

/** Data structure for requests to the 'requirementScoreFlow'. */
export interface RequirementScoreRequestData extends WithCategory, WithMandatoryLanguage {
  /** The maximum or reference score to be used in the scoring process. */
  maxscore: number;
}

/** Data structure for requests to the 'ideaOperationFlow'. */
export interface OperationRequestData extends WithLanguage {
  /** The first idea text for the operation. */
  idea1: string;
  /** The second idea text, optional depending on the operation. */
  idea2?: string;
  /** The type of operation to perform (e.g., combine two ideas). */
  operation: "Combine" | "Integrate";
}

/** Data structure for requests to the 'helpTaskFlow'. */
export interface HelpTaskRequestData extends WithIdeaText, WithLanguage {
  /** The specific task text for which help is requested. */
  task: string;
}

/** Data structure for requests to the 'getPrompt' flow. */
export interface GetPromptRequestData {
  /** Identifier for the generator or context of the prompt. */
  generator: string;
  /** Name of the prompt to retrieve/generate. */
  promptname: string;
}

/**
 * Represents an encrypted payload, typically used for secure transmission of prompts or data.
 */
export interface EncryptedPayloadData {
  /** The initialization vector (IV) used for encryption, in hex format. */
  iv: string;
  /** The encrypted data (ciphertext), in hex format. */
  encryptedData: string;
  /** The authentication tag generated during GCM encryption, in hex format. */
  authTag: string;
}

/** Data structure for requests to the 'execFlow'. */
export interface ExecFlowRequestData {
  /** The encrypted payload containing the prompt and potentially other data. */
  encryptedPromptPayload: EncryptedPayloadData;
  /** Optional key-value pairs for substituting variables in the decrypted prompt template. */
  promptVariables?: Record<string, any>;
}

/** Represents a document associated with an Idea. */
export interface IdeaDocument {
  /** A unique key or identifier for the document. */
  key: string;
  /** Optional name or title for the document. */
  name?: string;
  /** The main content of the document. */
  content: string;
  /** Timestamp of when the document was created, typically milliseconds since epoch. */
  createdAt: number;
}

/**
 * Represents an Idea object, combining identity, language, category, and associated documents.
 * This is a central data model used throughout the application.
 */
export interface Idea extends BaseIdeaIdentity, WithLanguage {
  /** Optional category to which the idea belongs. */
  category?: string;
  /** Optional array of documents (e.g., detailed task help, notes) associated with the idea. */
  documents?: IdeaDocument[];
}

/**
 * Generic wrapper for responses from Genkit flows.
 * Genkit flows might return data in a `result` field or an `output` field.
 * This interface also allows for other potential top-level fields in the response.
 * @template T The expected type of the actual data within the response.
 */
export interface GenkitFlowResponse<T> {
  /** The primary field where Genkit flow results are often found. */
  result?: T;
  /** An alternative field where Genkit flow results might be found. */
  output?: T;
  /** Allows for any other properties that might be present in the response. */
  [key: string]: any;
}

/**
 * Service for interacting with Genkit backend flows.
 *
 * This service provides methods to call various Genkit flows via HTTP POST requests.
 * It handles request construction, response extraction, caching, error handling,
 * request timeout, and retries. It uses a centralized `_callFlow` private method
 * to manage these common aspects for all flow calls.
 *
 * @Injectable Decorator Details:
 *  - `providedIn`: 'root' - Makes the service a singleton available application-wide.
 */
@Injectable({
  providedIn: 'root'
})
export class GenkitService {

  /** Base URL for the Genkit API, loaded from environment configuration. */
  private apiUrlBase = environment.genkitApiUrl;
  /** Default timeout for HTTP requests in milliseconds. */
  private requestTimeout = 60000; // 60 seconds

  /**
   * In-memory cache for storing Observable responses from Genkit flow calls.
   * The key is generated from the flow name and request data.
   * Uses `shareReplay` to ensure subscribers share the same response stream.
   * @private
   * @type {Map<string, Observable<any>>}
   */
  private cache = new Map<string, Observable<any>>();

  /**
   * Constructs the GenkitService.
   * @param {HttpClient} http - Angular's HttpClient for making HTTP requests.
   */
  constructor(private http: HttpClient) {
    if (!this.apiUrlBase) {
      console.error("CRITICAL ERROR: Genkit API URL not configured in environment.ts! Ensure `genkitApiUrl` is set.");
    }
  }

  /**
   * Creates standard HTTP headers for Genkit API requests.
   * Sets 'Content-Type' and 'Accept' to 'application/json'.
   * @returns {HttpHeaders} The HttpHeaders object.
   * @private
   */
  private createHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    // Potential future addition: Authorization header if needed
    // const authToken = this.authService.getToken(); // Example
    // if (authToken) {
    //   headers = headers.set('Authorization', `Bearer ${authToken}`);
    // }
    return headers;
  }

  /**
   * Handles HTTP errors from Genkit API calls.
   * Logs the detailed error to the console and returns an Observable
   * that emits a user-friendly error message.
   * Differentiates between client-side/network errors and backend HTTP errors,
   * providing more specific messages based on HTTP status codes.
   *
   * @param {HttpErrorResponse} error - The HTTP error response.
   * @param {string} flowName - The name of the Genkit flow that was called.
   * @returns {Observable<never>} An Observable that throws an error with a user-friendly message.
   * @private
   */
  private handleError(error: HttpErrorResponse, flowName: string): Observable<never> {
    let userFriendlyErrorMessage = `An unexpected error occurred while calling the flow '${flowName}'. Please try again.`;

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      console.error(`GenkitService: Network or client error calling ${flowName}:`, error.error.message);
      userFriendlyErrorMessage = `A network error occurred while trying to reach ${flowName}. Please check your connection.`;
    } else {
      // The backend returned an unsuccessful response code.
      console.error(
        `GenkitService: Error from Genkit backend (Flow: ${flowName}, Status: ${error.status}, URL: ${error.url}): `,
        error.error // The body may contain clues as to what went wrong.
      );

      let backendMessage = '';
      if (error.error) {
        if (typeof error.error === 'string') { backendMessage = error.error; }
        else if (error.error.message) { backendMessage = error.error.message; }
        else if (error.error.details) { backendMessage = error.error.details; }
        // Check for nested error messages common in some backend frameworks
        else if (error.error.error && typeof error.error.error.message === 'string') { backendMessage = error.error.error.message; }
      }

      switch (error.status) {
        case 400: userFriendlyErrorMessage = `Invalid request for ${flowName}. Please check the data submitted. ${backendMessage ? 'Details: ' + backendMessage : ''}`; break;
        case 401: userFriendlyErrorMessage = `Authentication failed for ${flowName}. Please ensure you are logged in or have the correct permissions.`; break;
        case 403: userFriendlyErrorMessage = `Access denied to ${flowName}. You do not have permission to perform this action.`; break;
        case 404: userFriendlyErrorMessage = `The flow '${flowName}' could not be found on the server. The API endpoint (${error.url}) might be incorrect.`; break;
        case 429: userFriendlyErrorMessage = `Too many requests made to ${flowName}. Please try again later.`; break;
        case 500: case 502: case 503: case 504:
          userFriendlyErrorMessage = `The Genkit server encountered an internal error (Flow: ${flowName}, Code: ${error.status}). Please try again later. ${backendMessage ? 'Details: ' + backendMessage : ''}`; break;
        default: userFriendlyErrorMessage = `An HTTP error ${error.status} occurred while calling ${flowName}. ${backendMessage ? 'Details: ' + backendMessage : ''}`;
      }
    }
    // Return an observable that emits a new Error object with the user-friendly message.
    return throwError(() => new Error(userFriendlyErrorMessage));
  }

  /**
   * Extracts the actual result data from a generic `GenkitFlowResponse`.
   * Genkit flows might place their primary output in either a `result` or `output` field.
   * This method checks both and throws an error if neither is found or if the value is null/undefined.
   *
   * @template T The expected type of the result data.
   * @param {GenkitFlowResponse<T>} response - The raw response object from the Genkit flow.
   * @param {string} flowName - The name of the Genkit flow, used for error logging.
   * @returns {T} The extracted result data.
   * @throws {Error} If the response does not contain a valid 'result' or 'output' field.
   * @private
   */
  private extractResult<T>(response: GenkitFlowResponse<T>, flowName: string): T {
    // Prefer 'result', fallback to 'output', then check for null/undefined explicitly.
    const result = response.result ?? response.output;
    if (result === undefined || result === null) { // Stricter check for null/undefined
      console.error(`GenkitService (${flowName}): Response does not contain valid 'result' or 'output' field, or the value is null/undefined. Response:`, response);
      throw new Error(`Invalid response format from flow '${flowName}'. Expected data in 'result' or 'output' field.`);
    }
    return result;
  }

  /**
   * Generates a cache key for a flow call based on the flow name and request data.
   * Sorts object keys in the data before stringifying to ensure consistency.
   * Falls back to a timestamped key if data stringification fails.
   *
   * @param {string} flowName - The name of the Genkit flow.
   * @param {any} data - The request data for the flow.
   * @returns {string} A unique cache key string.
   * @private
   */
  private generateCacheKey(flowName: string, data: any): string {
    try {
      // Ensure consistent key order for objects for reliable cache keys
      const dataString = JSON.stringify(data, (key, value) =>
        value instanceof Object && !Array.isArray(value)
          ? Object.keys(value).sort().reduce((sorted: any, k) => { sorted[k] = value[k]; return sorted; }, {})
          : value
      );
      return `${flowName}::${dataString}`;
    } catch (e) {
      console.warn(`GenkitService: Could not stringify data for cache key for flow ${flowName}. Using timestamp fallback. Data:`, data, e);
      // Fallback to a less reliable but still somewhat unique key if stringification fails
      return `${flowName}::${Date.now()}`;
    }
  }

  /**
   * Generic private method to call a Genkit backend flow.
   * Handles HTTP POST request, caching, timeout, retry, response extraction,
   * optional data transformation, and error handling.
   *
   * @template TRequest The type of the request data.
   * @template TResponseRaw The raw type of the data expected within the 'result' or 'output' field of the Genkit response.
   * @template TResponseFinal The final type of the response after optional transformation. Defaults to `TResponseRaw`.
   * @param {string} flowName - The name of the Genkit flow (corresponds to the API endpoint path).
   * @param {TRequest | undefined} data - The request data payload for the flow.
   * @param {boolean} bypassCache - If true, the request will bypass the cache and fetch fresh data.
   * @param {boolean} noLoading - If true, the HTTP request will have `BYPASS_LOADING` context,
   *                              preventing global loading indicators if `LoadingInterceptor` is used.
   * @param {object} [options={}] - Optional configuration for the flow call.
   * @param {boolean} [options.isDataOptional=false] - If true, allows `data` to be undefined,
   *                                                   and an empty object `{}` will be sent in the `data` field of the request body.
   *                                                   Otherwise, `data` is sent as is.
   * @param {(rawResult: TResponseRaw, originalData: TRequest | undefined) => TResponseFinal} [options.transformFn] -
   *        An optional function to transform the raw result from the flow before it's emitted or cached.
   * @returns {Observable<TResponseFinal>} An Observable emitting the final (potentially transformed) response data.
   * @private
   */
  private _callFlow<TRequest, TResponseRaw, TResponseFinal = TResponseRaw>(
    flowName: string,
    data: TRequest | undefined,
    bypassCache: boolean,
    noLoading: boolean,
    options: {
      isDataOptional?: boolean;
      transformFn?: (rawResult: TResponseRaw, originalData: TRequest | undefined) => TResponseFinal;
    } = {}
  ): Observable<TResponseFinal> {
    if (!this.apiUrlBase) {
      return throwError(() => new Error("Genkit API URL is not configured. Cannot call flow: " + flowName));
    }
    const endpointUrl = `${this.apiUrlBase}/${flowName}`;
    const headers = this.createHeaders();
    
    // Genkit flows typically expect data under a 'data' key in the request body.
    const body = options.isDataOptional ? { data: data || {} } : { data };
    
    const cacheKey = this.generateCacheKey(flowName, data);
    const context = new HttpContext().set(BYPASS_LOADING, noLoading);

    if (!bypassCache && this.cache.has(cacheKey)) {
      // console.log(`GenkitService: Returning cached response for ${cacheKey}`);
      return this.cache.get(cacheKey)!;
    }

    // console.log(`GenkitService: Calling ${endpointUrl} (Cache key: ${cacheKey}, Bypass: ${bypassCache})`, body);
    const request$ = this.http.post<GenkitFlowResponse<TResponseRaw>>(endpointUrl, body, { headers, context })
      .pipe(
        timeout(this.requestTimeout),
        retry(1), // Retry failed requests once
        map(response => this.extractResult<TResponseRaw>(response, flowName)),
        map(rawResult => {
          if (options.transformFn) {
            return options.transformFn(rawResult, data);
          }
          // If no transformFn, TResponseRaw must be assignable to TResponseFinal.
          // This 'as unknown as TResponseFinal' is safe if TResponseFinal defaults to TResponseRaw.
          return rawResult as unknown as TResponseFinal;
        }),
        catchError(error => {
          this.cache.delete(cacheKey); // Remove from cache on error to avoid caching failed requests
          return this.handleError(error, flowName);
        }),
        // tap(() => console.log(`GenkitService: Caching response for ${cacheKey}`)), // Log before caching
        shareReplay({ bufferSize: 1, refCount: false }) // Cache the result and share among subscribers
      );

    if (!bypassCache) { // Only set cache if not bypassing
        this.cache.set(cacheKey, request$);
    }
    return request$;
  }

  /**
   * Calls the 'generateIdeaCategories' Genkit flow.
   * @param {GenerateIdeaCategoriesRequestData} [data] - Optional request data including context, count, and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string[]>} An Observable emitting an array of category strings.
   */
  callGenerateIdeaCategories(
    data?: GenerateIdeaCategoriesRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<string[]> {
    const flowName = 'generateIdeaCategories';
    // const endpointUrl = `${this.apiUrlBase}/${flowName}`; // Not needed here, _callFlow handles it
    return this._callFlow<GenerateIdeaCategoriesRequestData, string[], string[]>(
      flowName,
      data,
      bypassCache,
      noLoading,
      { isDataOptional: true } // Data is optional for this flow
    );
  }

  /**
   * Calls the 'generateIdeaFlow' Genkit flow.
   * Transforms the raw response (which might be a string or object) into an `Idea` object.
   * @param {GenerateIdeaRequestData} data - Request data including category and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<Idea>} An Observable emitting the generated `Idea`.
   */
  callGenerateIdea(
    data: GenerateIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'generateIdeaFlow';
    return this._callFlow<GenerateIdeaRequestData, any, Idea>(
      flowName,
      data,
      bypassCache,
      noLoading,
      {
        transformFn: (rawResult, originalData) => ({
          text: typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult), // Ensure text is string
          category: originalData!.category, // Assert originalData is defined as it's not optional for this flow
          language: originalData!.language,
          id: crypto.randomUUID() // Generate a client-side ID if not provided by backend
        } as Idea)
      }
    );
  }

  /**
   * Calls the 'randomIdeaFlow' Genkit flow.
   * Transforms the raw response into an `Idea` object.
   * @param {RandomIdeaRequestData} [data] - Optional request data including language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<Idea>} An Observable emitting the generated random `Idea`.
   */
  callRandomIdea(
    data?: RandomIdeaRequestData,
    bypassCache = false,
    noLoading: boolean = false
  ): Observable<Idea> {
    const flowName = 'randomIdeaFlow';
    return this._callFlow<RandomIdeaRequestData, any, Idea>(
      flowName,
      data,
      bypassCache,
      noLoading,
      {
        isDataOptional: true, // Data is optional
        transformFn: (rawResult, originalData) => ({
          text: typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult), // Ensure text is string
          language: originalData?.language,
          id: crypto.randomUUID() // Generate a client-side ID
        } as Idea)
      }
    );
  }

  /**
   * Calls the 'subjectFlow' Genkit flow.
   * @param {SubjectRequestData} data - Request data including idea text and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string>} An Observable emitting the result string from the flow.
   */
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

  /**
   * Calls the 'generateTasks' Genkit flow.
   * @param {GenerateTasksRequestData} data - Request data including idea text and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string[]>} An Observable emitting an array of task strings.
   */
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

  /**
   * Calls the 'ideaOperationFlow' Genkit flow.
   * @param {OperationRequestData} data - Request data for the operation, including ideas and operation type.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string>} An Observable emitting the result string from the operation.
   */
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

  /**
   * Calls the 'discardTasksFlow' Genkit flow.
   * @param {DiscardTasksRequestData} data - Request data including idea text, current tasks, and tasks to discard.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string[]>} An Observable emitting the updated array of task strings.
   */
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

  /**
   * Calls the 'scoreIdeaFlow' Genkit flow.
   * Transforms the raw string response into a number. Handles potential parsing errors.
   * @param {ScoreIdeaRequestData} data - Request data including the idea text to score.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<number>} An Observable emitting the numerical score.
   * @throws {Error} If the score cannot be parsed from the response.
   */
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
              // console.error(`GenkitService (${flowName}): Failed to parse score from response: "${responseText}"`);
              throw new Error(`Could not parse the score received from ${flowName}. Response: "${responseText}"`);
            }
            // Optional: Add range validation if scores are expected to be within a certain range
            if (score < 1 || score > 10) { // Example range
               // console.warn(`GenkitService (${flowName}): Score ${score} is outside the expected range (1-10). Response: "${responseText}"`);
            }
            return score;
        },
      }
    );
  }

  /**
   * Calls the 'requirementScoreFlow' Genkit flow.
   * @param {RequirementScoreRequestData} data - Request data including category, max score, and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string>} An Observable emitting the result string from the flow.
   */
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

  /**
   * Calls the 'helpTaskFlow' Genkit flow.
   * @param {HelpTaskRequestData} data - Request data including idea text, task, and language.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string>} An Observable emitting the help text string.
   */
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

  /**
   * Calls the 'getPrompt' Genkit flow.
   * @param {GetPromptRequestData} data - Request data including generator and prompt name.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<EncryptedPayloadData>} An Observable emitting the encrypted prompt payload.
   */
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

  /**
   * Calls the 'execFlow' Genkit flow.
   * @param {ExecFlowRequestData} data - Request data including the encrypted prompt payload and optional variables.
   * @param {boolean} [bypassCache=false] - If true, bypasses the cache for this request.
   * @param {boolean} [noLoading=false] - If true, suppresses global loading indicators for this request.
   * @returns {Observable<string>} An Observable emitting the result string from the executed flow.
   */
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

  /**
   * Clears the internal cache of Genkit flow responses.
   */
  clearCache(): void {
    this.cache.clear();
    // console.log('GenkitService: Cache cleared.');
  }
}