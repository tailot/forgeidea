import { ai } from '../config/genkit'
import { z } from 'zod';

const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea")
});

const TaskOutputSchema = z.string().describe("A descriptive document");

export const scoreIdeaFlow = ai.defineFlow(
  {
    name: 'scoreIdeaFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('ideascore');
    const modelToUse = process.env.CUSTOM_MODEL;
    const result = await develPrompt(
      input, {
      model: modelToUse
    }
    );
    return result.text;
  }
);
