import { ai } from '../config/genkit'
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

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
