/**
 * @fileoverview Defines the 'generateTasksFlow' Genkit flow.
 * This flow is responsible for generating a list of development tasks
 * for a given idea. It uses an AI model and a specific prompt ('devel')
 * to break down the idea into actionable steps.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `generateTasksFlow`.
 * It expects an `idea` string and an optional `language` string (defaulting to 'english').
 */
const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  language: z.string().optional().default('english').describe("The language in which the model should respond"),
});

/**
 * Zod schema for the output of the `generateTasksFlow`.
 * It returns an array of strings, where each string is a development task for the idea.
 */
const TaskOutputSchema = z.array(z.string()).describe("An array of development steps for the idea.");

/**
 * Defines a Genkit flow named 'generateTasks'.
 *
 * This flow takes an idea as input and generates a list of development tasks required to implement it.
 * It utilizes an AI model, selected via `getModelToUse()`, and a prompt template named 'devel'.
 * The language for the AI's response can be optionally specified.
 *
 * Input is validated against `TaskInputSchema` (requiring an `idea` string and an optional `language` string).
 * Output conforms to `TaskOutputSchema` (an array of task strings).
 *
 * Processing Steps:
 * 1. Retrieves the 'devel' prompt template.
 * 2. Selects an AI model using `getModelToUse()`.
 * 3. Calls the AI model with the input and the 'devel' prompt.
 * 4. Parses the raw text response from the AI:
 *    - Splits the response by newline characters.
 *    - Trims whitespace from each line.
 *    - Removes leading list markers (e.g., '*', '-', '+').
 *    - Filters out any empty lines.
 * 5. Returns the cleaned array of task strings. If the AI response is empty or whitespace-only,
 *    an empty array is returned and a warning is logged.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {z.infer<typeof TaskInputSchema>} input - The input object containing the idea and optional language.
 * @returns {Promise<string[]>} A promise that resolves to an array of strings, where each string is a development task.
 * @throws {Error} If the AI model is not configured.
 */
export const generateTasksFlow = ai.defineFlow(
  {
    name: 'generateTasks',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('devel');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await develPrompt(
      input, {
      model: modelToUse
    }
    );
    const rawResponse = result.text;

    if (!rawResponse || rawResponse.trim() === '') {
      console.warn("AI returned an empty response.");
      return [];
    }

    const tasks = rawResponse
      .split('\n')
      .map(line => line.trim())
      .map(line => line.replace(/^[\*\-\+]\s*/, ''))
      .filter(line => line.length > 0);

    return tasks;
  }
);