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
- Encrypted JSON backup import and export
- Command Center for subscriptions, documents, devices, contacts, and emergency notes
- Today view for overdue items, upcoming renewals, subscription spend, recent activity, and security focus
- Printable Emergency Kit for critical accounts, contacts, documents, devices, and recovery steps
- Security Review for accounts missing passwords, login details, 2FA, recovery email, or URLs
- Chrome extension companion for sending the current tab to the add-account form and opening saved site matches

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- MongoDB with Mongoose
- Lucide React and Font Awesome icons
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
MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/account-management
ENCRYPTION_KEY=replace-with-a-64-character-hex-key
OLLAMA_URL=http://localhost:11434
MASTER_PASSWORD=choose-a-local-master-password
```

For MongoDB Atlas, use the connection string from Atlas and include the
database name before the query string:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/account-management?retryWrites=true&w=majority&appName=DevPulse
```

Generate a suitable encryption key with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start MongoDB, or confirm your Atlas cluster is reachable, then run the
development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Chrome Extension Companion

The `extension/` folder contains an unpacked Chrome extension that opens the
current browser tab in the app's add-account form. It also checks the running
app for saved accounts that match the current domain and links directly to them.

To install it locally:

1. Start the app with `npm run dev`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `extension/` folder in this repo.

The extension defaults to `http://localhost:3000`. To point it somewhere else,
right-click the extension icon, choose Options, and update the Account Manager
URL.

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

```bash
npm test
```

Runs the Node test suite.

```bash
npm run test:mongo
```

Starts a temporary Next.js test server, uses a throwaway MongoDB database, verifies the account API flow, confirms saved passwords are encrypted in MongoDB, and drops the test database afterward. MongoDB must be running and `mongosh` must be available on your PATH.

```bash
npm run migrate:atlas
```

Checks how many local `accounts` and `audit_events` documents would be copied
from local MongoDB into the Atlas database configured by `MONGODB_URI`. This is
a dry run and does not write anything.

```bash
npm run migrate:atlas -- --apply
```

Copies encrypted local MongoDB records into Atlas. The script preserves app-level
record IDs and upserts by `id`, so running it again updates matching records
instead of creating duplicate accounts. Set `MONGODB_LOCAL_URI` if your local
database is not `mongodb://127.0.0.1:27017/account-management`.

If your shell does not pass `--apply` through `npm run`, use:

```bash
npm run migrate:atlas:apply
```

```bash
npm run snapshot:atlas
```

Creates an encrypted local snapshot file under `data/snapshots/` from the Atlas
database configured by `MONGODB_URI`. Snapshot files are ignored by git.

```bash
npm run snapshot:restore-local -- --file data/snapshots/SNAPSHOT_FILE.json
```

Checks how many records from a snapshot would be restored into local MongoDB.
This is a dry run and does not write anything.

```bash
npm run snapshot:restore-local -- --file data/snapshots/SNAPSHOT_FILE.json --apply
```

Restores the encrypted snapshot into local MongoDB by upserting `accounts` and
`audit_events` by `id`. Set `MONGODB_LOCAL_URI` if your local MongoDB is not
`mongodb://127.0.0.1:27017/account-management`.

To run offline from local MongoDB after restoring a snapshot, set:

```env
MONGODB_OFFLINE=true
```

Remove that line or set it to `false` when you want the app to use Atlas again.

## Project Structure

```text
app/                  Next.js App Router pages and API routes
components/           Reusable UI components
lib/                  Database, encryption, password, Ollama, and utility code
tests/                Node test runner integration tests
public/               Static assets
```

## Security Notes

Set `ENCRYPTION_KEY` before storing real passwords. The app refuses to encrypt,
decrypt, export backups, or import backups without a valid 64-character hex key.
Keep this key unchanged for existing data; changing it prevents previously saved
passwords and backups from decrypting.

Set `MASTER_PASSWORD` or `MASTER_PASSWORD_HASH` to require unlocking the vault before viewing pages or calling account APIs.

Passwords are decrypted for account detail views and for the local assistant
context. Run this project only in an environment you trust, and keep `.env.local`
out of version control.

Prefer encrypted JSON exports from the backup controls for local emergency
snapshots instead of keeping a second live MongoDB instance with replicated
password vault data.

## Deployment

For deployment, configure the same environment variables on your host and point `MONGODB_URI` at a persistent MongoDB instance. If the chat assistant is required in production, the deployed app also needs network access to an Ollama server.
