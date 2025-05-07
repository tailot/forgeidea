import { ai } from '../config/genkit'
import { z } from 'zod';

export const generateIdeaFlow = ai.defineFlow(
  {
    name: 'generateIdeaFlow',
    inputSchema: z.object({
      category: z.string().describe("The category for which to generate the idea"),
      language: z.string().describe("The language in which the model should respond.")
    }),
    outputSchema: z.string().describe("The generated idea"),
  },
  async (params) => {
    console.log(`Generating idea for category: ${params.category}`);
    try {
      const ideaPromptFunction = ai.prompt('idea');
      const modelToUse = process.env.GEMINI_MODEL || 'ollama/gemma3:4b';

      const result = await ideaPromptFunction(
        params,
        {
          model: modelToUse,
          config: {
            temperature: 0.8,
            topP: 0.95
          },
        }
      );

      const ideaText = result.text;
      console.log("Idea generated successfully:", ideaText);
      return ideaText;

    } catch (error) {
      console.error(`Error generating idea for category "${params.category}":`, error);
      throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);