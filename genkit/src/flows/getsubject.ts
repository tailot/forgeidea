/**
 * @fileoverview Defines the 'subjectFlow' Genkit flow.
 * This flow is designed to generate a list of relevant subjects, keywords, or categories
 * based on an optional input idea and a specified language. It utilizes an AI model
 * to perform the generation.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'subjectFlow'.
 *
 * This flow generates a list of subjects (keywords or categories) related to an optional input idea.
 * It uses an AI model, selected via `getModelToUse()`, and a prompt named 'subjects'.
 * The language for the response can be specified, defaulting to 'english'.
 *
 * Input Schema:
 *  - `idea` (string, optional): The text of the idea for which to generate subjects.
 *  - `language` (string, optional): The language for the AI's response (default: 'english').
 *
 * Output Schema:
 *  - (string[]): An array of generated subject strings.
 *
 * Model Configuration:
 *  - Temperature: 0.8
 *  - Top P: 0.95
 *  - Top L: 32 (Note: 'topL' is not a standard Genkit/Google AI parameter, this might be a custom or erroneous setting)
 *
 * Processing:
 *  - The flow retrieves a prompt template named 'subjects'.
 *  - It calls the AI model with the user input and model configuration.
 *  - The raw text response from the model, expected to be a comma-separated list, is parsed.
 *  - Each subject is trimmed, and empty strings are filtered out.
 *  - If the AI returns an empty or whitespace-only response, an empty array is returned.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {object} input - The input object for the flow.
 * @param {string} [input.idea] - Optional idea text.
 * @param {string} [input.language] - Optional language for the response.
 * @returns {Promise<string[]>} A promise that resolves to an array of subject strings.
 * @throws {Error} If the AI model is not configured.
 */
export const subjectFlow = ai.defineFlow(
  {
    name: 'subjectFlow',
    inputSchema: z.object({
      idea: z.string().optional().describe("The text of the idea"),
      language: z.string().default('english').describe("The language in which the model should respond.")
    }),
    outputSchema: z.array(z.string()),
  },
  async (input) => {
    const subjectFlow = ai.prompt('subjects');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await subjectFlow(
      input,
      {
        model: modelToUse,
        config: {
          temperature: 0.8,
          topP: 0.95,
          topL: 32
        }
      }
    );
    const rawText = result.text;

    if (!rawText || rawText.trim() === '') {
      return [];
    }

    const categories = rawText
      .split(',')
      .map(category => category.trim())
      .filter(category => category.length > 0);

    return categories;

  }
);