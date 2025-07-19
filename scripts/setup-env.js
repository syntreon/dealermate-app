/**
 * Environment Variable Setup Helper
 * 
 * This script helps set up the required environment variables for the application,
 * particularly the Supabase service role key needed for audit logging.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the path to the .env file
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Check if .env file exists
const envExists = fs.existsSync(envPath);

console.log('======================================');
console.log('Environment Variable Setup Helper');
console.log('======================================');
console.log('This script will help you set up the required environment variables');
console.log('for the application, particularly the Supabase service role key');
console.log('needed for audit logging to bypass RLS policies.');
console.log('');

// Function to get the current env variables
function getCurrentEnvVars() {
  if (!envExists) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  return envVars;
}

// Function to write env variables to file
function writeEnvFile(envVars) {
  let content = '';
  
  Object.entries(envVars).forEach(([key, value]) => {
    content += `${key}=${value}\n`;
  });
  
  fs.writeFileSync(envPath, content);
  console.log(`Environment variables saved to ${envPath}`);
}

// Function to write example env file
function writeEnvExampleFile(envVars) {
  let content = '';
  
  Object.entries(envVars).forEach(([key, value]) => {
    // For example file, don't include actual values
    content += `${key}=\n`;
  });
  
  fs.writeFileSync(envExamplePath, content);
  console.log(`Example environment file saved to ${envExamplePath}`);
}

// Main function
async function setupEnv() {
  const currentEnvVars = getCurrentEnvVars();
  
  // Ask for Supabase URL if not already set
  const askForSupabaseUrl = () => {
    return new Promise((resolve) => {
      if (currentEnvVars.VITE_SUPABASE_URL) {
        console.log(`Current Supabase URL: ${currentEnvVars.VITE_SUPABASE_URL}`);
        rl.question('Enter new Supabase URL or press Enter to keep current: ', (answer) => {
          resolve(answer || currentEnvVars.VITE_SUPABASE_URL);
        });
      } else {
        rl.question('Enter your Supabase URL (e.g., https://your-project.supabase.co): ', (answer) => {
          resolve(answer);
        });
      }
    });
  };
  
  // Ask for Supabase anon key if not already set
  const askForSupabaseAnonKey = () => {
    return new Promise((resolve) => {
      if (currentEnvVars.VITE_SUPABASE_ANON_KEY) {
        console.log(`Current Supabase anon key is set (hidden for security)`);
        rl.question('Enter new Supabase anon key or press Enter to keep current: ', (answer) => {
          resolve(answer || currentEnvVars.VITE_SUPABASE_ANON_KEY);
        });
      } else {
        rl.question('Enter your Supabase anon key: ', (answer) => {
          resolve(answer);
        });
      }
    });
  };
  
  // Ask for Supabase service role key if not already set
  const askForSupabaseServiceRoleKey = () => {
    return new Promise((resolve) => {
      if (currentEnvVars.VITE_SUPABASE_SERVICE_ROLE_KEY) {
        console.log(`Current Supabase service role key is set (hidden for security)`);
        rl.question('Enter new Supabase service role key or press Enter to keep current: ', (answer) => {
          resolve(answer || currentEnvVars.VITE_SUPABASE_SERVICE_ROLE_KEY);
        });
      } else {
        console.log('\nIMPORTANT: The service role key is required for audit logging to bypass RLS policies.');
        console.log('You can find this key in your Supabase project settings under API > Project API keys > service_role key.');
        console.log('WARNING: This key has admin privileges and should be kept secure!\n');
        
        rl.question('Enter your Supabase service role key: ', (answer) => {
          resolve(answer);
        });
      }
    });
  };
  
  // Get values from user
  const supabaseUrl = await askForSupabaseUrl();
  const supabaseAnonKey = await askForSupabaseAnonKey();
  const supabaseServiceRoleKey = await askForSupabaseServiceRoleKey();
  
  // Update env vars
  const updatedEnvVars = {
    ...currentEnvVars,
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
    VITE_SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey
  };
  
  // Write to files
  writeEnvFile(updatedEnvVars);
  writeEnvExampleFile(updatedEnvVars);
  
  console.log('\n======================================');
  console.log('Setup Complete!');
  console.log('======================================');
  console.log('You need to restart your application for the changes to take effect.');
  console.log('');
  
  rl.close();
}

// Run the setup
setupEnv();
