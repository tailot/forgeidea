import { ai } from '../config/genkit';
import { z } from 'zod';
import { generateIdeaCategoriesFlow } from './generateIdeaCategories';
import { generateIdeaFlow } from './generateIdea';

export const randomIdeaFlow = ai.defineFlow(
    {
        name: 'randomIdeaFlow',
        inputSchema: z.object({
            language: z.string().describe("The language in which the model should respond.")
        }),
        outputSchema: z.string().describe("A randomly generated idea based on a random category.")
    },
    async (params) => {
        try {
            const paramInput = {
                count: 25,
                specificity: "specific" as const,
                language: params.language
            };
            const categories = await generateIdeaCategoriesFlow(paramInput);

            if (!categories || categories.length === 0) {
                throw new Error("No categories were generated to choose from.");
            }

            const randomIndex = Math.floor(Math.random() * categories.length);
            const randomCategory = categories[randomIndex];

            const idea = await generateIdeaFlow({
                category: randomCategory,
                language: params.language
            });

            return idea;

        } catch (error) {
            throw new Error(`randomIdeaFlow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);
