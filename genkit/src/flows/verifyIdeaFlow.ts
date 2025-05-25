/**
 * @fileoverview Defines the 'verifyIdeaFlow' Genkit flow.
 * This flow is designed to take an idea as input, process it using an AI model
 * with a 'verify' prompt, and return the result. Based on internal comments,
 * this might involve echoing the idea or performing a simple validation.
 */
import { ai } from '../config/genkit';
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `verifyIdeaFlow`.
 * It expects a single string field: `idea`.
 */
const IdeaInputSchema = z.object({
  idea: z.string(),
});

/**
 * Zod schema for the output of the `verifyIdeaFlow`.
 * It returns a single string, representing the verification result from the AI model.
 */
const VerificationResultSchema = z.string();

/**
 * Defines a Genkit flow named 'verifyIdeaFlow'.
 *
 * This flow takes an idea string as input and processes it using an AI model
 * with a prompt template named 'verify'. The exact nature of the "verification"
 * depends on the 'verify' prompt's content, but an internal comment suggests
 * it might echo the input idea (`input.idea === result.text`).
 *
 * The input is validated against `IdeaInputSchema` (requiring an `idea` string).
 * The output conforms to `VerificationResultSchema` (a single string).
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {z.infer<typeof IdeaInputSchema>} input - The input object containing the idea string.
 * @returns {Promise<string>} A promise that resolves to the AI model's text response
 *   after processing the idea with the 'verify' prompt.
 * @throws {Error} If the AI model is not configured.
 */
export const verifyIdeaFlow = ai.defineFlow(
  {
    name: 'verifyIdeaFlow',
    inputSchema: IdeaInputSchema,
    outputSchema: VerificationResultSchema,
  },
  async (input) => {
    const verifyPrompt = await ai.prompt('verify');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await verifyPrompt(
      input, {
      model: modelToUse
    })

    // input.idea === result.text :)
    return result.text;
  }
);