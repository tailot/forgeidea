# Socket.io Server for forgeIDEA

This directory contains the Socket.io server for the forgeIDEA application. This server handles real-time, bidirectional communication between the web frontend and the Genkit backend. Its primary role is to receive events from clients (e.g., new ideas submitted by users), process them by invoking the appropriate Genkit flows, and then broadcast results or updates to all connected clients.

## Development Setup

To set up the Socket.io server for development, follow these steps:

1.  **Prerequisites:**
    *   Ensure you have Node.js installed (check `package.json` for version compatibility, though a recent LTS version should work).
    *   Ensure you have npm (Node Package Manager) installed, which typically comes with Node.js.

2.  **Install Dependencies:**
    Navigate to the `socket.io` directory and install the necessary Node.js packages:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    The Socket.io server requires certain environment variables to be configured.
    *   Create a `.env` file in the `socket.io` directory if it doesn't exist (it's listed in `.gitignore`, so you'll likely need to create it manually).
    *   Add the following environment variables to your `.env` file:
        ```dotenv
        # The port the Socket.io server will run on
        PORT=3001

        # The base URL for the Genkit backend API
        GENKIT_BASE_URL=http://localhost:4001

        # Allowed origins for CORS (e.g., your web frontend URL)
        # Use '*' for development if you are unsure, but be more specific in production.
        ORIGIN=http://localhost:4200

        # Optional: Redis URL for scaling Socket.io across multiple instances in production
        # If not in production or not using Redis, this can be omitted or left blank.
        # REDIS_URL=redis://your_redis_host:6379
        ```
    *   Adjust the values as per your local development environment or production setup. The `GENKIT_BASE_URL` should point to where your Genkit service is running. `ORIGIN` should be the URL of your forgeIDEA web frontend.

4.  **Run the Development Server:**
    To start the Socket.io server with auto-reloading on file changes (using `ts-node`), run:
    ```bash
    npm run dev
    ```
    This will start the server, typically on the port specified in your `.env` file (defaulting to 3001).

## Running Tests

The `package.json` file includes a test script:
```bash
npm test
```
However, as of the current version, this script is a placeholder and will output: `"Error: no test specified" && exit 1`.

**Manual Testing:**
To test the server's functionality:
1.  Ensure the Genkit backend service is running and accessible at the `GENKIT_BASE_URL` configured in the `.env` file.
2.  Run the Socket.io server using `npm run dev`.
3.  Use a Socket.io client (e.g., a simple test script, a tool like Postman for WebSockets, or the forgeIDEA web frontend itself) to connect to the server and emit events.

**Recommendation:**
For robust testing, it is highly recommended to:
1.  Develop a suite of automated tests using a testing framework like Jest or Mocha, along with `socket.io-client` for simulating client interactions.
2.  Update the `npm test` script in `package.json` to execute these tests.

## Key Socket.io Events

The server listens for and emits the following key events:

### Incoming Events (Client to Server)

*   **`idea`**:
    *   **Payload:** `{ text: string }`
    *   **Description:** Sent by a client when a new idea is submitted. The server receives this, validates the idea's length, and then calls the `verifyIdeaFlow` on the Genkit backend.

### Outgoing Events (Server to Client(s))

*   **`newIdea`**:
    *   **Payload:** (The result from the Genkit `verifyIdeaFlow`)
    *   **Description:** Emitted by the server to all connected clients after an idea has been processed by the Genkit `verifyIdeaFlow`. The payload contains the outcome of this verification.

This event flow allows for real-time validation and broadcasting of new ideas within the forgeIDEA application.
