import { startFlowServer } from '@genkit-ai/express';

import { generateIdeaCategoriesFlow } from './flows/generateIdeaCategories';
import { generateIdeaFlow } from './flows/generateIdea';
import { randomIdeaFlow } from './flows/randomIdea';
import { subjectFlow } from './flows/getsubject';
import { generateTasksFlow } from './flows/gettasks';
import { operationFlow } from './flows/operationFlow'
import { discardTasksFlow } from './flows/discardtasks';
import { zoomTaskFlow } from './flows/zoomtask'
import { scoreIdeaFlow } from './flows/scoreidea'
import { requirementScoreFlow } from './flows/requirementscore'
import { verifyIdeaFlow } from './flows/verifyIdeaFlow';

startFlowServer({
  flows: [
    generateIdeaCategoriesFlow,
    generateIdeaFlow,
    randomIdeaFlow,
    subjectFlow,
    generateTasksFlow,
    discardTasksFlow,
    operationFlow,
    zoomTaskFlow,
    scoreIdeaFlow,
    requirementScoreFlow,
    verifyIdeaFlow
  ],
  port: 4001,
  cors: {
    origin: process.env.ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
  }
});

//curl -X POST "http://127.0.0.1:3400/randomIdeaFlow" -H "Content-Type: application/json" -d '{ "data":{"language": "italiano"}}'