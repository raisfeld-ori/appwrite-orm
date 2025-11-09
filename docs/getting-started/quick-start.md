# Quick Start

This guide will help you create your first Appwrite ORM application in just a few minutes.

## Step 1: Define Your Schema

Create a table definition with your data structure:

```typescript
import { TableDefinition } from 'appwrite-orm';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0, max: 120 },
    isActive: { type: 'boolean', default: true },
    role: { type: ['admin', 'user', 'guest'], default: 'user' }
  }
};

const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true, size: 255 },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
    publishedAt: { type: 'Date' },
    isPublished: { type: 'boolean', default: false }
  }
};
```

## Step 2: Initialize the ORM

### For Server Applications

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true // Creates collections automatically
});

// Initialize with your tables
const db = await orm.init([userTable, postTable]);
```

### For Web Applications

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!
});

// Initialize with your tables
const db = orm.init([userTable, postTable]);
```

## Step 3: Perform CRUD Operations

### Create Records

```typescript
// Create a new user
const user = await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'user'
});

console.log('Created user:', user.$id);

// Create a post
const post = await db.posts.create({
  title: 'My First Post',
  content: 'This is the content of my first post.',
  authorId: user.$id,
  isPublished: true,
  publishedAt: new Date()
});
```

### Query Records

```typescript
// Get all active users
const activeUsers = await db.users.query({ isActive: true });

// Get user by ID
const specificUser = await db.users.get(user.$id);

// Get first admin user
const admin = await db.users.first({ role: 'admin' });

// Get published posts with pagination
const publishedPosts = await db.posts.query(
  { isPublished: true },
  { limit: 10, offset: 0, orderBy: ['-publishedAt'] }
);
```

### Update Records

```typescript
// Update user
const updatedUser = await db.users.update(user.$id, {
  age: 31,
  role: 'admin'
});

// Update post
const updatedPost = await db.posts.update(post.$id, {
  title: 'My Updated Post Title'
});
```

### Delete Records

```typescript
// Delete a post
await db.posts.delete(post.$id);

// Delete a user
await db.users.delete(user.$id);
```

## Step 4: Advanced Queries

### Complex Filtering

```typescript
import { Query } from 'appwrite-orm';

// Find users with complex queries
const youngAdults = await db.users.find([
  Query.greaterThanEqual('age', 18),
  Query.lessThan('age', 30),
  Query.equal('isActive', true)
]);

// Find recent posts
const recentPosts = await db.posts.find([
  Query.greaterThan('publishedAt', new Date('2024-01-01')),
  Query.orderDesc('publishedAt'),
  Query.limit(5)
]);
```

### Counting Records

```typescript
// Count active users
const activeUserCount = await db.users.count({ isActive: true });

// Count published posts
const publishedPostCount = await db.posts.count({ isPublished: true });
```

## Step 5: Error Handling

```typescript
import { ORMValidationError } from 'appwrite-orm';

try {
  // This will fail validation
  await db.users.create({
    name: '', // Required field is empty
    age: -5   // Below minimum value
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    console.log('Validation errors:');
    error.errors.forEach(err => {
      console.log(`- ${err.field}: ${err.message}`);
    });
  }
}
```

## Complete Example

Here's a complete working example:

```typescript
import { ServerORM, TableDefinition } from 'appwrite-orm';

// Define schema
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 }
  }
};

async function main() {
  // Initialize ORM
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true
  });

  const db = await orm.init([userTable]);

  // Create user
  const user = await db.users.create({
    name: 'Alice Smith',
    email: 'alice@example.com',
    age: 28
  });

  // Query users
  const users = await db.users.all();
  console.log(`Found ${users.length} users`);

  // Update user
  await db.users.update(user.$id, { age: 29 });

  // Clean up
  await db.users.delete(user.$id);
}

main().catch(console.error);
```

## Next Steps

- [Schema Definition](../guides/schema-definition.md) - Learn about advanced schema features
- [Querying Data](../guides/querying-data.md) - Master complex queries
- [Data Validation](../guides/data-validation.md) - Understand validation rules
- [API Reference](../api/overview.md) - Explore all available methods