import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const server: http.Server = http.createServer(app);
const io: Server = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"]
  }
});
const GENKIT_BASE_URL = process.env.GENKIT_BASE_URL;

interface IdeaPayload {
  text: string;
}

app.get('/', (req: Request, res: Response) => {
  res.send('I\'m forgeIdea server');
});

io.on('connection', (socket: Socket) => {

  socket.on('idea', async (idea: IdeaPayload) => {

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
      io.emit('newsIdea', verificationResult);

    } catch (error) {
      console.error('error verifyIdeaFlow:', error instanceof Error ? error.message : String(error));
    }

  });

});

const PORT: string | number = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`listening: ${PORT}`);
});
