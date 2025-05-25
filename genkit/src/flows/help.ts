/**
 * @fileoverview Defines the 'helpTaskFlow' Genkit flow.
 * This flow is designed to provide assistance or generate a descriptive document
 * for a specific task related to a given idea. It utilizes an AI model and a
 * dedicated prompt ('help') to generate the guidance.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `helpTaskFlow`.
 * It requires an `idea` string, a `task` string (the task to be developed),
 * and an optional `language` string (defaulting to 'english') for the response.
 */
const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  task: z.string().describe("The task to be developed"),
  language: z.string().optional().default('english').describe("The language in which the model should respond"),
});

/**
 * Zod schema for the output of the `helpTaskFlow`.
 * It returns a single string, which represents the descriptive document or help text.
 */
const TaskOutputSchema = z.string().describe("A descriptive document");

/**
 * Defines a Genkit flow named 'helpTaskFlow'.
 *
 * This flow generates a descriptive document or help text for a specific task
 * within the context of a larger idea. It leverages an AI model, selected via
 * `getModelToUse()`, and a prompt template named 'help'.
 *
 * The input for the flow, validated against `TaskInputSchema`, includes the overall `idea`,
 * the specific `task` for which help is sought, and an optional `language` for the response.
 * The output, conforming to `TaskOutputSchema`, is a single string containing the
 * generated help document.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {z.infer<typeof TaskInputSchema>} input - The input object containing the idea, task, and optional language.
 * @returns {Promise<string>} A promise that resolves to a string containing the help document.
 * @throws {Error} If the AI model is not configured.
 */
export const helpTaskFlow = ai.defineFlow(
  {
    name: 'helpTaskFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('help');
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
