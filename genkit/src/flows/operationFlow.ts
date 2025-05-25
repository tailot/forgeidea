/**
 * @fileoverview Defines the 'operationFlow' Genkit flow (internally named 'ideaOperationFlow').
 * This flow is designed to perform specified operations (such as 'Combine' or 'Integrate')
 * on two provided ideas. It utilizes an AI model and a dedicated prompt ('operationidea')
 * to generate a result based on the chosen operation and input ideas.
 */
import { ai } from '../config/genkit';
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'ideaOperationFlow' (exported as `operationFlow`).
 *
 * This flow takes two ideas (`idea1`, `idea2`) and an operation type (`Combine` or `Integrate`)
 * as input. It then uses an AI model, selected via `getModelToUse()`, and a prompt
 * template named 'operationidea' to perform the specified operation on the ideas.
 * The language for the AI's response can also be specified.
 *
 * Input Schema:
 *  - `language` (string, optional): The language for the AI's response (default: 'english').
 *  - `idea1` (string): The first idea.
 *  - `idea2` (string): The second idea.
 *  - `operation` (enum: "Combine" | "Integrate"): The operation to perform on the ideas.
 *
 * Output Schema:
 *  - (string): The text result from the AI model after performing the operation.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {object} input - The input object for the flow.
 * @param {string} [input.language] - Optional language for the response.
 * @param {string} input.idea1 - The first idea.
 * @param {string} input.idea2 - The second idea.
 * @param {"Combine" | "Integrate"} input.operation - The operation to perform.
 * @returns {Promise<string>} A promise that resolves to the AI-generated text representing the result of the operation.
 * @throws {Error} If the AI model is not configured.
 */
export const operationFlow = ai.defineFlow(
  {
    name: 'ideaOperationFlow',
    inputSchema: z.object({
      language: z.string().default('english'),
      idea1: z.string(),
      idea2: z.string(),
      operation: z.enum([
        "Combine",
        "Integrate"
      ]).describe("Choose the operation to perform on the ideas.")
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const ideaOperationPrompt = ai.prompt('operationidea');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await ideaOperationPrompt(
      input, {
      model: modelToUse
    }
    );

    const rawText = result.text;

    return rawText;
  }
);