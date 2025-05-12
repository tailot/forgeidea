import { ai } from '../config/genkit'
import { z } from 'zod';

const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  task: z.string().describe("The task to be developed"),
  language: z.string().optional().default('english').describe("The language in which the model should respond"),
});

const TaskOutputSchema = z.string().describe("A descriptive document");

export const helpTaskFlow = ai.defineFlow(
  {
    name: 'helpTaskFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('help');
    const modelToUse = process.env.CUSTOM_MODEL;
    const result = await develPrompt(
      input, {
      model: modelToUse
    }
    );
    return result.text;
  }
);
