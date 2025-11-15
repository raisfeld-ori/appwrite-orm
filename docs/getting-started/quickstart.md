# Quickstart

Get started with Appwrite ORM in under 5 minutes.

## Installation

Choose based on your environment:

### For Node.js (Backend)

```bash
npm install appwrite-orm node-appwrite
```

### For Web (Browser)

```bash
npm install appwrite-orm appwrite
```

## Basic Setup

### Server (Node.js)

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key',
  autoMigrate: true // Creates collections automatically
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
}]);
```

### Web (Browser)

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id'
});

const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  }
}]);
```

## First Operations

```typescript
// Create
const doc = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Read
const allUsers = await db.table('users').all();
const user = await db.table('users').get(doc.$id);

// Update
await db.table('users').update(doc.$id, { name: 'Jane Doe' });

// Delete
await db.table('users').delete(doc.$id);
```

## Next Steps

- [Configuration Options](configuration.md)
- [What's Supported](supported-features.md)
- Server: [Server Setup Guide](../server/setup.md)
- Web: [Web Setup Guide](../web/setup.md)
