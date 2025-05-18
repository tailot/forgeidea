import { ai } from '../config/genkit';
import { z } from 'zod';
import { FlowCryptographer, EncryptedPayload } from '../lib/cypher';
import { generate } from '@genkit-ai/ai';
import { getModelToUse } from '../config/genkit';

// Zod schema for the encrypted payload part, matching the EncryptedPayload interface
const EncryptedPayloadSchema = z.object({
    iv: z.string(),
    encryptedData: z.string(),
    authTag: z.string()
});

// Zod schema for the complete input of execFlow
const ExecFlowInputSchema = z.object({
    encryptedPromptPayload: EncryptedPayloadSchema.describe("The encrypted prompt payload."),
    promptVariables: z.record(z.string(), z.any()).optional().describe("Optional key-value pairs for substituting variables in the decrypted prompt template. Variables should be in {{variableName}} format.")
});

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