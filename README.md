![Appwrite ORM Logo](https://raw.githubusercontent.com/raisfeld-ori/appwrite-orm/main/logo.png)

# Appwrite ORM

[![npm version](https://badge.fury.io/js/appwrite-orm.svg)](https://www.npmjs.com/package/appwrite-orm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, type-safe TypeScript ORM for Appwrite with automatic migrations, schema validation, indexes, and join support. Works seamlessly in both server-side (Node.js) and client-side (browser) environments.

🌐 **[Try the Interactive Demo](https://appwrite-orm.online)** - Experience Appwrite ORM in action with live examples!

## Features

- Environment: The ORM works for both web Client AND for nodejs servers
- Server migration: Migrate your database schema into Appwrite, SQL, Firebase, or just text
- Caching: Want to optimize your queries? Appwrite ORM autometically handles caching to possibly reduce database loads

## Setup

### Installation

```bash
# For server-side (Node.js)
npm install appwrite-orm node-appwrite

# For client-side (browser)
npm install appwrite-orm appwrite
```

## How to Run

### Server-Side Example

```typescript
import { ServerORM } from 'appwrite-orm/server';
import { Query } from 'node-appwrite';

interface User {
  $id: string;
  name: string;
  email: string;
  age: number;
}

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
    age: { type: 'integer', min: 0 }
  },
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] }
  ]
}]);

// Create user
const user = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
}) as User;

// Query users
const adults = await db.table('users').find([
  Query.greaterThanEqual('age', 18),
  Query.orderDesc('age')
]) as User[];
```

### Client-Side Example

```typescript
import { WebORM } from 'appwrite-orm/web';

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
    published: { type: 'boolean', default: false }
  }
}]);

const posts = await db.table('posts').query({ published: true });
```

### Development Mode

For testing without Appwrite backend:

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'my-dev-db',
  development: true  // Uses cookie storage
});
```

## Testing

```bash
# Set up environment
cp .env.example .env

# Run tests
npm test

# Run integration tests
npm run test:integration
```

## Documentation

- [Interactive Demo](https://appwrite-orm.online) - Try it live in your browser
- [Full Documentation](https://appwrite-orm.readthedocs.io)
- [API Reference](https://appwrite-orm.readthedocs.io/api/overview/)
- [GitHub Repository](https://github.com/raisfeld-ori/appwrite-orm)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built for [Appwrite](https://appwrite.io) - The open-source backend-as-a-service platform.

Made with ❤️ by [Ori Raisfeld](https://github.com/raisfeld-ori)
