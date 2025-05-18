import { ai } from '../config/genkit';
import { z } from 'zod';

import { getModelToUse } from '../config/genkit';

const IdeaInputSchema = z.object({
  idea: z.string(),
});

const VerificationResultSchema = z.string();

export const verifyIdeaFlow = ai.defineFlow(
  {
    name: 'verifyIdeaFlow',
    inputSchema: IdeaInputSchema,
    outputSchema: VerificationResultSchema,
  },
  async (input) => {
    const verifyPrompt = await ai.prompt('verify');
    const modelToUse = getModelToUse();

    if (!modelToUse) {
      throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
    }

    const result = await verifyPrompt(
      input, {
      model: modelToUse
    })

    // input.idea === result.text :)
    return result.text;
  }
);