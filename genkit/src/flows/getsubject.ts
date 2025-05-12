import { ai } from '../config/genkit'
import { z } from 'zod';

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
    const modelToUse = process.env.CUSTOM_MODEL;
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