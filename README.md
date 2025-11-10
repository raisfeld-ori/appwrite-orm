# Appwrite ORM

A TypeScript ORM package for Appwrite with separate web and server implementations.
For more documentation, go [read the docs](https://appwrite-orm.readthedocs.io)

## Installation

```bash
npm install appwrite-orm appwrite
```

## Usage

### Usage (Client / Web)

```typescript
import { WebTable, ORMConfig, WebORM } from 'appwrite-orm';

// Step 1: create your tables
const testDatabase: WebTable = {
  name: 'test-collection',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    isActive: { type: 'boolean', default: true }
  }
};

// step 2: create your ORM config
const config: ORMConfig = {
  endpoint: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key-for-server',
  tables: [testDatabase],
};

// Step 3: create your ORM instance
const webORM = new WebORM(config);
```

### Usage (Server / Nodejs)

```typescript
import { ServerTable, ORMConfig, ServerORM } from 'appwrite-orm';

// Step 1: create your tables
const testDatabase: ServerTable = {
  name: 'test-collection',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    isActive: { type: 'boolean', default: true }
  }
};

// step 2: create your ORM config
const config: ORMConfig = {
  endpoint: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key-for-server',
  tables: [testDatabase],
  autoMigrate: true, // this will make the ORM autometically create/modify the table to fit. Not reccomended in production code, and especially not on the main appwrite server
};

// Step 3: create your ORM instance
const webORM = new ServerORM(config);
```

The server ORM will autometically validate your code, and will either throw an error or Migrate the table

## Contributing

1. Fork the repository
2. Create an appwrite project for testing, and place a .env according to .env.example
3. Create a fork or a branch for your changes
4. Create a pull request

Feel free to also send stuff in discussions on github. This is the first package the I am actually
planning on fully continuing and working on. I just really hate working with dashboards and having to guess the DB structure

## Future plans

Idk fully for now, cause I still haven't thought about where to take this package, but I'd like to fix my biggest issues with appwrite (so far):

1. More types for objects: I want to add support for things like the type domain or the type regex
2. Better sample mock data: Appwrite makes really bad mock data (assumes all 255 strings are names, keeps a lot of things null). I'd like to make some system for this
3. Caching: redis has no caching, and on top of it- it's so difficult to implement redis into their nextjs servers that it's not worth it. I know it's not standard for an ORM to have caching but I want to find a way
4. Free database: appwrite is 100% open source and *can* be self hosted, but it's very difficult. Currently I am just using my paid appwrite account, but in the future I plan on making a configuration for this project that uses SQLite or a minimal version of appwrite to make a free database

## License

MIT License - see [https://github.com/raisfeld-ori/appwrite-orm/blob/main/LICENSE](LICENSE) for details.
