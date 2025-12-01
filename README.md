# Upnova Technical Challenge

Nx monorepo containing technical challenge projects.

## Structure

```
upnova-technical-challenge/
├── apps/
│   ├── task2/          # React + Vite: OTP Input Component
│   └── task3/          # React + Vite + Tailwind: Trip Planner
├── packages/
│   └── task1/          # Node.js: Cart Chain Event Manager
└── nx.json             # Nx workspace configuration
```

## Usage

### Run Individual Projects

**Task 1 (Node.js Script)**
```bash
npm run task1
# or
nx start task1
```

**Task 2 (OTP Input Component)**
```bash
# Development mode
npm run task2:dev
# or
nx dev task2

# Build
npm run task2:build

# Preview build
npm run task2:preview
```

**Task 3 (Trip Planner)**
```bash
# Development mode
npm run task3:dev
# or
nx dev task3

# Build
npm run task3:build

# Preview build
npm run task3:preview
```

### Run Multiple Projects

```bash
# Run both React apps in dev mode simultaneously
npm run dev:all

# Build all projects
npm run build:all

# Build only affected projects (after git changes)
nx affected --target=build
```

### Nx Commands

```bash
# Visualize project dependencies
npm run graph
# or
nx graph

# Run commands on specific projects
nx run-many --target=build --projects=task2,task3

# Clear Nx cache
nx reset
```
