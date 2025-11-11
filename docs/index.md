# Appwrite ORM

A TypeScript ORM for Appwrite with type-safe schemas and auto-migration.

## Features

- **Type-safe schemas** with TypeScript inference
- **Auto-migration** on server (creates/updates collections)
- **Integer & Float types** - explicit `'integer'` and `'float'` support
- **Data validation** with detailed error messages
- **Dual environments** - optimized for web and server

## Quick Example

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 },
    balance: { type: 'float', default: 0 },
    isActive: { type: 'boolean', default: true }
  }
}]);

// CRUD operations
const user = await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

const users = await db.users.query({ isActive: true });
await db.users.update(user.$id, { age: 31 });
```

## Getting Started

1. [Installation](getting-started/installation.md)
2. [Quick Start](getting-started/quick-start.md)
3. [Configuration](getting-started/configuration.md)

## Guides

- [Schema Definition](guides/schema-definition.md) - Define schemas with integer/float types
- [Querying Data](guides/querying-data.md) - Query and filter data
- [Data Validation](guides/data-validation.md) - Validation rules

## API Reference

- [Server ORM](api/server-orm.md) - Node.js server API
- [Web ORM](api/web-orm.md) - Browser client API
- [Table Operations](api/table-operations.md) - CRUD methods
- [Migration](api/migration.md) - Auto-migration system