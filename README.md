# Dealermate AI

This is a forked version of the DealerMate AI application from my base dashboard app, customized for my specific needs.

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account
- A Google API key for Google Sheets integration

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.template .env
   ```
4. Update the `.env` file with your own credentials

### Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Update the `.env` file with these values
4. Run the SQL scripts in the `supabase/migrations` directory to set up your database schema

### Google Sheets Setup

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create an API key
4. Add your Google Sheet ID and API key to the `.env` file

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

