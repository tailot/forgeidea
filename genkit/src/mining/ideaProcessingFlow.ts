import { ai } from '../config/genkit';
import { z } from 'zod';
import { generateIdeaFlow } from '../flows/generateIdea';
import { scoreIdeaFlow } from '../flows/scoreidea';

export const miningFlow = ai.defineFlow(
    {
        name: 'miningFlow',
        inputSchema: z.object({
            context: z.string().describe("Context"),
            language: z.string().describe("The language in which the model should respond.")
        }),
        outputSchema: z.string().describe("JSON string")
    },
    async (params) => {
        try {
            const paramInput = {
                category: params.context,
                language: params.language
            };
            const idea = await generateIdeaFlow(paramInput);
            const score = await scoreIdeaFlow({idea: idea});
            const modelToUse = process.env.CUSTOM_MODEL;

            const competitorsPrompt = ai.prompt('competitors');

            const competitorsResponse = await competitorsPrompt({idea: idea }, {model: modelToUse});
            const competitorsText = competitorsResponse.text;

            return JSON.stringify({idea: idea, score: score, competitors: competitorsText});

        } catch (error) {
            throw new Error(`miningFlow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);
