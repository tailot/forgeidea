/**
 * @fileoverview Defines the 'miningFlow' Genkit flow.
 * This flow orchestrates a multi-step process for idea mining and analysis.
 * It takes a context and language as input, then:
 * 1. Generates an idea within that context using `generateIdeaFlow`.
 * 2. Scores the generated idea using `scoreIdeaFlow`.
 * 3. Identifies potential competitors for the idea using an AI model and a 'competitors' prompt.
 * Finally, it returns an object containing the generated idea, its score, and the list of competitors.
 */
import { ai, getModelToUse } from '../config/genkit';
import { z } from 'zod';

// Define the schema for an individual competitor
const CompetitorSchema = z.object({
  name: z.string().describe("Name of the competitor"),
  website: z.string().describe("Website of the competitor"),
});

// Define the output schema for the miningFlow
const MiningFlowOutputSchema = z.object({
  idea: z.string(),
  score: z.string(),
  // Update competitors to be an array of CompetitorSchema
  competitors: z.array(CompetitorSchema).describe("List of potential competitors"),
});

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
 * 4. Returns an object containing the `idea`, its `score`, and the parsed `competitors` array.
 *
 * Input Schema:
 *  - `context` (string): The context or category for idea generation.
 *  - `language` (string): The language for AI model responses.
 *
 * Output Schema:
 *  - An object adhering to MiningFlowOutputSchema:
 *    `{idea: "...", score: "...", competitors: [{ name: "...", website: "..." }, ...]}`
 *
 * Error Handling:
 *  - Propagates errors from the called sub-flows (`generateIdeaFlow`, `scoreIdeaFlow`)
 *    or the 'competitors' prompt execution, prefixing the error message with "miningFlow failed:".
 *
 * @param {object} params - The input object for the flow.
 * @param {string} params.context - The context/category for the idea.
 * @param {string} params.language - The language for AI responses.
 * @returns {Promise<z.infer<typeof MiningFlowOutputSchema>>} A promise that resolves to an object
 *          containing the processed idea details, conforming to MiningFlowOutputSchema.
 * @throws {Error} If any part of the idea processing pipeline fails.
 */
export const miningFlow = ai.defineFlow(
    {
        name: 'miningFlow',
        inputSchema: z.object({
            context: z.string().describe("Context"),
            language: z.string().describe("The language in which the model should respond.")
        }),
        outputSchema: MiningFlowOutputSchema
    },
    async (params) => {
        try {
            const paramInput = {
                category: params.context,
                language: params.language
            };
            const idea = await generateIdeaFlow(paramInput);
            const score = await scoreIdeaFlow({idea: idea}); // Assuming scoreIdeaFlow takes {idea: string}
            const modelToUse = getModelToUse();

            const competitorsPrompt = ai.prompt('competitors');

            const competitorsResponse = await competitorsPrompt({idea: idea }, {model: modelToUse});
            const competitorsText = competitorsResponse.text; // Use text() method
            
            let parsedCompetitors: z.infer<typeof CompetitorSchema>[] = [];
            // Ensure competitorsText is not null, undefined, or an empty string before processing
            if (competitorsText && competitorsText.trim() !== "") {
                let jsonStringToParse = competitorsText.trim();

                // Regex to remove markdown code fences (e.g., ```json ... ``` or ``` ... ```)
                // It captures the content within the fences.
                const fenceRegex = /^```(?:javascript|json)?\s*([\s\S]*?)\s*```$/;
                const match = fenceRegex.exec(jsonStringToParse);

                if (match && match[1]) {
                    jsonStringToParse = match[1].trim(); // Use the captured group and trim it
                }
                // If no fences were found, jsonStringToParse remains the trimmed original string.

                // It's possible the string is empty after stripping fences if AI only returned fences and whitespace
                if (jsonStringToParse === "") {
                    parsedCompetitors = [];
                } else {
                    try {
                        parsedCompetitors = JSON.parse(jsonStringToParse);
                    } catch (parseError) {
                        console.error(`miningFlow: Failed to parse competitors JSON. Text after cleaning: "${jsonStringToParse}". Original text from AI: "${competitorsText}". Error: ${parseError}`);
                        // Throw an error if parsing fails, as the output schema expects a valid array structure.
                        throw new Error(`miningFlow failed: Could not parse competitors data. AI model output was not valid JSON even after attempting to clean it. Received (original): ${competitorsText}`);
                    }
                }
            } else {
                // competitorsText was null, undefined, or an empty/whitespace string initially
                parsedCompetitors = [];
            }

            return {idea: idea, score: score, competitors: parsedCompetitors};
        } catch (error) {
            throw new Error(`miningFlow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);
