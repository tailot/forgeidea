# forgeIDEA Web Frontend

This project is the Angular-based web frontend for forgeIDEA. It was generated using [Angular CLI](https://github.com/angular/angular-cli).

## Development Setup

To set up the development environment and start a local development server, follow these steps:

1.  **Install Dependencies:**
    Navigate to the `web` directory and install the necessary Node.js packages:
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    To start the local development server, run:
    ```bash
    ng serve
    ```
    Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building the Project

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running Tests

This project uses Karma for unit tests and supports end-to-end (e2e) testing.

### Running Unit Tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
npm test
```
Alternatively, you can use the Angular CLI command:
```bash
ng test
```

### Running End-to-End Tests

For end-to-end (e2e) testing, run:
```bash
ng e2e
```
Note: Angular CLI does not come with an end-to-end testing framework by default. You will need to choose and configure one that suits your project's needs (e.g., Cypress, Protractor).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
