/**
 * @fileoverview Defines the 'getPromptFlow' Genkit flow.
 * This flow is responsible for dynamically retrieving a base prompt from the filesystem,
 * processing it using another AI-powered "meta-prompt" with a given "generator" context,
 * and then encrypting the resulting finalized prompt. This allows for dynamic and secure
 * management of prompts that might themselves be generated or tailored by an AI.
 */
import { ai } from '../config/genkit'
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

import { FlowCryptographer } from '../lib/cypher';
import { getModelToUse } from '../config/genkit';

/**
 * Defines a Genkit flow named 'getPrompt'.
 *
 * This complex flow orchestrates several steps to securely generate and provide a processed prompt:
 * 1.  Validates input: `generator` (string, 4-13 chars) and `promptname` (string, must start with '_').
 * 2.  Ensures `KEYCIPHER` environment variable is set for encryption.
 * 3.  Constructs a filename (e.g., `basename.prompt`) from `promptname` (by removing the leading '_').
 * 4.  Reads the content of this base prompt file from the `prompts` directory.
 * 5.  Prepares parameters (`generator` and the base `prompt` content) for a "meta-prompt".
 * 6.  Selects an AI model using `getModelToUse()` (relies on `CUSTOM_MODELS` env var).
 * 7.  Invokes a meta-prompt (e.g., `ai.prompt("meta_basename")`) with the prepared parameters
 *     and a specific model configuration (temperature: 0). This step essentially uses an AI
 *     to process or refine the base prompt based on the `generator` input.
 * 8.  Encrypts the text result from the meta-prompt execution using `FlowCryptographer`.
 * 9.  Returns the encrypted payload (`iv`, `encryptedData`, `authTag`).
 *
 * Input Schema:
 *  - `generator` (string): A string (4-13 characters) acting as a context or type for the meta-prompt processing.
 *  - `promptname` (string): The name of the prompt, must start with '_'. Used to derive the base prompt filename.
 *
 * Output Schema (Encrypted Payload):
 *  - `iv` (string): Initialization vector for decryption.
 *  - `encryptedData` (string): The encrypted prompt content.
 *  - `authTag` (string): Authentication tag for verifying data integrity.
 *
 * Error Handling:
 *  - Throws an error if `KEYCIPHER` is not set.
 *  - Throws an error if the base prompt file cannot be read.
 *  - Throws an error if the AI model for the meta-prompt is not configured.
 *  - Throws an error if the meta-prompt execution fails.
 *
 * @param {object} input - The input object for the flow.
 * @param {string} input.generator - The generator context string.
 * @param {string} input.promptname - The name of the prompt (must start with '_').
 * @returns {Promise<{iv: string, encryptedData: string, authTag: string}>} A promise that resolves to an
 *   object containing the encrypted prompt (`iv`, `encryptedData`, `authTag`).
 * @throws {Error} If any critical step fails (e.g., missing KEYCIPHER, file read error, model issue, meta-prompt execution error).
 */
export const getPromptFlow = ai.defineFlow(
  {
    name: 'getPrompt',
    inputSchema: z.object({
      generator: z.string().min(4, { message: "Generator must be at least 4 characters long" }).max(13, { message: "Generator must be at most 13 characters long" }),
      promptname: z.string().refine(name => name.startsWith('_'), {
        message: "promptname must start with '_'",
      }),
    }),
    outputSchema: z.object({
      iv: z.string(),
      encryptedData: z.string(),
      authTag: z.string(),
    })
  },
  async (input) => {
    const keyCipher = process.env.KEYCIPHER;
    if (!keyCipher) {
        console.error("getPrompt: KEYCIPHER environment variable is not set. Cannot encrypt prompt.");
        throw new Error("KEYCIPHER environment variable is not set.");
    }

    const basekey = keyCipher;
    const buffKey = Buffer.from(basekey, 'base64');
    const cryptographer = new FlowCryptographer(buffKey);

    const { generator, promptname } = input;

    const contentPromptFilenameBase = promptname.substring(1);
    const contentPromptFilename = `${contentPromptFilenameBase}.prompt`;

    const promptsDir = path.resolve(__dirname, '../../prompts');
    const filePathToRead = path.join(promptsDir, contentPromptFilename);

    let promptContent: string;
    try {
      promptContent = await fs.readFileSync(filePathToRead, 'utf-8');
    } catch (error) {
      console.error(`Error reading prompt file ${filePathToRead}:`, error);
      throw new Error(`Unable to read prompt file: ${filePathToRead}. Details: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
        const params = {
            generator: generator,
            prompt: promptContent,
        }
        const modelToUse = getModelToUse();

        if (!modelToUse) {
          console.error("getPrompt: AI model not configured. Please set \n CUSTOM_MODELS environment variable.");
          throw new Error("AI model not configured for prompt execution.");
        }

        const promptRunner = ai.prompt("meta"+promptname)

        const result = await promptRunner(
            params,
            {
              model: modelToUse,
              config: {
                temperature: 0
              }
            }
          );
          return cryptographer.encrypt(result.text);

    } catch (error) {
      console.error(`Error executing prompt ${promptname}:`, error);
      throw new Error(`Error executing prompt ${promptname}. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
