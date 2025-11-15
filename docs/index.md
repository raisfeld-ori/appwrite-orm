# Appwrite ORM

A type-safe TypeScript ORM for Appwrite that works in both Node.js and browsers.

## What is it?

Appwrite ORM provides a simple way to work with Appwrite databases using TypeScript. Define your schemas once, get type safety everywhere, and let the ORM handle the rest.

## Quick Example

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'my-database',
  apiKey: 'api-key',
  autoMigrate: true
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer' }
  }
}]);

// Create a user
const user = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Query users
const users = await db.table('users').query({ age: 30 });
```

## Choose Your Environment

- **[Node.js/Server →](server/setup.md)** - For backend applications with full migration support
- **[Web/Client →](web/setup.md)** - For frontend applications in React, Vue, or vanilla JS

## Installation

```bash
# For Node.js
npm install appwrite-orm node-appwrite

# For Web
npm install appwrite-orm appwrite
```

## Next Steps

- [Getting Started](getting-started/quickstart.md) - Install and configure
- [Server Guide](server/setup.md) - Node.js backend usage
- [Web Guide](web/setup.md) - Browser/frontend usage
