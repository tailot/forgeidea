import { ai } from '../config/genkit'
import { z } from 'zod';

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
    const modelToUse = process.env.CUSTOM_MODEL;
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