import { createMcpServer } from '@genkit-ai/mcp';

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

createMcpServer({
  name: 'mcp-server',
  tools: [
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
});