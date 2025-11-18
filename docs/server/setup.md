# Server/Node.js Setup

Use Appwrite ORM in your Node.js backend applications.

## Installation

```bash
npm install appwrite-orm node-appwrite
```

## Basic Setup

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key',
  autoMigrate: true  // Creates collections automatically
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 }
  }
}]);
```

## Define Your Schema

```typescript
const db = await orm.init([
  {
    name: 'users',
    schema: {
      name: { type: 'string', required: true, size: 255 },
      email: { type: 'string', required: true, size: 255 },
      age: { type: 'integer', min: 0, max: 120 },
      role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' },
      balance: { type: 'float', default: 0, min: 0 }
    },
    indexes: [
      { key: 'email_idx', type: 'unique', attributes: ['email'] },
      { key: 'age_idx', type: 'key', attributes: ['age'] }
    ]
  },
  {
    name: 'posts',
    schema: {
      userId: { type: 'string', required: true },
      title: { type: 'string', required: true },
      content: { type: 'string', required: true },
      published: { type: 'boolean', default: false }
    }
  }
]);
```

## Auto Migration

When `autoMigrate: true`, the ORM will:

1. Create collections if they don't exist
2. Add missing attributes to existing collections
3. Create indexes defined in your schema
4. Preserve existing data

```typescript
const orm = new ServerORM({
  // ... connection config
  autoMigrate: true  // Safe for development and production
});
```

## Manual Migration

If you prefer manual control:

```typescript
const orm = new ServerORM({
  // ... connection config
  autoMigrate: false,    // Don't auto-migrate
  autoValidate: false    // Skip validation too
});

// Collections must exist in Appwrite
const db = await orm.init([/* schemas */]);
```

## Environment Setup

Create a `.env` file:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
```

Use in your code:

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});
```

## Express.js Example

```typescript
import express from 'express';
import { ServerORM } from 'appwrite-orm/server';

const app = express();
app.use(express.json());

// Initialize ORM
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
    email: { type: 'string', required: true }
  }
}]);

// Routes
app.get('/users', async (req, res) => {
  const users = await db.table('users').all();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = await db.table('users').create(req.body);
  res.json(user);
});

app.listen(3000);
```

## Next Steps

- [CRUD Operations](crud-operations.md) - Create, read, update, delete data
- [Queries](queries.md) - Filter and search data
- [Joins](joins.md) - Work with related data
- [Bulk Operations](bulk-operations.md) - Efficient batch operations
- [Indexes](indexes.md) - Optimize query performance
- [Migrations](migrations.md) - Export schemas to SQL, Firebase, or text
- [Caching](caching.md) - The Built-in caching system
- [Realtime Listeners](listeners.md) - Real-time event handling
