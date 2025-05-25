/**
 * @fileoverview This file sets up and starts a Socket.IO server integrated with an Express
 * HTTP server. It handles real-time communication for idea processing, including
 * receiving ideas via Socket.IO, calling a Genkit flow for verification, and
 * emitting results back to clients.
 *
 * Key functionalities include:
 * - Initialization of Express app and HTTP server.
 * - Configuration of a Socket.IO server with CORS policies based on environment variables.
 * - Conditional setup of a Redis adapter for Socket.IO to enable horizontal scaling
 *   in production environments (dependent on `NODE_ENV` and `REDIS_URL`).
 * - A simple HTTP GET route at `/` for basic server identification.
 * - A Socket.IO connection handler that, for each connected client:
 *   - Listens for an 'idea' event.
 *   - Validates the length of the received idea text.
 *   - Makes an asynchronous HTTP POST request to a Genkit 'verifyIdeaFlow'
 *     (URL configured via `GENKIT_BASE_URL` environment variable).
 *   - Emits the verification result back to all connected clients via a 'newIdea' event.
 * - Error handling for Redis connections and Genkit flow calls.
 * - Server listening on a port defined by the `PORT` environment variable or defaulting to 3001.
 */
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import axios from 'axios';
import dotenv from 'dotenv';
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

dotenv.config();

/** The Express application instance. */
const app: Express = express();
/** The HTTP server instance, created from the Express app. */
const server: http.Server = http.createServer(app);
/**
 * The Socket.IO server instance, configured with CORS policies.
 * CORS origin is determined by the `ORIGIN` environment variable.
 * Allowed HTTP methods for CORS are GET and POST.
 */
const io: Server = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"]
  }
});

/**
 * IIFE (Immediately Invoked Function Expression) to conditionally configure the Socket.IO Redis adapter.
 * This allows the Socket.IO server to scale across multiple instances in a production environment
 * by using Redis for message passing and state synchronization.
 *
 * The adapter is configured if:
 * - `process.env.NODE_ENV` is 'production'.
 * - `process.env.REDIS_URL` is defined.
 *
 * It includes error handling for Redis client connections and logs information
 * about the adapter's configuration status.
 */
// --- Redis Adapter ---
(async () => {
  // Check if REDIS_URL is defined and if the environment is production
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    console.log(`Attempting to connect to Redis: ${process.env.REDIS_URL}`);
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    // Redis connection error handling
    pubClient.on('error', (err) => console.error('Redis PubClient Error:', err));
    subClient.on('error', (err) => console.error('Redis SubClient Error:', err));

    try {
      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis Adapter configured successfully.');
    } catch (err) {
      console.error('Could not connect to Redis or configure the adapter:', err);
    }
  } else if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.warn('Production environment detected but REDIS_URL is not defined. Socket.IO will not scale across multiple instances.');
  } else {
    console.log('NODE_ENV is not "production" or REDIS_URL is not defined. Redis adapter will not be configured. Suitable for local development.');
  }
})();
// --- END Adapter ---

/** Base URL for the Genkit flows, retrieved from environment variables. Used to construct full endpoint URLs for Genkit API calls. */
const GENKIT_BASE_URL = process.env.GENKIT_BASE_URL;

/**
 * Interface for the payload expected when a client emits an 'idea' event.
 */
interface IdeaPayload {
  /** The text content of the idea. */
  text: string;
}

/**
 * Handles GET requests to the root path (`/`).
 * Responds with a simple string identifying the server.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/', (req: Request, res: Response) => {
  res.send('I am the forgeIdea server');
});

/**
 * Handles new Socket.IO client connections.
 * For each connected socket, it sets up event listeners, primarily for the 'idea' event.
 * @param {Socket} socket - The Socket.IO socket instance for the connected client.
 */
io.on('connection', (socket: Socket) => {

  /** Maximum allowed length for the text of an idea. Ideas exceeding this length are ignored. */
  const MAX_IDEA_LENGTH = 1000;

  /**
   * Handles 'idea' events received from a connected client.
   * When an idea is received:
   * 1. It validates the length of the idea's text against `MAX_IDEA_LENGTH`.
   * 2. If valid, it constructs a request to the Genkit 'verifyIdeaFlow'.
   * 3. It sends the idea to the Genkit flow via an HTTP POST request using `axios`.
   * 4. Upon receiving a response from Genkit, it emits a 'newIdea' event to all
   *    connected Socket.IO clients, broadcasting the verification result.
   * 5. Logs any errors encountered during the process.
   *
   * @param {IdeaPayload} idea - The payload containing the idea text.
   * @async
   */
  socket.on('idea', async (idea: IdeaPayload) => {

    if (idea.text.length > MAX_IDEA_LENGTH) {
      return;
    }

    try {
      const verifyFlowUrl = process.env.GENKIT_BASE_URL + '/verifyIdeaFlow';

      const requestBody = {
        data: {
          idea: idea.text,
        },
      };
      const response = await axios.post(verifyFlowUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      const verificationResult = response.data;

      io.emit('newIdea', verificationResult);
      

    } catch (error) {
      console.error('verifyIdeaFlow error:', error instanceof Error ? error.message : String(error));
    }

  });

});

/** The port on which the server will listen. Derived from the `PORT` environment variable, defaulting to 3001. */
const PORT: string | number = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`listening on: ${PORT}`);
});
