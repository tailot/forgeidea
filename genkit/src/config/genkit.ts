import * as dotenv from 'dotenv';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama';

dotenv.config();

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    ollama({
      models: [
        { name: 'gemma3:4b' }
      ],
      serverAddress: 'http://127.0.0.1:11434',
    }),
  ],
  promptDir: './prompts',
});