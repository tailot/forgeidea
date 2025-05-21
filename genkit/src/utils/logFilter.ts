/**
 * Applies a production-specific filter to console.error to suppress
 * known Genkit schema validation errors.
 * This function should be called early in the application's lifecycle.
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