/**
 * @fileoverview This file serves as the main entry point for the Genkit application.
 *
 * It performs several key functions:
 * 1. Imports the `startFlowServer` function from `@genkit-ai/express` to enable
 *    the creation of an HTTP server for Genkit flows.
 * 2. Imports a comprehensive suite of custom Genkit flows defined in the `./flows` directory.
 *    These flows cover functionalities such as idea generation, task management,
 *    prompt handling, idea scoring, and various utility operations.
 * 3. Imports utility functions, specifically `applyGenkitProductionLogFilter` from
 *    `./utils/logFilter`, which is used to manage log output in production.
 * 4. Initializes the production log filter by calling `applyGenkitProductionLogFilter()`
 *    to ensure cleaner logs in a production environment.
 * 5. Configures and starts the Genkit Flow Server using `startFlowServer()`. This makes all
 *    the imported flows accessible via HTTP endpoints. The server is configured to run
 *    on port 4001 (or as specified by environment/defaults if changed) and utilizes
 *    CORS settings defined by the `process.env.ORIGIN` environment variable.
 *
 * This setup allows the Genkit flows to be invoked remotely, forming the backend
 * for applications leveraging these AI capabilities.
 */
// Genkit
import { startFlowServer } from '@genkit-ai/express';

// Flows
import { generateIdeaCategoriesFlow } from './flows/generateIdeaCategories';
import { generateIdeaFlow } from './flows/generateIdea';
import { randomIdeaFlow } from './flows/randomIdea';
import { subjectFlow } from './flows/getsubject';
import { generateTasksFlow } from './flows/gettasks';
import { operationFlow } from './flows/operationFlow'
import { discardTasksFlow } from './flows/discardtasks';
import { scoreIdeaFlow } from './flows/scoreidea'
import { requirementScoreFlow } from './flows/requirementscore'
import { verifyIdeaFlow } from './flows/verifyIdeaFlow';
import { helpTaskFlow } from './flows/help';
import { getPromptFlow } from './flows/getPrompt';
import { execFlow } from './flows/execFlow';

//Utils
import { applyGenkitProductionLogFilter } from './utils/logFilter';

/**
 * Applies a log filter to suppress specific Genkit validation errors in production,
 * reducing log noise. This should be called early in the application lifecycle.
 */
applyGenkitProductionLogFilter();

/**
 * Configures and starts the Genkit Flow Server.
 * This makes the imported Genkit flows available as HTTP endpoints.
 * Key configurations include the list of flows to serve, the server port,
 * and CORS settings (origin controlled by the `ORIGIN` environment variable).
 */
startFlowServer({
  flows: [
    generateIdeaCategoriesFlow,
    generateIdeaFlow,
    randomIdeaFlow,
    subjectFlow,
    generateTasksFlow,
    discardTasksFlow,
    operationFlow,
    scoreIdeaFlow,
    requirementScoreFlow,
    verifyIdeaFlow,
    helpTaskFlow,
    getPromptFlow,
    execFlow
  ],
  port: 4001,
  cors: {
    origin: process.env.ORIGIN
  }
});

//curl -X POST "http://127.0.0.1:4001/randomIdeaFlow" -H "Content-Type: application/json" -d '{ "data":{"language": "italiano"}}'