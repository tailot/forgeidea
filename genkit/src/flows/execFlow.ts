/**
 * @fileoverview Defines the 'execFlow' Genkit flow.
 * This flow is responsible for decrypting a prompt received in an encrypted format,
 * optionally substituting variables into the decrypted prompt,
 * executing the prompt using a configured AI model, and returning the model's response.
 * It requires the `KEYCIPHER` environment variable to be set for decryption.
 */
import { ai } from '../config/genkit';
import { z } from 'zod';
import { FlowCryptographer, EncryptedPayload } from '../lib/cypher';
import { generate } from '@genkit-ai/ai';
import { getModelToUse } from '../config/genkit';

/**
 * Zod schema for the encrypted payload.
 * This schema validates the structure of an encrypted message, requiring
 * an initialization vector (iv), the encrypted data itself, and an authentication tag.
 * It corresponds to the `EncryptedPayload` interface.
 */
const EncryptedPayloadSchema = z.object({
    iv: z.string(),
    encryptedData: z.string(),
    authTag: z.string()
});

/**
 * Zod schema for the input of the `execFlow`.
 * It requires an `encryptedPromptPayload` (conforming to `EncryptedPayloadSchema`)
 * and an optional `promptVariables` record for substituting values into the
 * decrypted prompt template.
 */
const ExecFlowInputSchema = z.object({
    encryptedPromptPayload: EncryptedPayloadSchema.describe("The encrypted prompt payload."),
    promptVariables: z.record(z.string(), z.any()).optional().describe("Optional key-value pairs for substituting variables in the decrypted prompt template. Variables should be in {{variableName}} format.")
});

/**
 * Defines a Genkit flow named 'execFlow'.
 *
 * This flow orchestrates the secure execution of an AI prompt. It performs the following steps:
 * 1. Retrieves an encryption key (`KEYCIPHER`) from environment variables.
 * 2. Initializes a `FlowCryptographer` to decrypt the incoming prompt payload.
 * 3. Decrypts the `encryptedPromptPayload` from the input.
 * 4. If `promptVariables` are provided in the input, it substitutes these variables into the decrypted prompt template.
 *    Variables in the template should be in the format `{{variableName}}`.
 * 5. Selects an AI model using `getModelToUse()`, which relies on the `CUSTOM_MODELS` environment variable.
 * 6. Executes the finalized prompt using the selected AI model.
 * 7. Returns the AI model's text response.
 *
 * Error Handling:
 * - Returns an empty string if `KEYCIPHER` is not set.
 * - Returns an empty string if `FlowCryptographer` fails to initialize (e.g., invalid key format).
 * - Returns an empty string if the encrypted payload is invalid or decryption fails (e.g., wrong key, tampered data).
 * - Returns an empty string if the decrypted prompt is empty.
 * - Throws an error if `CUSTOM_MODELS` is not set or no model can be selected.
 * - Throws an error if the AI model execution fails.
 *
 * @param {z.infer<typeof ExecFlowInputSchema>} input - The input object containing the encrypted prompt payload
 *   and optional variables for substitution.
 * @returns {Promise<string>} A promise that resolves to the AI model's response as a string.
 *   Returns an empty string if decryption or initial validation fails before model execution.
 * @throws {Error} If model selection or AI execution fails.
 */
export const execFlow = ai.defineFlow(
    {
        name: 'execFlow',
        inputSchema: ExecFlowInputSchema,
        outputSchema: z.string().describe("The AI model's response to the decrypted prompt, or an empty string if decryption fails."),
    },
    async (input: z.infer<typeof ExecFlowInputSchema>): Promise<string> => {
        const keyCipher = process.env.KEYCIPHER;
        if (!keyCipher) {
            console.error("execFlow: KEYCIPHER environment variable is not set.");
            return '';
        }

        const basekey = keyCipher;
        const buffKey = Buffer.from(basekey, 'base64');

        let cryptographer: FlowCryptographer;
        try {
            cryptographer = new FlowCryptographer(buffKey);
        } catch (keyError) {
            console.error(
                "execFlow: Failed to initialize cryptographer (invalid KEYCIPHER format or length):",
                keyError instanceof Error ? keyError.message : String(keyError)
            );
            return "";
        }

        let decryptedPromptTemplate: string;
        const encryptedPayload = input.encryptedPromptPayload;

        if (!encryptedPayload || typeof encryptedPayload.iv !== 'string' || typeof encryptedPayload.encryptedData !== 'string' || typeof encryptedPayload.authTag !== 'string') {
             console.error("execFlow: Invalid encrypted payload structure.");
             return "";
        }

        try {
            decryptedPromptTemplate = cryptographer.decrypt(encryptedPayload);
        } catch (decryptionError) {
            console.warn(
                'execFlow: Decryption failed (possibly invalid key, tampered data, or mismatched KEYCIPHER):',
                decryptionError instanceof Error ? decryptionError.message : String(decryptionError)
            );
            return "";
        }

        if (!decryptedPromptTemplate || decryptedPromptTemplate.trim() === '') {
            console.warn("execFlow: Decrypted prompt is empty or whitespace only. Cannot execute.");
            return "";
        }

        let finalPromptText = decryptedPromptTemplate;
        if (input.promptVariables) {
            finalPromptText = Object.entries(input.promptVariables).reduce(
                (prompt, [key, value]) => {
                    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                    return prompt.replace(placeholder, String(value));
                },
                decryptedPromptTemplate);
        }

        try {
            const modelName = getModelToUse();
            if (!modelName) {
                console.error("execFlow: CUSTOM_MODEL environment variable is not set.");
                throw new Error("CUSTOM_MODEL is not configured for prompt execution.");
            }

            const response = await generate(ai.registry, {
                model: modelName,
                prompt: finalPromptText
            });

            return response.text;

        } catch (executionError) {
            console.error(
                'execFlow: Error executing decrypted prompt:',
                executionError instanceof Error ? executionError.message : String(executionError)
            );
            throw new Error(`Failed to execute decrypted prompt: ${executionError instanceof Error ? executionError.message : String(executionError)}`);
        }
    }
);