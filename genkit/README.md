# Genkit Backend Service for forgeIDEA

This directory contains the Genkit backend service for the forgeIDEA application. This service is responsible for all AI-powered functionalities, including idea generation, processing, categorization, scoring, and managing various automated flows. It leverages Genkit and integrates with multiple AI models (like Google AI, Groq, Ollama) to perform these tasks.

## Development Setup

To set up the Genkit service for development, follow these steps:

1.  **Prerequisites:**
    *   Ensure you have Node.js installed (check `package.json` for version compatibility, though a recent LTS version should work).
    *   Ensure you have npm (Node Package Manager) installed, which typically comes with Node.js.

2.  **Install Dependencies:**
    Navigate to the `genkit` directory and install the necessary Node.js packages:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    The Genkit service requires API keys and other configuration to be set as environment variables.
    *   Copy the template file `.env_TEMPLATE` to a new file named `.env`:
        ```bash
        cp .env_TEMPLATE .env
        ```
    *   Open the `.env` file and replace the placeholder values with your actual API keys (e.g., `GEMINI_API_KEY`, `GROQ_API_KEY`) and any other required configuration, such as `KEYCIPHER` and `CUSTOM_MODELS`.

4.  **Run the Development Server:**
    To start the Genkit service with auto-reloading on file changes, run:
    ```bash
    npm run dev
    ```
    This will typically start the Genkit developer UI, where you can inspect flows, run them, and see traces. The service usually runs on port 4001 (as configured in `docker-compose.yml`).

## Running Tests

Currently, this project does not have a dedicated automated test suite or an `npm test` script.

**Manual Testing:**
Flows can be tested manually using the Genkit Developer UI, which becomes available when you run `npm run dev`. This interface allows you to:
*   See a list of all registered flows.
*   Run individual flows with specific input data.
*   Inspect the execution traces and outputs of the flows.

**Recommendation:**
For more robust and automated testing, it is highly recommended to:
1.  Develop unit tests for individual helper functions and utility modules.
2.  Create integration tests for the Genkit flows.
3.  Add an `npm test` script to `package.json` that executes these tests using a testing framework like Jest or Mocha.

## Key Flows and Prompts

This service defines several flows and utilizes various prompts to orchestrate AI tasks.

### Core Flows (`src/flows/`):

*   `generateIdea.ts`: Handles the generation of new ideas based on user input or categories.
*   `generateIdeaCategories.ts`: Generates relevant categories for ideas.
*   `scoreidea.ts`: Evaluates and scores ideas based on predefined criteria.
*   `requirementscore.ts`: Scores ideas against specific requirements.
*   `verifyIdeaFlow.ts`: Implements a flow to verify or validate ideas.
*   `operationFlow.ts`: A more generic flow that can likely handle various operations or tasks.
*   `gettasks.ts`: Potentially retrieves or generates tasks related to ideas.
*   `discardtasks.ts`: Manages the discarding or archiving of tasks.
*   `zoomtask.ts`: May provide a more detailed view or breakdown of a specific task.
*   `getsubject.ts`: Could be used to extract or define the subject of an idea or task.
*   (Other flows like `execFlow.ts`, `getPrompt.ts`, `help.ts`, `randomIdea.ts` also exist, providing various utilities and functionalities.)

### Core Prompts (`prompts/`):

The `prompts/` directory contains various `.prompt` files that are used by the flows. These files define the instructions and context given to the AI models. Some examples include:

*   `idea.prompt`: Used for generating the core idea.
*   `categories.prompt`: Used for generating categories.
*   `competitors.prompt`: Potentially used for analyzing competitors related to an idea.
*   `ideascore.prompt`: Used in the idea scoring process.
*   `requirementscore.prompt`: Used for scoring against requirements.
*   `verify.prompt`: Used in the idea verification flow.
*   (And many others like `devel.prompt`, `discardtasks.prompt`, `getformat.prompt`, `help.prompt`, `meta_categories.prompt`, `meta_idea.prompt`, `operationidea.prompt`, `subjects.prompt`, `zoomtask.prompt`.)

These flows and prompts work together to provide the AI-driven features of forgeIDEA. Refer to the specific source files for more details on their implementation.

### Using the `miningFlow` for Idea Generation and Competitor Analysis

The `miningFlow` (defined in `src/mining/ideaProcessingFlow.ts`) orchestrates a sequence of tasks: it first generates a new idea based on a given context, then scores this idea, and finally identifies potential competitors for the generated idea using the `competitors.prompt`.

This flow can be invoked using the `call_mining_flow.sh` script located in the `src/mining/` directory.

**Prerequisites for the script:**
Before running the script, ensure you have `curl` and `jq` installed on your system. These are used by the script to make requests to the `miningFlow` endpoint and process JSON responses.

**How to run `call_mining_flow.sh`:**

The script can be run in two modes:

1.  **Batch Mode:** To generate a specific number of ideas and their competitor analyses for a given context.
    *   **Usage:** `./src/mining/call_mining_flow.sh "<context>" "<language>" <count>`
    *   **`<context>`:** A string describing the domain or area for idea generation (e.g., "wearable technology for pets").
    *   **`<language>`:** The language for the AI's responses (e.g., "english", "italian").
    *   **`<count>`:** The number of times to run the flow.
    *   **Example:**
        ```bash
        ./src/mining/call_mining_flow.sh "sustainable urban farming solutions" "english" 3
        ```

2.  **Interactive Mode:** To provide contexts one by one through the command line.
    *   **Usage:** `./src/mining/call_mining_flow.sh "<language>"`
    *   **`<language>`:** The language for the AI's responses.
    *   The script will then prompt you to "Enter context (or type 'exit' or 'quit' to finish):".
    *   **Example:**
        ```bash
        ./src/mining/call_mining_flow.sh "english"
        ```
        Then, when prompted:
        ```
        Enter context (or type 'exit' or 'quit' to finish): innovative educational toys
        ```

**Script Output:**

In both modes, for each successful run, the script will print a JSON object to the standard output. This JSON object contains:
*   `idea`: The generated idea (string).
*   `score`: The score assigned to the idea (string).
*   `competitors`: An array of objects, where each object represents a potential competitor and contains:
    *   `name`: The name of the competitor company (string).
    *   `website`: The website of the competitor (string).

Example of a single JSON output:
```json
{
  "idea": "A smart hydroponic system for small apartments, optimized for herbs and leafy greens, with an app for monitoring and automated nutrient delivery.",
  "score": "85/100",
  "competitors": [
    { "name": "competitor name", "website": "www.・・・・・・・" },
    { "name": "another competitor name", "website": "www.・・・・・・・" }
  ]
}
```
(Note: The actual competitors listed will be placeholders if real ones are generated, as per the `competitors.prompt` design to avoid citing real companies directly in its own template if it were to generate examples itself. The example above is for structure illustration.)
