import { startFlowServer } from '@genkit-ai/express';

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
    helpTaskFlow
  ],
  port: 4001,
  cors: {
    origin: process.env.ORIGIN
  }
});

//curl -X POST "http://127.0.0.1:4001/randomIdeaFlow" -H "Content-Type: application/json" -d '{ "data":{"language": "italiano"}}'