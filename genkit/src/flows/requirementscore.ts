import { ai } from '../config/genkit';
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import * as fs from 'fs';
import * as path from 'path';

import { getModelToUse } from '../config/genkit';

export const requirementScoreFlow = ai.defineFlow(
    {
        name: 'requirementScoreFlow',
        inputSchema: z.object({
            category: z.string().describe("The category of the idea to be used as a variable in the prompts."),
            maxscore: z.number().default(10).describe("The maximum (or reference) score for the idea, to be used as a variable in the prompts."),
            language: z.string().default('english').describe("The language for variables or for the context of the prompts.")
        }),
        outputSchema: z.string().describe("The AI model's response to the final generated prompt.")
    },
    async (params) => {
        const promptFileMap = { evaluatedpromptidea: "idea.prompt", evaluatedideascore: "ideascore.prompt", result: "requirementscore.prompt" };

        const promptsDir = path.resolve(__dirname, '../../prompts');
        const finalProcessedPrompts: Record<string, string> = {};
        const tempProcessedContents: Record<string, string> = {};

        for (const promptKey in promptFileMap) {
            if (Object.prototype.hasOwnProperty.call(promptFileMap, promptKey)) {
                const currentPromptFileName = promptFileMap[promptKey as keyof typeof promptFileMap];
                const filePath = path.join(promptsDir, currentPromptFileName);

                try {
                    let fileContent = fs.readFileSync(filePath, 'utf-8');

                    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
                    const cleanedContent = fileContent.replace(frontmatterRegex, '');
                    let contentAfterParamsSubstitution = cleanedContent;

                    for (const paramKey in params) {
                        if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
                            const value = params[paramKey as keyof typeof params];
                            if (value !== undefined) {
                                const placeholder = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
                                contentAfterParamsSubstitution = contentAfterParamsSubstitution.replace(placeholder, String(value));
                            }
                        }
                    }
                    tempProcessedContents[promptKey] = contentAfterParamsSubstitution;
                } catch (error) {
                    console.error(`Error reading or processing prompt file '${filePath}':`, error);
                    throw new Error(`Unable to read or process prompt file '${currentPromptFileName}'. Details: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        for (const outerPromptKey in tempProcessedContents) {
            if (Object.prototype.hasOwnProperty.call(tempProcessedContents, outerPromptKey)) {
                let currentFinalContent = tempProcessedContents[outerPromptKey];

                for (const innerPromptKey in tempProcessedContents) {
                    if (Object.prototype.hasOwnProperty.call(tempProcessedContents, innerPromptKey)) {
                        const placeholderForInnerKey = new RegExp(`{{\\s*${innerPromptKey}\\s*}}`, 'g');
                        const contentToSubstituteWith = tempProcessedContents[innerPromptKey];
                        currentFinalContent = currentFinalContent.replace(placeholderForInnerKey, contentToSubstituteWith);
                    }
                }
                finalProcessedPrompts[outerPromptKey] = currentFinalContent;
            }
        }

        const promptToRun = finalProcessedPrompts.result;

        if (!promptToRun || promptToRun.trim() === '') {
            console.error("The final 'result' prompt is empty or undefined after processing.");
            throw new Error("The final 'result' prompt is empty or undefined.");
        }

        const modelToUse = getModelToUse();

        if (!modelToUse) {
          console.error("requirementScoreFlow: AI model not configured. Please set CUSTOM_MODELS environment variable.");
          throw new Error("AI model not configured for prompt execution.");
        }

        const response = await generate(ai.registry, {
            prompt: promptToRun,
            model: modelToUse,
        });

        if (!modelToUse) {
          throw new Error("AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
        }

        return response.text;
    }
);
