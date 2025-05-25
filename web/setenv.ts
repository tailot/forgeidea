/**
 * @fileoverview This Node.js script is responsible for dynamically generating and updating
 * environment configuration files for a web application, typically an Angular application.
 * It is intended to be run during the build or deployment process.
 *
 * The script performs the following key operations:
 * 1.  **Reads Keys from a Template File:** It reads `src/environments/environment.prod.ts`
 *     to extract a list of keys from its `export const environment = {...};` object.
 *     This file serves as the template for which environment variables are expected.
 *
 * 2.  **Retrieves Values from System Environment:** For each extracted key, it attempts to
 *     fetch the corresponding value from the system's environment variables (`process.env`).
 *
 * 3.  **Generates `env.json`:** It creates a JSON file at `src/static-assets/env.json`.
 *     This file contains key-value pairs where keys are from the template and values are
 *     from `process.env`.
 *     - Missing environment variables result in `null` values in the JSON.
 *     - "true" and "false" string values from `process.env` are converted to booleans.
 *
 * 4.  **Rewrites `environment.prod.ts`:** It rewrites the original
 *     `src/environments/environment.prod.ts` file. The new content will have the same
 *     keys but with values sourced from `process.env`.
 *     - Missing environment variables result in `undefined` values in the TypeScript file.
 *     - "true" and "false" string values from `process.env` are converted to boolean literals.
 *     - String values are properly escaped for inclusion in a TypeScript file.
 *
 * 5.  **Atomic File Operations:** It uses temporary files during the write process for both
 *     output files (`.tmp` suffix) and then renames them to their final destinations.
 *     This ensures that the original files are not corrupted if the script fails mid-operation.
 *
 * 6.  **Error Handling:** The script includes error handling for file operations and
 *     unexpected input file content. It will exit with a non-zero status code on failure.
 *     Warnings are issued for missing environment variables or if no keys are found.
 *
 * This mechanism allows for a clear separation of build-time configuration keys (defined
 * in the template `environment.prod.ts`) and runtime-specific values (provided via
 * system environment variables at deployment).
 */
const fs = require('fs');
const path = require('path');

// --- Configuration for src/environments/environment.prod.ts ---
/**
 * Relative path to the production environment TypeScript file.
 * This file serves as the template for keys and is also an output file (it gets rewritten).
 * @type {string}
 */
const prodEnvFileName = './src/environments/environment.prod.ts';
/**
 * Absolute path to the production environment TypeScript file.
 * @type {string}
 */
const prodEnvFilePath = path.resolve(__dirname, prodEnvFileName);
/**
 * Filename for the temporary version of the production environment TypeScript file.
 * Used for atomic write operations.
 * @type {string}
 */
const tempProdEnvFileName = `${prodEnvFileName}.tmp`;
/**
 * Absolute path to the temporary production environment TypeScript file.
 * @type {string}
 */
const tempProdEnvFilePath = path.resolve(__dirname, tempProdEnvFileName);

// --- Configuration for src/static-assets/env.json ---
/**
 * Relative path to the output JSON file that will store environment variables.
 * This file is intended to be fetched by the frontend at runtime.
 * @type {string}
 */
const outputJsonFileName = './src/static-assets/env.json';
/**
 * Absolute path to the output JSON file.
 * @type {string}
 */
const outputJsonFilePath = path.resolve(__dirname, outputJsonFileName);
/**
 * Filename for the temporary version of the output JSON file.
 * Used for atomic write operations.
 * @type {string}
 */
const tempOutputJsonFileName = `${outputJsonFileName}.tmp`;
/**
 * Absolute path to the temporary output JSON file.
 * @type {string}
 */
const tempOutputJsonFilePath = path.resolve(__dirname, tempOutputJsonFileName);

console.log(`Reading keys from: ${prodEnvFilePath}`);

/**
 * Stores the string content read from the input `environment.prod.ts` file.
 * @type {string}
 */
let inputFileContent;
try {
  inputFileContent = fs.readFileSync(prodEnvFilePath, 'utf8');
} catch (error) {
  console.error('Ensure the file exists.');
  process.exit(1);
}
/**
 * Result of matching the `inputFileContent` against a regular expression
 * to find the `export const environment = {...};` block.
 * `envObjectMatch[1]` is expected to contain the content between the curly braces.
 * @type {RegExpMatchArray | null}
 */
const envObjectMatch = inputFileContent.match(/export const environment\s*=\s*\{([\s\S]*?)\};/);
// Extract keys from the environment object in the input file
if (!envObjectMatch || !envObjectMatch[1]) {
  console.error(`Error: Could not find the 'export const environment = {...};' object in the file "${prodEnvFileName}".`);
  console.error('Ensure the file contains exactly "export const environment = { ... };".');
  process.exit(1);
}

/**
 * The string content of the JavaScript object found within the `environment` constant
 * in `environment.prod.ts`. This is the part between `{` and `}`.
 * @type {string}
 */
