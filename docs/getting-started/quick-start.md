# Quick Start

Get started with Appwrite ORM in just a few minutes.

## Define Your Schema

```typescript
import { TableDefinition } from 'appwrite-orm';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0, max: 120 },
    isActive: { type: 'boolean', default: true }
  }
};
```

## Server-Side Usage

Complete example for Node.js/backend applications with automatic schema migration:

```typescript
import { ServerORM, TableDefinition } from 'appwrite-orm/server';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    role: { type: ['admin', 'user'], default: 'user' }
  }
};

async function main() {
  // Initialize ORM with API key (server-side only)
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true // Automatically creates/updates collections
  });

  const db = await orm.init([userTable]);

  // Create
  const user = await db.users.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    role: 'admin'
  });

  // Read
  const allUsers = await db.users.all();
  const activeUsers = await db.users.query({ isActive: true });
  const specificUser = await db.users.get(user.$id);

  // Update
  await db.users.update(user.$id, { age: 31 });

  // Delete
  await db.users.delete(user.$id);
}

main().catch(console.error);
```

## Client-Side Usage

Complete example for browser/React/Vue applications:

```typescript
import { WebORM, TableDefinition } from 'appwrite-orm/web';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    bio: { type: 'string' }
  }
};

// Initialize ORM (no API key needed for client)
const orm = new WebORM({
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
});

const db = orm.init([userTable]);

// Create with validation
try {
  const user = await db.users.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    bio: 'Software developer'
  });
  
  console.log('User created:', user.$id);
} catch (error) {
  if (error instanceof ORMValidationError) {
    error.errors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}

// Query with filters
const youngUsers = await db.users.query(
  { age: { $lt: 30 } },
  { limit: 10, orderBy: ['-age'] }
);

// Update
await db.users.update(user.$id, { bio: 'Senior developer' });

// Delete
await db.users.delete(user.$id);
```

## Advanced Queries

Use Appwrite's Query builder for complex filtering:

```typescript
import { Query } from 'appwrite-orm';

// Complex filtering
const results = await db.users.find([
  Query.greaterThanEqual('age', 18),
  Query.lessThan('age', 65),
  Query.equal('role', 'user'),
  Query.orderDesc('age'),
  Query.limit(20)
]);

// Count documents
const count = await db.users.count({ role: 'admin' });
```

## Next Steps

- [Schema Definition](../guides/schema-definition.md) - Learn about advanced schema features
- [Querying Data](../guides/querying-data.md) - Master complex queries
- [Data Validation](../guides/data-validation.md) - Understand validation rules
- [API Reference](../api/overview.md) - Explore all available methods
