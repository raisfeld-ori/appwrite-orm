# Appwrite ORM

A TypeScript ORM for Appwrite with type-safe schemas and auto-migration.

[📚 Full Documentation](https://appwrite-orm.readthedocs.io)

## Installation

```bash
npm install appwrite-orm node-appwrite  # For server
npm install appwrite-orm appwrite       # For web
```

## Quick Start

### Server (Node.js)

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

// CRUD
const user = await db.users.create({ name: 'John', email: 'john@example.com', age: 30 });
const users = await db.users.query({ isActive: true });
await db.users.update(user.$id, { age: 31 });
await db.users.delete(user.$id);
```

### Web (Browser)

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
});

const db = orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    views: { type: 'integer', default: 0 },
    published: { type: 'boolean', default: false }
  }
}]);

const post = await db.posts.create({ title: 'My Post' });
```

## Key Features

- **Type-safe schemas** with TypeScript inference
- **Auto-migration** on server (creates/updates collections)
- **Integer & Float types** - use `'integer'` or `'float'` instead of generic `'number'`
- **Data validation** with detailed error messages
- **Query builder** using Appwrite Query helpers
- **Separate SDKs** for web and server

## Field Types

```typescript
{
  // Strings
  name: { type: 'string', required: true, size: 100 },
  
  // Numbers
  age: { type: 'integer', min: 0, max: 150 },
  price: { type: 'float', min: 0 },
  
  // Boolean
  isActive: { type: 'boolean', default: true },
  
  // Date
  createdAt: { type: 'Date' },
  
  // Enum
  role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' },
  
  // Arrays
  tags: { type: 'string', array: true }
}
```

## License

MIT
