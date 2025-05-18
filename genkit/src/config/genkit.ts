import * as dotenv from 'dotenv';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama';
import { groq } from 'genkitx-groq';

dotenv.config();

export const ai = genkit({
  plugins: getArrayConf(),
  promptDir: './prompts',
});

function getArrayConf(){
  let arrayConf = []
  if (process.env.GEMINI_API_KEY){
    arrayConf.push(googleAI({ apiKey: process.env.GEMINI_API_KEY })); // Ensure API key is string
    console.log("Configuration googleAI is pushed");
  }
  if (process.env.CUSTOM_MODELS && process.env.MODELOLLAMA){
    arrayConf.push(ollama({models: [{ name: process.env.MODELOLLAMA as string }],serverAddress: 'http://127.0.0.1:11434'}));
    console.log("Configuration ollama is pushed")
  }
  if (process.env.GROQ_API_KEY) {
    arrayConf.push(groq({ apiKey: process.env.GROQ_API_KEY }));
    console.log("Configuration Groq is pushed");
  }
  return arrayConf;
}

/**
 * Selects an AI model based on environment variables.
 * If CUSTOM_MODELS is defined and non-empty (comma-separated list),
 * a model is selected randomly from this list.
 * If CUSTOM_MODELS is not defined or is empty, no model is selected.
 * @returns The name of the model to use, or undefined if CUSTOM_MODELS is not set or is invalid.
 */
export function getModelToUse(): string | undefined {
  const customModelsList = process.env.CUSTOM_MODELS;

  if (customModelsList) {
    const models = customModelsList.split(',').map(m => m.trim()).filter(m => m.length > 0);
    if (models.length > 0) {
      const randomIndex = Math.floor(Math.random() * models.length);
      const selectedModel = models[randomIndex];
      return selectedModel;
    } else {
      console.warn("CUSTOM_MODELS environment variable is set but contains no valid model names. No model will be selected.");
      return undefined;
    }
  }
  console.warn("CUSTOM_MODELS environment variable is not set. No model will be selected.");
  return undefined;
 }