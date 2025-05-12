import { ai } from '../config/genkit'
import { z } from 'zod';

const TaskInputSchema = z.object({
  idea: z.string().describe("The text of the idea"),
  tasks: z.string().describe("A list of tasks"),
  tasksdiscard: z.string().describe("A list of tasks to discard"),
  language: z.string().optional().default('english').describe("The language in which to respond"),
});

const TaskOutputSchema = z.array(z.string()).describe("An array of development steps for the idea."); // This was already in English

export const discardTasksFlow = ai.defineFlow(
  {
    name: 'discardTasksFlow',
    inputSchema: TaskInputSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input) => {
    const develPrompt = ai.prompt('discardtasks');
    const modelToUse = process.env.CUSTOM_MODEL;
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
