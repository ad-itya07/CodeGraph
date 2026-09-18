# CodeGraph 🚀

[Live Application](https://codegraph-client.vercel.app/) | [Documentation](https://codegraph-client.vercel.app/docs)

CodeGraph is a powerful full-stack application that helps developers visualize, analyze, and understand their codebase through interactive dependency graphs and insightful analytics. It automatically parses code repositories to extract symbols, relationships, and dependencies, presenting them in an intuitive visual interface.

## 🌟 Key Features

- **AST-Based Code Parsing**: Accurately parses JavaScript/TypeScript repositories using Babel to understand complex code structures.
- **Interactive Dependency Graphs**: Visualizes code relationships (functions, classes, variables, method calls) using an interactive node-based graph interface.
- **Repository Analytics**: Provides deep insights into code complexity, dead code, dependency chains, and architectural patterns.
- **Symbol & Relationship Extraction**: Automatically maps out cross-file and intra-file dependencies.
- **Scalable Processing**: Uses a robust backend with caching and database persistence for fast graph traversal and querying.

## 🛠 Tech Stack

### Frontend (Client)
- **Next.js (React 19)**: Framework for building scalable web applications.
- **React Flow (`@xyflow/react`)**: Powers the interactive node-based graph visualization.
- **Tailwind CSS & Radix UI**: For a beautiful, responsive, and accessible user interface.
- **React Query**: For efficient data fetching and state management.

### Backend (Server)
- **Node.js & Express**: High-performance RESTful API server.
- **PostgreSQL & Prisma**: Relational database and modern ORM for persistent data storage.
- **Redis**: Caching layer for lightning-fast graph query responses.
- **Babel**: AST parsing (`@babel/parser`, `@babel/traverse`) for extracting code structure and semantics.

## 🏗 Architecture Overview

1. **Parser Engine**: The backend consumes a repository, parsing its files into Abstract Syntax Trees (ASTs).
2. **Extraction Layer**: Specialized extractors identify symbols (classes, functions, etc.) and relationships (method calls, implementations, imports).
3. **Graph Persistence**: The extracted data is serialized and stored in PostgreSQL, with complex traversal results cached in Redis.
4. **Interactive UI**: The frontend requests graph data and renders it using React Flow, allowing developers to intuitively explore their codebase.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Redis

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd 21_CodeGraph
   ```

2. **Setup Backend (Server):**
   ```bash
   cd server
   npm install
   
   # Configure your .env file with DATABASE_URL, REDIS_URL, etc.
   # Example: cp .env.example .env
   
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup Frontend (Client):**
   ```bash
   cd ../client
   npm install
   
   # Configure your .env.local with the backend API URL if needed
   
   npm run dev
   ```

4. **Run the App:** 
   Open `http://localhost:3000` in your browser to view the application.

## 📚 Documentation
For detailed guides on how to use CodeGraph, understand graph querying, or read the API reference, please visit our [External Documentation](https://codegraph-client.vercel.app/docs).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
