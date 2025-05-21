const fs = require('fs');
const path = require('path');

// Path for environment.prod.ts (input for keys, and an output file)
const prodEnvFileName = './src/environments/environment.prod.ts';
const prodEnvFilePath = path.resolve(__dirname, prodEnvFileName);
const tempProdEnvFileName = `${prodEnvFileName}.tmp`;
const tempProdEnvFilePath = path.resolve(__dirname, tempProdEnvFileName);

// Path for env.json (output file)
const outputJsonFileName = './src/static-assets/env.json';
const outputJsonFilePath = path.resolve(__dirname, outputJsonFileName);
const tempOutputJsonFileName = `${outputJsonFileName}.tmp`;
const tempOutputJsonFilePath = path.resolve(__dirname, tempOutputJsonFileName);

console.log(`Reading keys from: ${prodEnvFilePath}`);

let inputFileContent;
try {
  inputFileContent = fs.readFileSync(prodEnvFilePath, 'utf8');
} catch (error) {
  console.error('Ensure the file exists.');
  process.exit(1);
}
const envObjectMatch = inputFileContent.match(/export const environment\s*=\s*\{([\s\S]*?)\};/);
// Extract keys from the environment object in the input file
if (!envObjectMatch || !envObjectMatch[1]) {
  console.error(`Error: Could not find the 'export const environment = {...};' object in the file "${prodEnvFileName}".`);
  console.error('Ensure the file contains exactly "export const environment = { ... };".');
  process.exit(1);
}

const objectContent = envObjectMatch[1];
const propertyRegex = /^\s*(['"]?)([a-zA-Z_$][0-9a-zA-Z_$]*)\1\s*:/gm; // g = globale, m = multiline

let match;
const keys = [];
while ((match = propertyRegex.exec(objectContent)) !== null) {
  keys.push(match[2]);
}

if (keys.length === 0) {
  console.warn(`Warning: No valid keys found in the 'environment' object in "${prodEnvFileName}". Both output files will represent an empty environment object.`);
} else {
  console.log(`Keys extracted from the source file: ${keys.join(', ')}`);
}

// Prepare data for JSON output
const outputEnvData: { [key: string]: any } = {};

// Prepare string for TypeScript output (environment.prod.ts)
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