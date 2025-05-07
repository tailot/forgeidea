import { ai } from '../config/genkit';
import { z } from 'zod';

export const operationFlow = ai.defineFlow(
  {
    name: 'ideaOperationFlow',
    inputSchema: z.object({
      language: z.string().default('english'),
      idea1: z.string(),
      idea2: z.string(),
      operation: z.enum([
        "Combine",
        "Integrate"
      ]).describe("Choose the operation to perform on the ideas.")
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const ideaOperationPrompt = ai.prompt('operationidea');
    const modelToUse = process.env.GEMINI_MODEL || 'ollama/gemma3:4b';

    const result = await ideaOperationPrompt(
      input, {
      model: modelToUse
    }
    );

    const rawText = result.text;

    return rawText;
  }
);