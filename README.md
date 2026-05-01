# Account Management

A private account-management dashboard built with Next.js. It stores account details in MongoDB, encrypts saved passwords, and includes an optional local Ollama-powered chat assistant for searching account information.

## Features

- Dashboard summary for total accounts, accounts with passwords, and categories
- Create, view, edit, and delete account records
- Category-based account organization
- Encrypted password storage using AES-256-GCM
- Copy controls for account details
- Optional local AI assistant backed by Ollama and `llama3.1:latest`
- MongoDB persistence through Mongoose

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- MongoDB with Mongoose
- Lucide React icons
- Ollama for the local assistant

## Requirements

- Node.js 20 or newer
- npm
- MongoDB running locally or a MongoDB connection string
- Ollama, only if you want to use the chat assistant

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/account-management
ENCRYPTION_KEY=replace-with-a-64-character-hex-key
OLLAMA_URL=http://localhost:11434
```

Generate a suitable encryption key with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start MongoDB, then run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Ollama Setup

The chat assistant uses `llama3.1:latest` by default. To enable it locally:

```bash
ollama pull llama3.1
ollama serve
```

If Ollama is not running, the account-management features still work. Only the chat assistant will be unavailable.

## Available Scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Builds the production application.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint.

## Project Structure

```text
app/                  Next.js App Router pages and API routes
components/           Reusable UI components
lib/                  Database, encryption, password, Ollama, and utility code
public/               Static assets
```

## Security Notes

Set `ENCRYPTION_KEY` before storing real passwords. The app has a development fallback key, but that fallback should not be used for private or production data.

Passwords are decrypted for account detail views and for the local assistant context. Run this project only in an environment you trust, and keep `.env.local` out of version control.

## Deployment

For deployment, configure the same environment variables on your host and point `MONGODB_URI` at a persistent MongoDB instance. If the chat assistant is required in production, the deployed app also needs network access to an Ollama server.
