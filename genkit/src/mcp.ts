import * as dotenv from 'dotenv';
import { createMcpServer } from '@genkit-ai/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { generateIdeaCategoriesFlow, inputSchemaGenerateIdeaCategoriesFlow, outputSchemaGenerateIdeaCategoriesFlow } from './flows/generateIdeaCategories';
import { generateIdeaFlow, inputSchemaGenerateIdeaFlow, outputSchemaGenerateIdeaFlow } from './flows/generateIdea';
import { randomIdeaFlow, inputSchemaRandomIdeaFlow, outputSchemaRandomIdeaFlow } from './flows/randomIdea';
import { ai } from './config/genkit';

// Load environment variables from .env file
dotenv.config({
  // It's good practice to specify the path to your .env file
  // to ensure it's found regardless of where the script is run from.
  path: __dirname + '/../.env',
  quiet: true
});

ai.defineTool(
  {
    name: 'generateIdeaCategories',
    description: 'Generates a list of idea categories based on an optional context, count, and language.',
    inputSchema: inputSchemaGenerateIdeaCategoriesFlow,
    outputSchema: outputSchemaGenerateIdeaCategoriesFlow,
  },
  async (input) => {
    return await generateIdeaCategoriesFlow(input);
  }
);

ai.defineTool(
  {
    name: 'generateRandomIdea',
    description: 'Generates a random idea based on a random category.',
    inputSchema: inputSchemaRandomIdeaFlow,
    outputSchema: outputSchemaRandomIdeaFlow,
  },
  async (input) => {
    return await randomIdeaFlow(input);
  },
);

ai.defineTool(
  {
    name: 'generateIdeaFromCategory',
    description: "Generates an idea based on a specific category and language.",
    inputSchema: inputSchemaGenerateIdeaFlow,
    outputSchema: outputSchemaGenerateIdeaFlow,
  },
  async (input) => {
    return await generateIdeaFlow(input);
  },
);


// Use createMcpServer
const server = createMcpServer(ai, {
  name: 'forgeIdea',
  version: '0.0.1',
});
// Setup (async) then starts with stdio transport by default
server.setup().then(async () => {
  await server.start();
  const transport = new StdioServerTransport();
  await server!.server?.connect(transport);
});