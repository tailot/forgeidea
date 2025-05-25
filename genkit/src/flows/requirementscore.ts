/**
 * @fileoverview Defines the 'requirementScoreFlow' Genkit flow.
 * This complex flow dynamically constructs a final prompt by orchestrating several steps:
 * 1. It uses a predefined map (`promptFileMap`) to identify multiple prompt template files.
 * 2. It reads each of these files from the `prompts` directory.
 * 3. It performs a first pass of variable substitution into these templates using the flow's input parameters
 *    (`category`, `maxscore`, `language`), after stripping any frontmatter from the templates.
 * 4. It then performs a second pass of substitution, where the processed content of one prompt template
 *    can be injected into placeholders within another. This allows for building composite prompts.
 * 5. The final, fully resolved prompt (identified by the 'result' key in `promptFileMap`) is then
 *    executed using a dynamically selected AI model.
 * The flow is designed to generate a score or evaluation for an idea based on certain requirements,
 * where the structure of the evaluation itself is dynamically assembled from multiple prompt components.
 */
import { ai } from '../config/genkit';
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import * as fs from 'fs';
import * as path from 'path';

import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'requirementScoreFlow'.
 *
 * This flow dynamically constructs and executes a complex prompt to score an idea against a set of requirements.
 * The process involves several stages of prompt template reading, variable substitution, and inter-prompt content injection.
 *
 * Input Schema:
 *  - `category` (string): The category of the idea, used as a variable in prompt templates.
 *  - `maxscore` (number, optional): The maximum or reference score for the idea (default: 10), used as a variable.
 *  - `language` (string, optional): The language for variables or context within prompts (default: 'english').
 *
 * Output Schema:
 *  - (string): The AI model's text response to the final, fully constructed prompt.
 *
 * Prompt Construction Process:
 * 1.  **Prompt File Mapping (`promptFileMap`):**
 *     A predefined object maps internal keys (e.g., `evaluatedpromptidea`, `evaluatedideascore`, `result`)
 *     to specific prompt template filenames (e.g., `idea.prompt`, `ideascore.prompt`, `requirementscore.prompt`)
 *     located in the `prompts` directory.
 *
 * 2.  **First Pass Substitution (Input Parameters):**
 *     - For each file in `promptFileMap`:
 *       - Reads the file content.
 *       - Removes any YAML frontmatter.
 *       - Substitutes placeholders (e.g., `{{category}}`, `{{maxscore}}`, `{{language}}`) with values
 *         from the flow's input parameters (`params`).
 *       - Stores these processed contents temporarily, keyed by their map key (e.g., `evaluatedpromptidea`).
 *
 * 3.  **Second Pass Substitution (Inter-Prompt Injection):**
 *     - Iterates through the temporarily processed prompt contents.
 *     - For each processed content, it again looks for placeholders. This time, the placeholders
 *       are expected to match the keys from `promptFileMap` (e.g., `{{evaluatedpromptidea}}`).
 *     - It replaces these placeholders with the *entire processed content* of the corresponding
 *       prompt from the first pass. For instance, if `requirementscore.prompt` (keyed as `result`)
 *       contains `{{evaluatedpromptidea}}`, this placeholder is replaced with the processed content of `idea.prompt`.
 *     - The results of this second pass are stored as the final, fully resolved prompts.
 *
 * 4.  **Final Prompt Selection & Execution:**
 *     - The prompt content associated with the key 'result' in `finalProcessedPrompts` is selected
 *       as the ultimate prompt to be executed.
 *     - An AI model is selected using `getModelToUse()`.
 *     - The final prompt is sent to the selected AI model for generation.
 *
 * Error Handling:
 *  - Throws an error if any prompt file cannot be read or processed.
 *  - Throws an error if the final 'result' prompt is empty or undefined after all substitutions.
 *  - Throws an error if the AI model is not configured (i.e., `CUSTOM_MODELS` env var is not set).
 *
 * @param {object} params - The input object for the flow.
 * @param {string} params.category - The category of the idea.
 * @param {number} [params.maxscore=10] - The maximum score for the idea.
 * @param {string} [params.language='english'] - The language for prompt context.
 * @returns {Promise<string>} A promise that resolves to the AI model's text response.
 * @throws {Error} If any part of the prompt construction, model selection, or AI execution fails.
 */
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
