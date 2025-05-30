/**
 * @fileoverview Defines the 'zoomTaskFlow' Genkit flow.
 * This flow is designed to provide a more detailed or "zoomed-in" description
 * of a specific task within the context of a larger idea. It utilizes an AI model
 * and a dedicated prompt ('zoomtask') to generate this elaboration.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `zoomTaskFlow`.
 * It requires an `idea` string, a `task` string (the specific task to elaborate on),
 * and an optional `language` string (defaulting to 'english') for the response.
 */
const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  task: z.string().describe("The task to be developed"),
  language: z.string().optional().default('english').describe("The language in which the model should respond"),
});

/**
 * Zod schema for the output of the `zoomTaskFlow`.
 * It returns a single string, which represents the detailed/zoomed-in
 * description or elaboration of the task.
 */
const TaskOutputSchema = z.string().describe("A descriptive document");

/**
 * Defines a Genkit flow named 'zoomTaskFlow'.
 *
 * This flow provides a detailed or "zoomed-in" elaboration for a specific task,
 * considering its context within a larger idea. It uses an AI model, selected
 * via `getModelToUse()`, and a prompt template named 'zoomtask'.
 *
 * The input for the flow, validated against `TaskInputSchema`, includes the overall `idea`,
 * the specific `task` to be elaborated upon, and an optional `language` for the response.
 * The output, conforming to `TaskOutputSchema`, is a single string containing the
 * detailed description generated by the AI.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {z.infer<typeof TaskInputSchema>} input - The input object containing the idea, task, and optional language.
 * @returns {Promise<string>} A promise that resolves to a string containing the detailed task elaboration.
 * @throws {Error} If the AI model is not configured.
 */
export const zoomTaskFlow = ai.defineFlow(
  {
    name: 'zoomTaskFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('zoomtask');
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
