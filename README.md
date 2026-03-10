# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK

## GitHub Basics

### First-time setup
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master:main --force
```

### Daily workflow
```bash
# Check what files have changed
git status

# Stage changes
git add .

# Commit with a message
git commit -m "Describe what you changed"

# Push to GitHub
git push origin HEAD:main
```

### Working with branches
```bash
# Create and switch to a new branch
git checkout -b my-feature-branch

# Push the branch to GitHub
git push origin my-feature-branch

# Switch back to master
git checkout master
```

### Pull requests
1. Push your branch to GitHub
2. Go to the repo on github.com — you'll see a prompt to open a PR
3. Add a title and description, then click **Create pull request**
4. Claude will automatically review the PR and post a comment
5. Once approved, click **Merge pull request**

### Secrets (API keys)
Store sensitive values in **Settings → Secrets and variables → Actions** — never hardcode them in your code or workflow files. Reference them in workflows as `${{ secrets.SECRET_NAME }}`.

### Keeping your local repo in sync
```bash
# Pull latest changes from GitHub
git pull origin main
```
