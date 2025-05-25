/**
 * @fileoverview Defines the 'scoreIdeaFlow' Genkit flow.
 * This flow is responsible for evaluating or scoring a given idea.
 * It utilizes an AI model and a specific prompt ('ideascore') to generate
 * a textual score or descriptive evaluation of the input idea.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `scoreIdeaFlow`.
 * It expects a single string field: `idea`, representing the text of the idea to be scored.
 */
const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea")
});

/**
 * Zod schema for the output of the `scoreIdeaFlow`.
 * It returns a single string, which represents the AI-generated score
 * or descriptive evaluation document for the idea.
 */
const TaskOutputSchema = z.string().describe("A descriptive document");

/**
 * Defines a Genkit flow named 'scoreIdeaFlow'.
 *
 * This flow takes an idea as input and generates a textual score or evaluation for it.
 * It uses an AI model, selected via `getModelToUse()`, and a prompt template named 'ideascore'.
 *
 * The input for the flow is validated against `TaskInputSchema` (requiring an `idea` string).
 * The output, conforming to `TaskOutputSchema`, is a single string containing the
 * AI-generated score or descriptive document.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {z.infer<typeof TaskInputSchema>} input - The input object containing the idea to be scored.
 * @returns {Promise<string>} A promise that resolves to a string containing the score or evaluation of the idea.
 * @throws {Error} If the AI model is not configured.
 */
export const scoreIdeaFlow = ai.defineFlow(
  {
    name: 'scoreIdeaFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('ideascore');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await develPrompt(
      input, {
      model: modelToUse
    }
    );
    return result.text;
  }
);
