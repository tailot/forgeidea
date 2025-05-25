/**
 * @fileoverview Defines the 'miningFlow' Genkit flow.
 * This flow orchestrates a multi-step process for idea mining and analysis.
 * It takes a context and language as input, then:
 * 1. Generates an idea within that context using `generateIdeaFlow`.
 * 2. Scores the generated idea using `scoreIdeaFlow`.
 * 3. Identifies potential competitors for the idea using an AI model and a 'competitors' prompt.
 * Finally, it returns a JSON string containing the generated idea, its score, and the list of competitors.
 */
import { ai, getModelToUse } from '../config/genkit';
import { z } from 'zod';
import { generateIdeaFlow } from '../flows/generateIdea';
import { scoreIdeaFlow } from '../flows/scoreidea';

/**
 * Defines a Genkit flow named 'miningFlow'.
 *
 * This flow performs a sequence of operations to process an idea:
 * 1. Generates an idea based on the input `context` (used as `category`) and `language`
 *    by calling `generateIdeaFlow`.
 * 2. Scores the generated idea by calling `scoreIdeaFlow`.
 * 3. Identifies competitors for the generated idea using a dynamically selected AI model
 *    (via `getModelToUse()`) and a prompt template named 'competitors'.
 * 4. Returns a JSON string containing the `idea`, its `score`, and the `competitorsText`.
 *
 * Input Schema:
 *  - `context` (string): The context or category for idea generation.
 *  - `language` (string): The language for AI model responses.
 *
 * Output Schema:
 *  - (string): A JSON string of the format:
 *    `{"idea": "...", "score": "...", "competitors": "..."}`
 *
 * Error Handling:
 *  - Propagates errors from the called sub-flows (`generateIdeaFlow`, `scoreIdeaFlow`)
 *    or the 'competitors' prompt execution, prefixing the error message with "miningFlow failed:".
 *
 * @param {object} params - The input object for the flow.
 * @param {string} params.context - The context/category for the idea.
 * @param {string} params.language - The language for AI responses.
 * @returns {Promise<string>} A promise that resolves to a JSON string containing the processed idea details.
 * @throws {Error} If any part of the idea processing pipeline fails.
 */
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
            const modelToUse = getModelToUse();

            const competitorsPrompt = ai.prompt('competitors');

            const competitorsResponse = await competitorsPrompt({idea: idea }, {model: modelToUse});
            const competitorsText = competitorsResponse.text;

            return JSON.stringify({idea: idea, score: score, competitors: competitorsText});

        } catch (error) {
            throw new Error(`miningFlow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);
