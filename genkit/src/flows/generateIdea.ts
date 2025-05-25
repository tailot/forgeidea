/**
 * @fileoverview Defines the 'generateIdeaFlow' Genkit flow.
 * This flow is responsible for generating a new idea based on a specified category and language.
 * It utilizes an AI model, selected dynamically, and a predefined prompt ('idea') to
 * generate creative content.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'generateIdeaFlow'.
 *
 * This flow generates a creative idea based on a user-provided category and desired language.
 * It leverages a dynamically selected AI model (via `getModelToUse()`) and a specific prompt
 * template named 'idea'.
 *
 * Input Schema:
 *  - `category` (string): The category for which the idea should be generated.
 *  - `language` (string): The language in which the AI model should respond.
 *
 * Output Schema:
 *  - (string): The generated idea as a text string.
 *
 * Model Configuration:
 *  - Temperature: 0.8
 *  - Top P: 0.95
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *  - Catches errors during the AI model execution and re-throws a more specific error.
 *
 * @param {object} params - The input object for the flow.
 * @param {string} params.category - The category for idea generation.
 * @param {string} params.language - The language for the AI's response.
 * @returns {Promise<string>} A promise that resolves to the generated idea string.
 * @throws {Error} If the AI model is not configured or if an error occurs during idea generation.
 */
export const generateIdeaFlow = ai.defineFlow(
  {
    name: 'generateIdeaFlow',
    inputSchema: z.object({
      category: z.string().describe("The category for which to generate the idea"),
      language: z.string().describe("The language in which the model should respond.")
    }),
    outputSchema: z.string().describe("The generated idea"),
  },
  async (params) => {
    try {
      const ideaPromptFunction = ai.prompt('idea');
      const modelToUse = getModelToUse();

      if (!modelToUse) {
        throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
      }

      const result = await ideaPromptFunction(
        params,
        {
          model: modelToUse,
          config: {
            temperature: 0.8,
            topP: 0.95
          },
        }
      );

      const ideaText = result.text;
      return ideaText;

    } catch (error) {
      console.error(`Error generating idea for category "${params.category}":`, error);
      throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);