/**
 * @fileoverview Defines the 'discardTasksFlow' Genkit flow.
 * This flow takes an initial idea, a list of tasks, and a list of tasks to discard.
 * It then uses an AI model to refine the original task list by removing the specified tasks,
 * and returns the updated list of tasks. The language for the response can optionally be specified.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the input of the `discardTasksFlow`.
 * It expects an idea, a list of tasks, a list of tasks to discard, and an optional language.
 */
const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  tasks: z.string().describe("A list of tasks"),
  tasksdiscard: z.string().describe("A list of tasks to discard"),
  language: z.string().optional().default('english').describe("The language in which to respond"),
});

/**
 * Zod schema for the output of the `discardTasksFlow`.
 * It returns an array of strings, representing the refined list of development steps (tasks) for the idea.
 */
const TaskOutputSchema = z.array(z.string()).describe("An array of development steps for the idea."); // This was already in English

/**
 * Defines a Genkit flow named 'discardTasksFlow'.
 *
 * This flow is designed to refine a list of tasks based on a given idea.
 * It takes an initial set of tasks and a list of tasks to be discarded.
 * The flow utilizes an AI model, determined by `getModelToUse()`, and a prompt named 'discardtasks'.
 *
 * The input to the flow is validated against `TaskInputSchema`, and its output
 * conforms to `TaskOutputSchema`.
 *
 * If a model is not configured via the `CUSTOM_MODELS` environment variable, the flow will throw an error.
 * The flow processes the raw text response from the AI model, splitting it into individual tasks,
 * trimming whitespace, removing list markers (like '*' or '-'), and filtering out any empty lines.
 *
 * @param {z.infer<typeof TaskInputSchema>} input - The input object containing the idea, tasks, tasks to discard, and optional language.
 * @returns {Promise<string[]>} A promise that resolves to an array of strings, where each string is a refined task.
 * @throws {Error} If the AI model is not configured.
 */
export const discardTasksFlow = ai.defineFlow(
  {
    name: 'discardTasksFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('discardtasks');
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
