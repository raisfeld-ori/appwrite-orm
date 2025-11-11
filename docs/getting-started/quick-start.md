# Quick Start

Get started with Appwrite ORM in minutes.

## Server-Side (Node.js)

```typescript
import { ServerORM } from 'appwrite-orm/server';
import { Query } from 'node-appwrite';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true // Auto-creates collections
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 },
    balance: { type: 'float', default: 0 },
    role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' }
  }
}]);

// Create
const user = await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  balance: 100.50
});

// Query
const allUsers = await db.users.all();
const activeUsers = await db.users.query({ role: 'admin' });

// Advanced queries with Query builder
const adults = await db.users.find([
  Query.greaterThanEqual('age', 18),
  Query.orderDesc('balance'),
  Query.limit(10)
]);

// Update & Delete
await db.users.update(user.$id, { balance: 200.75 });
await db.users.delete(user.$id);
```

## Client-Side (Browser/React/Vue)

```typescript
import { WebORM } from 'appwrite-orm/web';
import { Query } from 'appwrite';

const orm = new WebORM({
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
});

const db = orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    views: { type: 'integer', default: 0 },
    published: { type: 'boolean', default: false }
  }
}]);

// CRUD operations
const post = await db.posts.create({
  title: 'My First Post',
  content: 'Hello world!'
});

const posts = await db.posts.query({ published: true });
await db.posts.update(post.$id, { views: 42 });
```

## Important: Integer vs Float

Use explicit types for numbers:

```typescript
schema: {
  age: { type: 'integer' },      // Whole numbers
  price: { type: 'float' },      // Decimals
  count: { type: 'integer' },
  balance: { type: 'float' }
}
```

## Next Steps

- [Schema Definition](../guides/schema-definition.md)
- [Querying Data](../guides/querying-data.md)
- [Data Validation](../guides/data-validation.md)
