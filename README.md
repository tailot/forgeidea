# forgeIDEA

forgeIDEA is a web application that helps users generate and manage ideas.

## Project Structure

The project is divided into three main components:

- **Genkit:** The backend service responsible for AI-powered idea generation and processing.
- **Socket.io:** Handles real-time communication between the frontend and backend.
- **Web:** The frontend application built with Angular, providing the user interface for interacting with ForgeIDEA.

## Getting Started

To get started with ForgeIDEA, refer to the README files within each component's directory:

- [Genkit README](./genkit/README.md) (Note: This file doesn't exist yet)
- [Socket.io README](./socket.io/README.md) (Note: This file doesn't exist yet)
- [Web README](./web/README.md)

## Running the Project with Docker

To run the project using Docker, follow these steps:

1.  **Rename the Docker Compose template file:**
    Rename `docker-compose_TEMPLATE.yml` to `docker-compose.yml`.

2.  **Configure environment variables:**
    Open `docker-compose.yml` and replace the placeholder values for environment variables. This includes API keys (e.g., `GEMINI_API_KEY`, `GROQ_API_KEY`), and any other configuration specific to your setup.

    ```yaml
    services:
      genkit:
        environment:
          GEMINI_API_KEY: YOUR_GEMINI_API_KEY # Replace with your actual key
          GROQ_API_KEY: YOUR_GROQ_API_KEY     # Replace with your actual key
          KEYCIPHER: YOUR_SECRET_KEY        # Replace with your secret key
          # ... other environment variables
    # ... rest of the file
    ```

3.  **Build and run the services:**
    Open your terminal, navigate to the project's root directory (where `docker-compose.yml` is located), and run the following command:

    ```bash
    docker-compose up -d
    ```
    This command will build the Docker images for each service (if they haven't been built yet) and start the containers in detached mode (`-d`).

4.  **Access the application:**
    Once the containers are running, you should be able to access the forgeIDEA web application by navigating to `http://localhost` or `http://localhost:80` in your web browser. The Genkit API will be available at `http://localhost:4001` and the Socket.io server at `http://localhost:3001`.

## Contributing

We welcome contributions to forgeIDEA! Here's how you can help:

### Setting Up the Development Environment

To contribute to forgeIDEA, you'll need to set up the development environment for the specific component(s) you wish to work on (Genkit, Socket.io, or Web).

1.  **Prerequisites:**
    *   Ensure you have Git installed.
    *   Ensure you have Node.js and npm installed (for Genkit, Socket.io, and Web).
    *   Ensure you have Docker and Docker Compose installed if you plan to use them for development or testing.

2.  **Fork and Clone the Repository:**
    *   Fork the main forgeIDEA repository to your GitHub account.
    *   Clone your forked repository to your local machine:
        ```bash
        git clone https://github.com/YOUR_USERNAME/forgeidea.git
        cd forgeidea
        ```

3.  **Component-Specific Setup:**
    Detailed instructions for setting up the development environment for each component can be found in their respective README files:
    *   **Genkit:** See [genkit/README.md](./genkit/README.md) (Note: This file needs to be created/updated with setup instructions).
    *   **Socket.io:** See [socket.io/README.md](./socket.io/README.md) (Note: This file needs to be created/updated with setup instructions).
    *   **Web (Angular):** See [web/README.md](./web/README.md) for instructions on setting up the Angular development environment. Typically, this involves navigating to the `web` directory and running `npm install`.

### Running Tests

It's important to run tests to ensure your changes don't break existing functionality.

*   **Genkit:** Instructions for running tests can be found in [genkit/README.md](./genkit/README.md) (Note: This file needs to be created/updated with test instructions).
*   **Socket.io:** Instructions for running tests can be found in [socket.io/README.md](./socket.io/README.md) (Note: This file needs to be created/updated with test instructions).
*   **Web (Angular):** Navigate to the `web` directory and run `npm test` to execute unit tests using Karma and Jasmine. For end-to-end tests, refer to the instructions in [web/README.md](./web/README.md).

### Submitting Pull Requests

Once you've made your changes and ensured all tests pass, you can submit a pull request:

1.  **Create a New Branch:**
    Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b my-feature-branch
    ```

2.  **Commit Your Changes:**
    Make your changes and commit them with clear and concise messages:
    ```bash
    git add .
    git commit -m "feat: Add new feature X"
    # or "fix: Resolve bug Y"
    # or "docs: Update Z documentation"
    ```
    We try to follow Conventional Commits specification.

3.  **Push to Your Fork:**
    Push your changes to your forked repository:
    ```bash
    git push origin my-feature-branch
    ```

4.  **Open a Pull Request:**
    Go to the original forgeIDEA repository on GitHub and open a new pull request from your forked branch to the main development branch of the original repository.

5.  **Code Review:**
    Your pull request will be reviewed by the maintainers. Be prepared to address any feedback or make further changes.

Thank you for contributing to forgeIDEA!
