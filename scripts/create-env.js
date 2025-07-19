/**
 * Simple Environment Variable Setup Helper
 * 
 * This script creates a basic .env file with the necessary Supabase variables.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the .env file
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('======================================');
console.log('Environment Variable Setup Helper');
console.log('======================================');
console.log('Creating a template .env file with required variables...');

// Create a basic .env file template
const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# IMPORTANT: Replace the values above with your actual Supabase credentials
# You can find these in your Supabase project settings under API > Project API keys
# The service role key is required for audit logging to bypass RLS policies
`;

// Create a basic .env.example file
const envExampleContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
`;

// Write the files
fs.writeFileSync(envPath, envContent);
fs.writeFileSync(envExamplePath, envExampleContent);

console.log(`Created .env file at: ${envPath}`);
console.log(`Created .env.example file at: ${envExamplePath}`);
console.log('\nNext steps:');
console.log('1. Open the .env file and replace the placeholder values with your actual Supabase credentials');
console.log('2. Get your service role key from Supabase project settings > API > Project API keys');
console.log('3. Restart your application after updating the .env file');
console.log('\nIMPORTANT: The service role key has admin privileges and should be kept secure!');
