import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import axios from 'axios';
import dotenv from 'dotenv';
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

dotenv.config();

const app: Express = express();
const server: http.Server = http.createServer(app);
const io: Server = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"]
  }
});
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
const GENKIT_BASE_URL = process.env.GENKIT_BASE_URL;

interface IdeaPayload {
  text: string;
}

app.get('/', (req: Request, res: Response) => {
  res.send('I am the forgeIdea server');
});

io.on('connection', (socket: Socket) => {

  const MAX_IDEA_LENGTH = 1000;

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

const PORT: string | number = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`listening on: ${PORT}`);
});
