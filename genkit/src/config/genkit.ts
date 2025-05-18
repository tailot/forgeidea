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
    arrayConf.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
    console.log("Configuration googleAI is pushed")  
  }
  if (process.env.CUSTOM_MODEL && process.env.MODELOLLAMA){
    arrayConf.push(ollama({models: [{ name: process.env.MODELOLLAMA as string }],serverAddress: 'http://127.0.0.1:11434'}));
    console.log("Configuration "+process.env.CUSTOM_MODEL+" is pushed")
  }
  if (process.env.GROQ_API_KEY) {
    arrayConf.push(groq({ apiKey: process.env.GROQ_API_KEY }));
    console.log("Configuration Groq is pushed");
  }
  return arrayConf;
}