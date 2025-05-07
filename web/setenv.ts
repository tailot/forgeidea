const fs = require('fs');
const path = require('path');

const envFileName = './src/environments/environment.prod.ts';
const envFilePath = path.resolve(__dirname, envFileName);

const tempEnvFileName = `${envFileName}.tmp`;
const tempEnvFilePath = path.resolve(__dirname, tempEnvFileName);

console.log(`Reading keys and rewriting: ${envFilePath}`);

let inputFileContent;
try {
  inputFileContent = fs.readFileSync(envFilePath, 'utf8');
} catch (error) {
  console.error('Ensure the file exists.');
  process.exit(1);
}
const envObjectMatch = inputFileContent.match(/export const environment\s*=\s*\{([\s\S]*?)\};/);

if (!envObjectMatch || !envObjectMatch[1]) {
  console.error(`Error: Could not find the 'export const environment = {...};' object in the file "${envFileName}".`);
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
  console.warn(`Warning: No valid keys found in the 'environment' object in "${envFileName}". The file might be rewritten with an empty object.`);
} else {
  console.log(`Keys extracted from the source file: ${keys.join(', ')}`);
}

let outputString = 'export const environment = {\n';

for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const envValue = process.env[key];

  let formattedValue;
  if (envValue === undefined) {
    console.warn(`Warning: Environment variable "${key}" not found in process.env. Setting "${key}" to undefined.`);
    formattedValue = 'undefined';
  } else if (envValue.toLowerCase() === 'true') {
    formattedValue = 'true';
  } else if (envValue.toLowerCase() === 'false') {
    formattedValue = 'false';
  } else {
    const escapedValue = envValue
      .replace(/\\/g, '\\\\') // Escape backslashes first!
      .replace(/'/g, "\\'")   // Escape single quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r'); // Escape carriage returns

    formattedValue = `'${escapedValue}'`;
  }

  outputString += `  ${key}: ${formattedValue}${i < keys.length - 1 ? ',' : ''}\n`;
}

outputString += '};\n';

try {
  fs.writeFileSync(tempEnvFilePath, outputString, 'utf8');
  console.log(`Content temporarily written to: "${tempEnvFileName}"`);

  fs.renameSync(tempEnvFilePath, envFilePath);
  console.log(`File "${envFileName}" updated successfully.`);

} catch (error) {
  console.error(`Error during file writing`);
  if (fs.existsSync(tempEnvFilePath)) {
    try {
      fs.unlinkSync(tempEnvFilePath);
      console.error(`Cleaned up temporary file: "${tempEnvFileName}"`);
    } catch (e) {
      console.error(`Error cleaning up temporary file "${tempEnvFileName}"`);
    }
  }
  process.exit(1);
}