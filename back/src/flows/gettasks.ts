import { ai } from '../config/genkit'
import { z } from 'zod';

const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  language: z.string().optional().default('english').describe("The language in which the model should respond"),
});

const TaskOutputSchema = z.array(z.string()).describe("An array of development steps for the idea.");

export const generateTasksFlow = ai.defineFlow(
  {
    name: 'generateTasks',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('devel');
    const modelToUse = process.env.GEMINI_MODEL || 'ollama/gemma3:4b';
    const result = await develPrompt(
      input, {
      model: modelToUse
    }
    );
    const rawResponse = result.text;

    if (!rawResponse || rawResponse.trim() === '') {
      console.warn("AI returned an empty response.");
      return [];
    }

    const tasks = rawResponse
      .split('\n')
      .map(line => line.trim())
      .map(line => line.replace(/^[\*\-\+]\s*/, ''))
      .filter(line => line.length > 0);

    return tasks;
  }
);