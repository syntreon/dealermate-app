---
inclusion: always
---

# Backend Opertation and System (how the call works)

## Incoming call
 Call comes from user to Twilio, 
 2. Twilio sends to Vapi via webhook
 3. Vapi is the AI call orchestrator
 4. Vapi does tool calls via Make.com as automation platform  
 5. End of call Vapi sends call data to make.com via webhook.
 Make.com has multiple scenarios to post process trasncript data.
 6. Make.com sends to Supabase
 7. we pull data from supabase and display in dashboard

# Technology Stack

This document provides an overview of the technologies, libraries, and services used to build and run the Dealermate application.

## 1. Core Framework & Build Tools

*   **[React](https://react.dev/)**: The core of our application is built using React, a JavaScript library for building user interfaces with a component-based architecture.
*   **[Vite](https://vitejs.dev/)**: We use Vite as our build tool and development server. It provides a faster and leaner development experience compared to older tools, with features like Hot Module Replacement (HMR) and optimized builds.
*   **[TypeScript](https://www.typescriptlang.org/)**: The entire codebase is written in TypeScript, a statically typed superset of JavaScript. This helps us catch errors early, improve code quality, and enhance developer productivity through better autocompletion and code navigation.

## 2. Backend & Database

*   **[Supabase](https://supabase.com/)**: Supabase serves as our primary backend. It's an open-source Firebase alternative that provides a suite of tools built on top of a PostgreSQL database.
    *   **Database**: A full-featured PostgreSQL database for storing all application data (users, clients, calls, etc.).
    *   **Authentication**: Manages user sign-up, login, and session management.
    *   **Storage**: Used for storing any file assets if needed.
    *   **Auto-generated APIs**: Provides instant and secure RESTful and real-time APIs for interacting with the database.

## 3. UI & Styling

*   **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly building custom user interfaces. We use it for all our styling, enabling a consistent and maintainable design system.
*   **[shadcn/ui](https://ui.shadcn.com/)**: A collection of beautifully designed, reusable components built on top of Radix UI and Tailwind CSS. We use it for our core UI elements like buttons, forms, dialogs, and cards. It is not a traditional component library; instead, we copy and paste its components into our codebase, allowing for full control and customization.
*   **[Radix UI](https://www.radix-ui.com/)**: Provides the unstyled, accessible, and highly functional primitive components that power our `shadcn/ui` components.
*   **[Recharts](https://recharts.org/)**: A composable charting library built on React components. We use it to create all the data visualizations and charts in the Admin Dashboard and Analytics sections.
*   **[Lucide React](https://lucide.dev/)**: Provides the clean and consistent icon set used throughout the application.

## 4. State Management & Data Fetching

*   **[TanStack Query (React Query)](https://tanstack.com/query/latest)**: A powerful library for fetching, caching, synchronizing, and updating server state in our React applications. It simplifies data fetching logic, handles loading and error states, and improves performance with caching.
*   **[React Context API](https://react.dev/reference/react/useContext)**: Used for managing global state that doesn't require the complexity of a full state management library, such as the current user's authentication status.

## 5. Routing & Forms

*   **[React Router](https://reactrouter.com/)**: The standard library for handling routing in React applications. It enables navigation between different pages and views within our single-page application (SPA).
*   **[React Hook Form](https://react-hook-form.com/)**: A performant, flexible, and extensible library for managing forms in React. We use it for all form submissions, such as login and user settings.
*   **[Zod](https://zod.dev/)**: A TypeScript-first schema declaration and validation library. We use it with React Hook Form to define our form schemas and validate user input on both the client and server sides.

## 6. Theming

*   **[Next-themes](https://github.com/pacocoursey/next-themes)**: A library that simplifies the implementation of light and dark mode themes in the application, persisting the user's choice.

## 7. Tooling & Code Quality

*   **[ESLint](https://eslint.org/)**: A pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript and TypeScript. It helps us maintain a consistent code style and avoid common errors.
*   **[PostCSS](https://postcss.org/)**: A tool for transforming CSS with JavaScript plugins. It's used by Tailwind CSS to process our styles.
*   **[Bun](https://bun.sh/)**: While `package.json` defines scripts runnable by npm/yarn, the presence of `bun.lockb` indicates that Bun is likely used for package management, offering faster installation and script execution.

## Run Tests
1. Run Tests in Watch Mode
bash
`npm test`
* Runs tests using Vitest in watch mode
* Great for development as it re-runs tests on file changes

2. Run Tests Once
bash
`npm run test:run`
* Runs tests once and exits
* Useful for CI/CD pipelines

3. Run Tests with UI
bash
`npm run test:ui`
* Launches the Vitest UI for a visual testing experience
* Helpful for debugging and exploring tests

4. Linting
bash
`npm run lint`
* Runs ESLint to check code quality and style
* Helps maintain consistent code style

5. Type Checking
For type checking, you can use TypeScript's built-in type checker:

bash
`npx tsc --noEmit`
This will check your TypeScript code for type errors without emitting any JavaScript files.

### Additional Notes
This project uses Vitest as the testing framework
Testing libraries included:
@testing-library/react (v16.3.0)
@testing-library/jest-dom (v6.6.3)
jsdom (v26.1.0) for DOM testing
TypeScript version: 5.5.3
React version: 18.3.1
