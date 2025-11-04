const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3193/schema'; // Update this with your actual API URL
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'app', 'interfaces');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'api.ts');

async function generateInterfaces() {
  try {
    console.log('Fetching OpenAPI schema...');
    const response = await axios.get(API_URL);
    const schema = response.data;

    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write the schema to a temporary file
    const tempSchemaFile = path.join(__dirname, 'temp-schema.json');
    fs.writeFileSync(tempSchemaFile, JSON.stringify(schema, null, 2));

    console.log('Generating TypeScript interfaces...');
    execSync(`npx openapi-typescript ${tempSchemaFile} --output ${OUTPUT_FILE}`, {
      stdio: 'inherit'
    });

    // Clean up temporary file
    fs.unlinkSync(tempSchemaFile);

    console.log(`Successfully generated interfaces in ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating interfaces:', error.message);
    process.exit(1);
  }
}

generateInterfaces();
