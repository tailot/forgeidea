/**
 * @fileoverview This file serves as the entry point for starting a Genkit Flow Server
 * dedicated to data mining operations.
 *
 * It configures and launches an Express server that exposes Genkit flows,
 * specifically the `miningFlow` (imported from `../mining/ideaProcessingFlow`).
 * The server is configured to listen on port 4001 and includes CORS (Cross-Origin Resource Sharing)
 * settings derived from environment variables, allowing requests from specified origins
 * and with specified methods and headers.
 */
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