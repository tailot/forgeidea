/**
 * @fileoverview Defines the 'generateIdeaCategoriesFlow' Genkit flow.
 * This flow is responsible for generating a list of idea categories.
 * It can take an optional context, a desired number of categories, and a language as input.
 * It uses an AI model to generate these categories and includes a fallback mechanism.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'generateIdeaCategories'.
 *
 * This flow generates a list of idea categories. It uses an AI model, selected via `getModelToUse()`,
 * and a prompt named 'categories'. The user can provide an optional context for the types of ideas,
 * specify the number of categories to generate (between 20 and 35, defaulting to 20),
 * and set the language for the response.
 *
 * Input Schema:
 *  - `context` (string, optional): Context or type of ideas (e.g., 'tech startups', 'community projects').
 *  - `count` (number, optional): Number of categories to generate (min: 20, max: 35, default: 20).
 *  - `language` (string): The language for the AI's response.
 *
 * Output Schema:
 *  - (string[]): An array of generated category names.
 *
 * Model Configuration:
 *  - Temperature: 0.8
 *  - Top P: 0.95
 *
 * Processing:
 *  - The flow retrieves a prompt template named 'categories'.
 *  - It calls the AI model with the user input and model configuration.
 *  - The raw text response from the model, expected to be a comma-separated list, is parsed.
 *  - Each category is trimmed, and empty strings are filtered out.
 *  - If the AI returns an empty or whitespace-only response, a default list of categories is returned:
 *    `["Innovation", "Efficiency", "Growth", "Feasibility", "Impact"]`.
 *
 * Error Handling:
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {object} input - The input object for the flow.
 * @param {string} [input.context] - Optional context for idea generation.
 * @param {number} [input.count] - Optional number of categories to generate.
 * @param {string} input.language - The language for the AI's response.
 * @returns {Promise<string[]>} A promise that resolves to an array of category strings.
 * @throws {Error} If the AI model is not configured.
 */
export const generateIdeaCategoriesFlow = ai.defineFlow(
  {
    name: 'generateIdeaCategories',
    inputSchema: z.object({
      context: z.string().optional().describe("Context or type of ideas (e.g., 'tech startups', 'community projects', 'self-improvement')"),
      count: z.number().min(20).max(35).optional().default(20).describe("Number of categories to generate"),
      language: z.string().describe("The language in which the model should respond.")
    }),
    outputSchema: z.array(z.string()).describe("An array of generated category names."), // Added a description for clarity
  },
  async (input) => {
    const categoriesFlow = ai.prompt('categories');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await categoriesFlow(
      input,
      {
        model: modelToUse,
        config: {
          temperature: 0.8,
          topP: 0.95
        }
      }
    );

    const rawText = result.text;

    if (!rawText || rawText.trim() === '') {
      return ["Innovation", "Efficiency", "Growth", "Feasibility", "Impact"];
    }

    const categories = rawText
      .split(',')
      .map(category => category.trim())
      .filter(category => category.length > 0);
    return categories;
  }
);