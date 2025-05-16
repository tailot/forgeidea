import { ai } from '../config/genkit'
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { FlowCryptographer } from '../lib/cypher';


export const getPromptFlow = ai.defineFlow(
  {
    name: 'getPrompt',
    inputSchema: z.object({
      generator: z.string(),
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
    const basekey = process.env.KEYCIPHER || crypto.randomBytes(32).toString('base64');
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
        const modelToUse = process.env.CUSTOM_MODEL;
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
