# Nx Monorepo Refactoring Plan

## Current Structure
```
upnova-technical-challenge/
├── scripts/
│   ├── task1/          # Node.js script (Cart Chain Event Manager)
│   ├── task2/          # Vite + React app (OTP Input Component)
│   └── task3/          # Vite + React + Tailwind app (Trip Planner)
└── package.json        # Root package.json
```

## Target Nx Monorepo Structure
```
upnova-technical-challenge/
├── apps/
│   ├── task2/          # React app (OTP Input)
│   └── task3/          # React app (Trip Planner)
├── packages/
│   └── task1/          # Node.js package/script
├── nx.json
├── package.json        # Root workspace config
└── tsconfig.base.json  # Shared TypeScript config (optional)
```

## Migration Steps

### Phase 1: Install Nx
1. **Install Nx CLI and core packages**
   ```bash
   npm install -D nx @nx/workspace @nx/vite @nx/js
   ```

2. **Initialize Nx workspace**
   ```bash
   npx nx init
   ```
   - This converts the existing repo to an Nx workspace
   - Creates `nx.json` configuration
   - Keeps existing package structure

### Phase 2: Restructure Projects

#### 2.1 Move task2 (React/Vite app)
1. **Create apps directory and move task2**
   ```bash
   mkdir -p apps
   mv scripts/task2 apps/task2
   ```

2. **Update task2/project.json** (create if doesn't exist)
   ```json
   {
     "name": "task2",
     "root": "apps/task2",
     "sourceRoot": "apps/task2/src",
     "projectType": "application",
     "targets": {
       "dev": {
         "executor": "@nx/vite:dev-server",
         "options": {
           "buildTarget": "task2:build"
         }
       },
       "build": {
         "executor": "@nx/vite:build",
         "outputs": ["{options.outputPath}"],
         "options": {
           "outputPath": "dist/apps/task2"
         }
       },
       "preview": {
         "executor": "@nx/vite:preview-server",
         "options": {
           "buildTarget": "task2:build"
         }
       }
     }
   }
   ```

#### 2.2 Move task3 (React/Vite/Tailwind app)
1. **Move task3 to apps**
   ```bash
   mv scripts/task3 apps/task3
   ```

2. **Update task3/project.json** (similar to task2)
   ```json
   {
     "name": "task3",
     "root": "apps/task3",
     "sourceRoot": "apps/task3/src",
     "projectType": "application",
     "targets": {
       "dev": {
         "executor": "@nx/vite:dev-server",
         "options": {
           "buildTarget": "task3:build"
         }
       },
       "build": {
         "executor": "@nx/vite:build",
         "outputs": ["{options.outputPath}"],
         "options": {
           "outputPath": "dist/apps/task3"
         }
       },
       "preview": {
         "executor": "@nx/vite:preview-server",
         "options": {
           "buildTarget": "task3:build"
         }
       }
     }
   }
   ```

#### 2.3 Move task1 (Node.js script)
1. **Create packages directory and move task1**
   ```bash
   mkdir -p packages
   mv scripts/task1 packages/task1
   ```

2. **Create packages/task1/package.json**
   ```json
   {
     "name": "@upnova/task1",
     "version": "1.0.0",
     "type": "module",
     "main": "task1.js",
     "scripts": {
       "start": "node task1.js"
     }
   }
   ```

3. **Create packages/task1/project.json**
   ```json
   {
     "name": "task1",
     "root": "packages/task1",
     "sourceRoot": "packages/task1",
     "projectType": "library",
     "targets": {
       "start": {
         "executor": "nx:run-commands",
         "options": {
           "command": "node task1.js",
           "cwd": "packages/task1"
         }
       }
     }
   }
   ```

### Phase 3: Configure Root Workspace

#### 3.1 Update root package.json
```json
{
  "name": "upnova-technical-challenge",
  "version": "1.0.0",
  "description": "Nx monorepo for Upnova technical challenges",
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "task1": "nx start task1",
    "task2:dev": "nx dev task2",
    "task2:build": "nx build task2",
    "task3:dev": "nx dev task3",
    "task3:build": "nx build task3",
    "dev:all": "nx run-many --target=dev --projects=task2,task3",
    "build:all": "nx run-many --target=build --all"
  },
  "devDependencies": {
    "nx": "^latest",
    "@nx/workspace": "^latest",
    "@nx/vite": "^latest",
    "@nx/js": "^latest"
  }
}
```

#### 3.2 Configure nx.json
```json
{
  "extends": "nx/presets/npm.json",
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "dev": {
      "cache": false
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.spec.tsx",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "plugins": [
    {
      "plugin": "@nx/vite/plugin",
      "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "serveTargetName": "dev",
        "previewTargetName": "preview"
      }
    }
  ]
}
```

### Phase 4: Dependency Management

#### 4.1 Consolidate shared dependencies at root
- Move React, React-DOM, Vite, and common dev dependencies to root
- Keep project-specific dependencies in their respective package.json files:
  - task2: `motion` library
  - task3: `@copilotkit/*`, `tailwindcss`, `postcss`, `autoprefixer`

#### 4.2 Update package.json files
- Update `task2/package.json` to only include project-specific deps
- Update `task3/package.json` to only include project-specific deps
- Remove duplicate dependencies

#### 4.3 Run install
```bash
npm install
```

### Phase 5: Update Configuration Files

#### 5.1 Update .gitignore
Add Nx-specific entries:
```
.nx/cache
dist/
node_modules/
```

#### 5.2 Preserve existing configs
- Keep `task2/vite.config.js` as-is
- Keep `task3/vite.config.js`, `tailwind.config.js`, `postcss.config.js` as-is
- Nx will use these configs automatically

### Phase 6: Cleanup
```bash
# Remove empty scripts directory
rmdir scripts
```

## Execution Commands (After Migration)

### Run individual projects
```bash
# Task 1 (Node.js script)
nx start task1
# or
npm run task1

# Task 2 (OTP Input - dev mode)
nx dev task2
# or
npm run task2:dev

# Task 3 (Trip Planner - dev mode)
nx dev task3
# or
npm run task3:dev
```

### Run multiple projects
```bash
# Run both React apps in dev mode
nx run-many --target=dev --projects=task2,task3
# or
npm run dev:all

# Build all projects
nx run-many --target=build --all
# or
npm run build:all
```

### Other useful commands
```bash
# Show project graph
nx graph

# Run affected projects only (after git changes)
nx affected --target=build

# Clear Nx cache
nx reset
```

## Benefits of This Approach

1. **Unified execution**: Run all projects from root with `nx` commands
2. **Smart caching**: Nx caches build/test results, speeding up repeated runs
3. **Dependency graph**: Visualize project dependencies with `nx graph`
4. **Affected commands**: Only run tasks on projects affected by code changes
5. **Parallel execution**: Run multiple projects simultaneously
6. **Shared configuration**: Centralize common dependencies and configs
7. **Scalability**: Easy to add new apps/packages in the future

## Rollback Plan

If migration fails:
1. Git reset to pre-migration state
2. Manually move projects back to `scripts/` directory
3. Remove Nx dependencies from root package.json

## Estimated Time

- Phase 1: 5 minutes
- Phase 2-3: 15 minutes
- Phase 4-5: 10 minutes
- Testing: 10 minutes
- **Total: ~40 minutes**


