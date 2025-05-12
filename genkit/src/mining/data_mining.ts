import { startFlowServer } from '@genkit-ai/express';
import { miningFlow } from '../mining/ideaProcessingFlow';

startFlowServer({
  flows: [
    miningFlow
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