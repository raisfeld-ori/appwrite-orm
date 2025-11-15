# Development Mode (Web)

Test your application without an Appwrite backend using cookie-based storage.

## What is Development Mode?

Development mode lets you use the full ORM API without connecting to Appwrite. Data is stored in browser cookies, perfect for:

- Quick prototyping
- Testing UI components
- Learning the ORM API
- Demos and presentations

## Enable Development Mode

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'http://localhost',  // Can be anything
  projectId: 'dev',
  databaseId: 'test-db',
  development: true  // Enable development mode
});

const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    published: { type: 'boolean', default: false }
  }
}]);
```

## Full API Support

All CRUD operations work the same:

```typescript
// Create
const post = await db.table('posts').create({
  title: 'Test Post',
  content: 'This is stored in cookies!'
});

// Read
const allPosts = await db.table('posts').all();
const post = await db.table('posts').get(post.$id);

// Update
await db.table('posts').update(post.$id, {
  title: 'Updated Title'
});

// Delete
await db.table('posts').delete(post.$id);

// Query
const posts = await db.table('posts').query({ published: true });
```

## Limitations

### Storage Size

Data is stored in browser cookies with a ~4KB recommended limit:

```typescript
// ✅ Good for development
const tasks = await db.table('tasks').create({
  title: 'Buy groceries',
  completed: false
});

// ❌ Too much data
const largePost = await db.table('posts').create({
  content: 'A'.repeat(10000) // Exceeds cookie size
});
```

### Simplified Queries

Advanced Appwrite queries are simplified:

```typescript
import { Query } from 'appwrite';

// ✅ Works in dev mode
await db.table('posts').query({ published: true });
await db.table('posts').count({ published: true });

// ⚠️ Simplified in dev mode
await db.table('posts').find([
  Query.greaterThan('views', 100)  // Less accurate than production
]);
```

### No Authentication

Development mode has no user authentication or permissions.

### Data Persistence

Data only persists in the current browser and can be cleared:

```typescript
// Clear all development data
db.clearAll();
```

## Use Cases

### Prototyping

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'prototype',
  databaseId: 'app-db',
  development: true
});

const db = await orm.init([{
  name: 'todos',
  schema: {
    text: { type: 'string', required: true },
    completed: { type: 'boolean', default: false }
  }
}]);

// Build your UI without backend setup
```

### Testing Components

```typescript
// In your test file
import { WebORM } from 'appwrite-orm/web';

const db = await new WebORM({
  endpoint: 'test',
  projectId: 'test',
  databaseId: 'test',
  development: true
}).init([/* schemas */]);

// Test component with real-looking API calls
```

## Switching to Production

Simply change the configuration:

```typescript
// Development
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'test',
  development: true
});

// Production (same code, different config)
const orm = new WebORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  development: false  // or omit (default is false)
});
```

## Next Steps

- [Setup](setup.md) - Configure for production
- [CRUD Operations](crud-operations.md) - Basic operations
- [Queries](queries.md) - Query data
