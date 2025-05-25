/**
 * @fileoverview Provides a utility to filter console error logs in production.
 * This module contains a function to suppress specific, known Genkit schema
 * validation errors from appearing in `console.error` output when the
 * application is running in a production environment. This helps to reduce
 * log noise from expected validation issues that are handled gracefully.
 */

/**
 * Applies a production-specific filter to `console.error` to suppress
 * known Genkit schema validation errors.
 *
 * This function checks if the `NODE_ENV` environment variable is set to 'production'.
 * If it is, it replaces the global `console.error` with a custom function.
 * The custom function inspects its arguments for messages containing the specific
 * string "GenkitError: INVALID_ARGUMENT: Schema validation failed".
 * If such a message is found (either as a direct string argument or within the
 * `message` property of an Error object or any object), the error log is suppressed.
 * Otherwise, the original `console.error` is called with the arguments.
 *
 * It is recommended to call this function early in the application's lifecycle
 * to ensure the filter is active before any potential logs are made.
 * An optional log message is printed to the console when the filter is successfully applied.
 *
 * @export
 */
export function applyGenkitProductionLogFilter(): void {
  // Only apply the filter in production environment
  if (process.env.NODE_ENV === 'production') {
    const originalConsoleError = console.error;
    const messageToSuppress = "GenkitError: INVALID_ARGUMENT: Schema validation failed";

    console.error = (...args: any[]) => {
      let isValidationError = false;

      for (const arg of args) {
        if (typeof arg === 'string' && arg.includes(messageToSuppress)) {
          isValidationError = true;
          break;
        }
        // Also check Error objects and objects with a message property
        if (typeof arg === 'object' && arg !== null && 'message' in arg && typeof arg.message === 'string' && arg.message.includes(messageToSuppress)) {
          isValidationError = true;
          break;
        }
      }

      if (!isValidationError) {
        originalConsoleError.apply(console, args);
      }
    };
    console.log("Genkit production log filter applied."); // Optional: log that the filter is active
  }
}