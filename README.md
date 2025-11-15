<div align="center">
  <img src="logo.png" alt="Appwrite ORM Logo" width="200"/>
  <h1>Appwrite ORM</h1>
</div>

[![npm version](https://badge.fury.io/js/appwrite-orm.svg)](https://www.npmjs.com/package/appwrite-orm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, type-safe TypeScript ORM for Appwrite with automatic migrations, schema validation, indexes, and join support. Works seamlessly in both server-side (Node.js) and client-side (browser) environments.

[📚 Full Documentation](https://appwrite-orm.readthedocs.io) | [🐛 Report Bug](https://github.com/raisfeld-ori/appwrite-orm/issues) | [✨ Request Feature](https://github.com/raisfeld-ori/appwrite-orm/issues)

## 📦 Installation

```bash
# For server-side (Node.js)
npm install appwrite-orm node-appwrite

# For client-side (browser)
npm install appwrite-orm appwrite
```

## 🚀 Quick Start

### Server-Side (Node.js)

```typescript
import { ServerORM } from 'appwrite-orm/server';
import { Query } from 'node-appwrite';

// Define your interface for type-safe responses
interface User {
  $id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user';
}

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true // Auto-creates collections and indexes
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 },
    role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' }
  },
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] },
    { key: 'age_idx', type: 'key', attributes: ['age'] }
  ]
}]);

// Type-safe CRUD operations
const user = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
}) as User;

// Advanced queries
const adults = await db.table('users').find([
  Query.greaterThanEqual('age', 18),
  Query.orderDesc('age'),
  Query.limit(10)
]) as User[];

// Join operations
const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);
```

### Client-Side (Browser/React/Vue)

```typescript
import { WebORM } from 'appwrite-orm/web';
import { Query } from 'appwrite';

interface Post {
  $id: string;
  title: string;
  content: string;
  published: boolean;
  views: number;
}

const orm = new WebORM({
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
});

const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    views: { type: 'integer', default: 0 },
    published: { type: 'boolean', default: false }
  }
}]);

// Type-safe queries
const posts = await db.table('posts').query({ published: true }) as Post[];
const topPosts = await db.table('posts').find([
  Query.greaterThan('views', 100),
  Query.orderDesc('views')
]) as Post[];
```

### Development Mode (Browser Only)

For rapid prototyping and testing without an Appwrite backend, use development mode with cookie-based storage:

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'http://localhost',  // Can be any string in dev mode
  projectId: 'dev',
  databaseId: 'my-dev-db',
  development: true  // Enable development mode
});

const db = await orm.init([{
  name: 'tasks',
  schema: {
    title: { type: 'string', required: true },
    completed: { type: 'boolean', default: false }
  }
}]);

// Works exactly like the real API, but data is stored in browser cookies
const task = await db.table('tasks').create({
  title: 'Test development mode',
  completed: false
});

// Clear all development data
db.clearAll();
```

**Note:** Development mode has limitations:

- Data is stored in cookies (4KB limit recommended)
- Advanced Appwrite queries are simplified
- No authentication or permissions
- Data persists only in the current browser
- Perfect for prototyping, testing, and demos

## 🎯 Core Features

### Type-Safe Interfaces

Define TypeScript interfaces for your collections and get full type safety:

```typescript
interface Product {
  $id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const products = await db.table('products').all() as Product[];
// TypeScript knows the exact shape of each product
```

### Index Management

Create indexes for optimized queries:

```typescript
// During initialization
{
  name: 'products',
  schema: { /* ... */ },
  indexes: [
    { key: 'price_idx', type: 'key', attributes: ['price'], orders: ['ASC'] },
    { key: 'name_search', type: 'fulltext', attributes: ['name'] }
  ]
}

// Dynamically create indexes
await db.table('products').createIndex({
  key: 'category_idx',
  type: 'key',
  attributes: ['category']
});

// List indexes
const indexes = await db.table('products').listIndexes();
```

### Join Operations

Query related data across collections:

```typescript
// Left join - includes all records from first collection
const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);

// Inner join - only records with matches in both collections
const postsWithComments = await db.innerJoin(
  'posts',
  'comments',
  { foreignKey: '$id', referenceKey: 'postId', as: 'comments' }
);

// Join with filters
const activeUsersWithPosts = await db.join(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' },
  { isActive: true }, // Filter for first collection
  { published: true }  // Filter for second collection
);
```

### Schema Validation

Built-in validation ensures data integrity:

```typescript
{
  name: 'users',
  schema: {
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'integer', min: 18, max: 120 },
    role: { type: ['admin', 'user'], enum: ['admin', 'user'] },
    balance: { type: 'float', min: 0 }
  }
}
```

### Query Methods

Rich query API for all your needs:

```typescript
// Basic queries
await db.table('users').get(id);           // Get by ID
await db.table('users').getOrFail(id);     // Get or throw error
await db.table('users').all();             // Get all documents
await db.table('users').first({ age: 25 }); // Get first match
await db.table('users').count({ isActive: true }); // Count documents

// Advanced queries
await db.table('users').find([
  Query.equal('role', ['admin']),
  Query.greaterThan('age', 21),
  Query.orderAsc('name'),
  Query.limit(10),
  Query.offset(20)
]);

// Pagination
await db.table('users').all({ limit: 10, offset: 20 });

// Ordering
await db.table('users').all({ orderBy: ['-createdAt', 'name'] });

// Field selection
await db.table('users').all({ select: ['name', 'email'] });
```

### Bulk Operations (Server-Side Only)

Efficiently handle multiple documents:

```typescript
// Bulk create
await db.table('users').bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
]);

// Bulk update
await db.table('users').bulkUpdate([
  { id: 'id1', data: { isActive: true } },
  { id: 'id2', data: { isActive: false } }
]);

// Bulk delete
await db.table('users').bulkDelete(['id1', 'id2', 'id3']);
```

## 📖 Documentation

- [Installation Guide](https://appwrite-orm.readthedocs.io/getting-started/installation/)
- [Quick Start Tutorial](https://appwrite-orm.readthedocs.io/getting-started/quick-start/)
- [Schema Definition](https://appwrite-orm.readthedocs.io/guides/schema-definition/)
- [Querying Data](https://appwrite-orm.readthedocs.io/guides/querying-data/)
- [Data Validation](https://appwrite-orm.readthedocs.io/guides/data-validation/)
- [API Reference](https://appwrite-orm.readthedocs.io/api/overview/)

## 🧪 Testing

The package includes comprehensive integration tests that use real Appwrite API (no mocks):

```bash
# Set up your .env file with Appwrite credentials
cp .env.example .env

# Run integration tests
npm run test:integration

# Run all tests
npm test
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/raisfeld-ori/appwrite-orm/blob/main/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for [Appwrite](https://appwrite.io) - The open-source backend-as-a-service
- Inspired by popular ORMs like TypeORM, Prisma, and SQLAlchemy

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/appwrite-orm)
- [GitHub Repository](https://github.com/raisfeld-ori/appwrite-orm)
- [Documentation](https://appwrite-orm.readthedocs.io)
- [Appwrite](https://appwrite.io)

---

Made with ❤️ by [Ori Raisfeld](https://github.com/raisfeld-ori)