const objectContent = envObjectMatch[1];
const propertyRegex = /^\s*(['"]?)([a-zA-Z_$][0-9a-zA-Z_$]*)\1\s*:/gm; // g = globale, m = multiline

let match;
/**
 * An array to store the names of the keys extracted from the `environment` object
 * in `environment.prod.ts`. These keys will be used to look up values in `process.env`.
 * @type {string[]}
 */
const keys = [];
while ((match = propertyRegex.exec(objectContent)) !== null) {
  keys.push(match[2]);
}

if (keys.length === 0) {
  console.warn(`Warning: No valid keys found in the 'environment' object in "${prodEnvFileName}". Both output files will represent an empty environment object.`);
} else {
  console.log(`Keys extracted from the source file: ${keys.join(', ')}`);
}

/**
 * An object to accumulate the key-value pairs that will be written to `env.json`.
 * Keys are from the parsed `environment.prod.ts`, and values are from `process.env`.
 * Missing environment variables will have `null` values.
 * @type {{ [key: string]: any }}
 */
const outputEnvData: { [key: string]: any } = {};

/**
 * A string buffer to build the content of the rewritten `environment.prod.ts` file.
 * It starts with `export const environment = {\n`.
 * @type {string}
 */
let outputTsString = 'export const environment = {\n';

for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const envValue = process.env[key];

  // Logic for JSON
  if (envValue === undefined) {
    console.warn(`Warning: Environment variable "${key}" not found in process.env. Setting "${key}" to null in the JSON output.`);
    outputEnvData[key] = null; // Use null for missing values in JSON
  } else if (envValue.toLowerCase() === 'true') {
    outputEnvData[key] = true; // Boolean true
  } else if (envValue.toLowerCase() === 'false') {
    outputEnvData[key] = false; // Boolean false
  } else {
    outputEnvData[key] = envValue; // String value
  }

  // Logic for TypeScript (environment.prod.ts)
  let formattedValueTs;
  if (envValue === undefined) {
    console.warn(`Warning: Environment variable "${key}" not found in process.env. Setting "${key}" to undefined in ${prodEnvFileName}.`);
    formattedValueTs = 'undefined'; // Literal undefined for TS
  } else if (envValue.toLowerCase() === 'true') {
    formattedValueTs = 'true'; // Literal true for TS
  } else if (envValue.toLowerCase() === 'false') {
    formattedValueTs = 'false'; // Literal false for TS
  } else {
    // Escape backslashes and single quotes for TypeScript string
    const escapedValue = envValue
      .replace(/\\/g, '\\\\') // Escape backslashes first!
      .replace(/'/g, "\\'")   // Escape single quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r'); // Escape carriage returns
    formattedValueTs = `'${escapedValue}'`;
  }
  outputTsString += `  ${key}: ${formattedValueTs}${i < keys.length - 1 ? ',' : ''}\n`;
}

outputTsString += '};\n';

/**
 * The final JSON string representation of the `outputEnvData` object,
 * formatted with an indentation of 2 spaces. This string will be written to `env.json`.
 * @type {string}
 */
const outputJsonString = JSON.stringify(outputEnvData, null, 2); // Format JSON with 2 spaces indentation

// Write to static-assets/env.json
try {
  console.log(`Writing JSON content to: "${outputJsonFilePath}"`);
  // Ensure the directory exists
  fs.mkdirSync(path.dirname(outputJsonFilePath), { recursive: true });

  fs.writeFileSync(tempOutputJsonFilePath, outputJsonString, 'utf8');
  console.log(`Content temporarily written to: "${tempOutputJsonFileName}"`);
  fs.renameSync(tempOutputJsonFilePath, outputJsonFilePath);
  console.log(`File "${outputJsonFileName}" updated successfully.`);
} catch (error) {
  console.error(`Error writing ${outputJsonFileName}:`, error);
  if (fs.existsSync(tempOutputJsonFilePath)) {
    try {
      fs.unlinkSync(tempOutputJsonFilePath);
      console.error(`Cleaned up temporary file: "${tempOutputJsonFileName}".`);
    } catch (e) {
      console.error(`Error cleaning up temporary file "${tempOutputJsonFileName}"`);
    }
  }
  process.exit(1);
}

// Write to src/environments/environment.prod.ts
try {
  console.log(`Rewriting TypeScript environment file: "${prodEnvFilePath}"`);
  fs.writeFileSync(tempProdEnvFilePath, outputTsString, 'utf8');
  console.log(`Content temporarily written to: "${tempProdEnvFileName}"`);
  fs.renameSync(tempProdEnvFilePath, prodEnvFilePath);
  console.log(`File "${prodEnvFileName}" updated successfully.`);
} catch (error) {
  console.error(`Error writing ${prodEnvFileName}:`, error);
  if (fs.existsSync(tempProdEnvFilePath)) {
    try {
      fs.unlinkSync(tempProdEnvFilePath);
      console.error(`Cleaned up temporary file: "${tempProdEnvFileName}".`);
    } catch (e) {
      console.error(`Error cleaning up temporary file "${tempProdEnvFileName}"`);
    }
  }
  process.exit(1);
}