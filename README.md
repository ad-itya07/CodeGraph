# CodeGraph 🚀

[Live Application](https://codegraph-client.vercel.app/) | [Documentation](https://codegraph-client.vercel.app/docs)

CodeGraph is a comprehensive full-stack developer platform designed to parse, visualize, and analyze complex JavaScript and TypeScript codebases. By extracting Abstract Syntax Trees (ASTs), symbols, and relational dependencies, CodeGraph constructs interactive node graphs and provides deep architectural analytics to help teams understand, refactor, and maintain large-scale software systems.

---

## 🌟 Key Features

- **Asynchronous Job Queue & Dedicated Workers**:
  - Redis-backed distributed task queue powered by **BullMQ** for scalable repository ingestion and processing.
  - Decoupled worker architecture supporting concurrent background processing without blocking API endpoints.
  - Graceful job management with automatic cleanup, failure detection, and deterministic retries.

- **Multi-Stage Real-Time Pipeline Tracking**:
  - Granular progress reporting through dedicated execution stages:
    1. `CLONING`: Git repository cloning and metadata/commit extraction.
    2. `PARSING_METADATA`: Discovering project configurations and package definitions.
    3. `PARSING_PATH_CONFIG`: Resolving TypeScript path aliases and compiler paths.
    4. `PARSING_SYMBOLS`: Extracting classes, functions, interfaces, methods, and variables.
    5. `PARSING_RELATIONSHIPS`: Resolving cross-file and intra-file symbol references and imports/exports.
    6. `BUILDING_GRAPH`: Assembling graph structures, persistence, and computing repository health metrics.
  - Interactive status badges, live progress indicators, and stage-specific error diagnostics with one-click retry.

- **AST-Based Code Parsing Engine**:
  - Leverages `@babel/parser` and `@babel/traverse` to extract granular symbol definitions and hierarchical structures across modern JS/TS/TSX/JSX files.
  - Robust support for TypeScript path mappings (`tsconfig.json`, `jsconfig.json`) and complex module resolution.

- **Interactive Dependency Graphs**:
  - Visualizes code relationships (calls, imports, implementations, type references) using **React Flow (`@xyflow/react`)**.
  - Provides node clustering, interactive canvas controls, zoom-to-fit, entity search, and visual depth badges.

- **Architectural & Codebase Analytics**:
  - **Impact Analysis**: Evaluate the ripple effect of modifying specific functions, classes, or files.
  - **Cycle Detection**: Identify and isolate circular dependencies across the project.
  - **Call Path Tracing**: Trace upstream and downstream execution paths between functions and methods.
  - **Dependency Ordering**: Determine safe initialization and execution sequences.
  - **Connectivity & Coupling**: Measure node degree, in-degree/out-degree, and architectural cohesion.

- **High-Performance Caching & Storage**:
  - Relational graph persistence with **PostgreSQL** and **Prisma ORM**.
  - Intelligent multi-tier **Redis** caching for user overviews, query analytics, and real-time state invalidation.

---

## 🏗 Architecture Overview

```
 ┌─────────────────┐       HTTP / REST        ┌───────────────────────┐
 │                 │ ───────────────────────> │                       │
 │  Next.js Client │                          │  Express REST API     │
 │  (React Flow UI)│ <─────────────────────── │  (Controller Layer)   │
 └────────┬────────┘    Status Polling / Data └──────────┬────────────┘
          │                                              │
          │                                              │ Enqueue Job
          │                                              ▼
          │                                   ┌───────────────────────┐
          │                                   │ BullMQ Job Queue      │
          │                                   │ (Redis Queue Broker)  │
          │                                   └──────────┬────────────┘
          │                                              │
          │                                              │ Worker Consumes Job
          │                                              ▼
          │                                   ┌───────────────────────┐
          │                                   │ CodeGraph Worker      │
          │                                   │ (analysisWorker.ts)   │
          │                                   └──────────┬────────────┘
          │                                              │
          │               ┌──────────────────────────────┴──────────────────────────────┐
          │               │                                                             │
          │               ▼                                                             ▼
          │    ┌───────────────────────┐                                     ┌───────────────────────┐
          │    │ Git & AST Parser      │                                     │ Graph Builder &       │
          │    │ - Clone Repository    │                                     │ Overview Analyzer     │
          │    │ - Path Resolution     │ ──────────────────────────────────> │ - Node & Edge Mapping │
          │    │ - Symbol Extractor    │                                     │ - Architectural Stats │
          │    │ - Rel Extractor       │                                     │ - Health & Insights   │
          │    └───────────────────────┘                                     └──────────┬────────────┘
          │                                                                             │
          │                                                                             │ Persist & Cache
          │                                                                             ▼
          └─────────────────────────── Reads From ─────────────────────────> ┌───────────────────────┐
                                                                             │ PostgreSQL + Redis    │
                                                                             │ (Prisma & Cache Tier) │
                                                                             └───────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: [Next.js](https://nextjs.org/) (React 19, App Router)
- **Graph Visualization**: [React Flow (`@xyflow/react`)](https://reactflow.dev/)
- **State Management & Querying**: [TanStack React Query](https://tanstack.com/query/latest)
- **Styling & UI Components**: Tailwind CSS, Radix UI primitives, Lucide React
- **HTTP Client**: Axios

### Backend (Server)
- **Runtime & API**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/)
- **Job Queue & Background Worker**: [BullMQ](https://bullmq.io/), `ioredis`
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **Caching**: [Redis](https://redis.io/)
- **Parsing Engine**: `@babel/parser`, `@babel/traverse`, `jsonc-parser`
- **Concurrency & Tooling**: TypeScript, `tsx`, `concurrently`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20+`
- **PostgreSQL**: `v14+`
- **Redis**: `v6+`
- **Git**: Installed and available in PATH

---

### Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/ad-itya07/CodeGraph.git
cd 21_CodeGraph
```

#### 2. Configure Environment Variables

**Server (`server/.env`):**
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/codegraph?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
RUN_WORKER="true" # Set to "false" if running the worker as a separate process
```

**Client (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

---

#### 3. Backend Setup & Running

Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

Generate Prisma Client and apply database schema:
```bash
npx prisma generate
npx prisma db push
```

**Run in Development Mode:**
```bash
# Starts Express server with an in-process BullMQ worker
npm run dev
```

*Alternatively, run the API server and worker in separate terminal sessions:*
```bash
# Terminal 1: Express API Server (with RUN_WORKER=false in .env)
npm run dev

# Terminal 2: Dedicated Analysis Worker
npm run worker
```

**Run in Production Mode:**
```bash
# Build TypeScript code
npm run build

# Run both Server and Worker concurrently
npm run start:prod

# Or run them individually:
npm run start        # Starts Express server
npm run worker:prod  # Starts Worker process
```

---

#### 4. Frontend Setup & Running

Navigate to the `client` directory and install dependencies:
```bash
cd ../client
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port indicated in the terminal) in your browser.

---

## 🔄 Repository Processing & Worker Pipeline

1. **Repository Ingestion**: A user submits a public git repository URL. A new repository record is created with `status: QUEUED`.
2. **Queueing**: A job containing `{ repositoryId, userId }` is dispatched to the `repository-analysis` BullMQ queue.
3. **Worker Execution**: An active worker instance claims the job and executes `processJob()`:
   - **Cloning**: Clones the repo locally into temporary storage (`uploads/repo-<id>`) and extracts commit details.
   - **Parsing**: Parses ASTs, indexes file metadata, extracts compiler configurations, symbol nodes, and relationships.
   - **Graph Assembly**: Builds the complete dependency graph and runs architectural metric calculations.
   - **Persistence & Caching**: Saves nodes and edges to PostgreSQL via Prisma, caches overview metrics in Redis, and clears temporary disk files.
   - **Completion / Failure**: Transitions repository status to `READY` (or `FAILED` with specific error codes such as `CLONE_FAILED` or `NO_SUPPORTED_FILES`).
4. **Client-Side Live Updates**: The client periodically polls `/api/repositories/:id/status` during processing and triggers reactive UI updates when the graph is ready.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT |
| `POST` | `/api/repositories` | Add repository to queue for analysis |
| `GET` | `/api/repositories` | List all repositories for authenticated user |
| `GET` | `/api/repositories/overview` | Fetch aggregated user analytics & repository counts |
| `GET` | `/api/repositories/:id` | Get repository details & overview insights |
| `GET` | `/api/repositories/:id/status` | Get real-time processing status, stage, & errors |
| `POST` | `/api/repositories/:id/retry` | Re-queue a failed or stuck repository for analysis |
| `GET` | `/api/repositories/:id/graph` | Retrieve node and edge graph data for visualizer |
| `GET` | `/api/analytics/:id/impact` | Compute change impact analysis for a symbol |
| `GET` | `/api/analytics/:id/cycles` | Detect circular dependencies |
| `GET` | `/api/analytics/:id/call-path` | Trace call paths between symbols |
| `GET` | `/api/analytics/:id/activity` | Fetch recent analysis activity logs |

---

## 📚 Documentation

For deeper architectural details, query patterns, and user guides, visit the [CodeGraph Documentation](https://codegraph-client.vercel.app/docs).

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
