import { ai } from '../config/genkit';
import { z } from 'zod';

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
    const modelToUse = process.env.GEMINI_MODEL || 'ollama/gemma3:4b';

    const result = await verifyPrompt(
      input, {
      model: modelToUse
    })

    // input.idea === result.text :)   
    return result.text;
  }
);