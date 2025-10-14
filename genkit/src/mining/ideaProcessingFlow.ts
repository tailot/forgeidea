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
import { generateIdeaFlow } from '../flows/generateIdea';
import { scoreIdeaFlow } from '../flows/scoreidea';

// Define the schema for an individual competitor
const CompetitorSchema = z.object({
  name: z.string().describe("Name of the competitor"),
  website: z.string().describe("Website of the competitor"),
});

// Define and export the input schema for the miningFlow
export const inputSchemaMiningFlow = z.object({
    context: z.string().describe("Context"),
    language: z.string().describe("The language in which the model should respond.")
});

// Define and export the output schema for the miningFlow
export const outputSchemaMiningFlow = z.object({
  idea: z.string(),
  score: z.string(),
  competitors: z.array(CompetitorSchema).describe("List of potential competitors"),
});

/**
 * Defines a Genkit flow named 'miningFlow'.
 * ... (commenti JSDoc invariati)
 */
export const miningFlow = ai.defineFlow(
    {
        name: 'miningFlow',
        inputSchema: inputSchemaMiningFlow, // Usa lo schema esportato
        outputSchema: outputSchemaMiningFlow, // Usa lo schema esportato
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
            
            let parsedCompetitors: z.infer<typeof CompetitorSchema>[] = [];
            if (competitorsText && competitorsText.trim() !== "") {
                let jsonStringToParse = competitorsText.trim();
                const fenceRegex = /^```(?:javascript|json)?\s*([\s\S]*?)\s*```$/;
                const match = fenceRegex.exec(jsonStringToParse);

                if (match && match[1]) {
                    jsonStringToParse = match[1].trim();
                }

                if (jsonStringToParse !== "") {
                    try {
                        parsedCompetitors = JSON.parse(jsonStringToParse);
                    } catch (parseError) {
                        console.error(`miningFlow: Failed to parse competitors JSON. Text after cleaning: "${jsonStringToParse}". Original text from AI: "${competitorsText}". Error: ${parseError}`);
                        throw new Error(`miningFlow failed: Could not parse competitors data. AI model output was not valid JSON even after attempting to clean it. Received (original): ${competitorsText}`);
                    }
                }
            }

            return {idea: idea, score: score, competitors: parsedCompetitors};
        } catch (error) {
            throw new Error(`miningFlow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);