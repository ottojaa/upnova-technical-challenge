# Quick Start Guide

Get the Trip Planner AI app running in 3 minutes!

## Prerequisites

Make sure you have:
- **Node.js 18+** installed
- **pnpm** installed (run `npm install -g pnpm` if you don't have it)
- An **OpenAI API key** (get one at https://platform.openai.com/api-keys)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Configure API Keys

```bash
cd apps/agent
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

**Note:** Weather is powered by Open-Meteo API - completely free, no API key needed! ☀️

## Step 3: Start the App

```bash
cd ../..  # Go back to root
pnpm dev
```

## Step 4: Open the App

Open http://localhost:3000 in your browser!

## Try These Commands

Chat with the AI assistant in the sidebar:

- **"Help me create a todo list for a trip to Paris"**
- **"What's the weather like in Tokyo?"**
- **"Add a todo to visit the Eiffel Tower"**
- **"Plan a weekend in Barcelona"**

## Troubleshooting

**"I'm having trouble connecting to my tools"**
- Make sure the agent server is running on port 8123
- Check that your OpenAI API key is correct in `apps/agent/.env`

**Weather not showing?**
- Weather uses Open-Meteo API (free, no key needed)
- If weather fails, the app falls back to mock data automatically

**Port already in use?**
- Stop other processes using port 3000 or 8123
- Or modify the port in `apps/agent/package.json` for the agent

## What's Next?

- Check out [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed docs
- Customize the categories and styling in `apps/web/src/app/page.tsx`
- Modify the AI's behavior in `apps/agent/src/agent.ts`

Happy trip planning! ✈️
