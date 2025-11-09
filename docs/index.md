# Appwrite ORM

A powerful TypeScript ORM package for Appwrite with separate web and server implementations, providing type-safe database operations with automatic validation and migration support.

## Features

- **Type Safety**: Full TypeScript support with automatic type inference from schema definitions
- **Dual Environment**: Separate optimized implementations for web browsers and Node.js servers
- **Automatic Validation**: Built-in data validation based on your schema definitions
- **Migration Support**: Automatic database schema migration for server environments
- **SQLAlchemy-inspired API**: Familiar query patterns for developers coming from Python/SQLAlchemy
- **Comprehensive Error Handling**: Detailed error messages and custom error types

## Quick Example

```typescript
import { ServerORM, TableDefinition } from 'appwrite-orm';

// Define your table schema
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    isActive: { type: 'boolean', default: true }
  }
};

// Initialize ORM
const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key',
  autoMigrate: true
});

// Initialize with tables
const db = await orm.init([userTable]);

// Use the ORM
const user = await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

const users = await db.users.query({ isActive: true });
```

## Architecture

The Appwrite ORM is designed with a modular architecture:

- **Shared Core**: Common types, validation, and base table operations
- **Web Implementation**: Browser-optimized with client-side validation
- **Server Implementation**: Node.js optimized with migration and administrative capabilities

## Package Exports

The package provides multiple entry points for different use cases:

- `appwrite-orm` - Main package with all exports
- `appwrite-orm/web` - Web-only exports for browser environments
- `appwrite-orm/server` - Server-only exports for Node.js environments

## Getting Started

1. [Installation](getting-started/installation.md) - Install the package and dependencies
2. [Configuration](getting-started/configuration.md) - Set up your Appwrite connection
3. [Quick Start](getting-started/quick-start.md) - Build your first ORM application

## API Documentation

- [Shared Types](api/shared-types.md) - Common types and interfaces
- [Web ORM](api/web-orm.md) - Browser-specific ORM implementation
- [Server ORM](api/server-orm.md) - Node.js-specific ORM implementation
- [Table Operations](api/table-operations.md) - CRUD and query operations
- [Validation](api/validation.md) - Data validation system
- [Migration](api/migration.md) - Schema migration utilities