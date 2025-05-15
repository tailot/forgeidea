import { ai } from '../config/genkit'
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export const getPromptFlow = ai.defineFlow(
  {
    name: 'getPrompt',
    inputSchema: z.object({
      generator: z.string(),
      promptname: z.string().refine(name => name.startsWith('_'), {
        message: "promptname must start with '_'",
      }),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
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
                temperature: 0,
                topP: 0.95,
              }
            }
          );
          return result.text;

    } catch (error) {
      console.error(`Error executing prompt ${promptname}:`, error);
      throw new Error(`Error executing prompt ${promptname}. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
