# Server ORM API

The Server ORM provides Node.js-optimized database operations with migration support, administrative capabilities, and server-side validation.

## ServerORM Class

Main ORM class for server applications with migration and administrative features.

```typescript
class ServerORM {
  constructor(config: ORMConfig);
  async init<T extends TableDefinition[]>(tables: T): Promise<ServerORMInstance<T>>;
}
```

### Constructor

Creates a new ServerORM instance with the provided configuration.

```typescript
constructor(config: ORMConfig)
```

**Parameters:**

- `config`: Configuration object including API key for server operations

**Throws:**

- `Error`: If API key is missing or configuration is invalid

**Example:**

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db',
  apiKey: 'your-api-key',
  autoMigrate: true
});
```

### init()

Initializes the ORM with table definitions, optionally running migrations.

```typescript
async init<T extends TableDefinition[]>(tables: T): Promise<ServerORMInstance<T>>
```

**Parameters:**

- `tables`: Array of table definitions

**Returns:**

- `Promise<ServerORMInstance<T>>`: Typed ORM instance with table access

**Example:**

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

const db = await orm.init([userTable]);
// Collections are created/updated if autoMigrate is true
```

## ServerORMInstance Class

Initialized server ORM instance providing access to table operations and administrative features.

```typescript
class ServerORMInstance<T extends TableDefinition[]> {
  // Dynamic table properties based on table definitions
  [K in T[number]['name']]: ServerTable<ExtractSchema<T, K>>;
}
```

### Properties

The instance dynamically creates properties for each table defined during initialization:

```typescript
const db = await orm.init([userTable, postTable]);

// Available properties:
db.users  // ServerTable<UserSchema>
db.posts  // ServerTable<PostSchema>
```

## ServerTable Class

Server-specific implementation of table operations with enhanced capabilities.

```typescript
class ServerTable<T extends DatabaseSchema> extends BaseTable<T> {
  // Inherits all BaseTable methods
  // Server-specific features and optimizations
}
```

### Inherited Methods

ServerTable inherits all methods from [BaseTable](table-operations.md):

- CRUD operations: `create()`, `get()`, `update()`, `delete()`
- Query operations: `query()`, `all()`, `first()`, `count()`
- Advanced queries: `find()`, `findOne()`

### Server-Specific Features

#### Enhanced Performance

- Server-side validation and processing
- Optimized for high-throughput operations
- Direct database access without client limitations

#### Administrative Operations

Access to collection management and migration features through the Migration class.

## Migration Class

Handles database schema migrations and collection management.

```typescript
class Migration {
  constructor(databases: Databases, config: ORMConfig);
  
  async migrate(tables: TableDefinition[]): Promise<void>;
  async createCollection(table: TableDefinition): Promise<void>;
  async updateCollection(table: TableDefinition): Promise<void>;
  async createAttribute(collectionId: string, key: string, field: DatabaseField): Promise<void>;
  async updateAttribute(collectionId: string, key: string, field: DatabaseField): Promise<void>;
}
```

### migrate()

Runs complete migration for all provided tables.

```typescript
async migrate(tables: TableDefinition[]): Promise<void>
```

**Parameters:**

- `tables`: Array of table definitions to migrate

**Example:**

```typescript
const migration = new Migration(databases, config);
await migration.migrate([userTable, postTable]);
```

### createCollection()

Creates a new collection with all attributes.

```typescript
async createCollection(table: TableDefinition): Promise<void>
```

**Parameters:**

- `table`: Table definition to create

### updateCollection()

Updates an existing collection to match the schema.

```typescript
async updateCollection(table: TableDefinition): Promise<void>
```

**Parameters:**

- `table`: Updated table definition

### createAttribute()

Adds a new attribute to an existing collection.

```typescript
async createAttribute(collectionId: string, key: string, field: DatabaseField): Promise<void>
```

**Parameters:**

- `collectionId`: Target collection ID
- `key`: Attribute name
- `field`: Field definition

### updateAttribute()

Updates an existing attribute (limited by Appwrite capabilities).

```typescript
async updateAttribute(collectionId: string, key: string, field: DatabaseField): Promise<void>
```

## AttributeManager Class

Manages Appwrite attribute creation and updates.

```typescript
class AttributeManager {
  constructor(databases: Databases);
  
  async createAttribute(databaseId: string, collectionId: string, key: string, field: DatabaseField): Promise<void>;
  async getAttribute(databaseId: string, collectionId: string, key: string): Promise<any>;
  async deleteAttribute(databaseId: string, collectionId: string, key: string): Promise<void>;
}
```

### createAttribute()

Creates a new attribute in Appwrite with proper type mapping.

```typescript
async createAttribute(databaseId: string, collectionId: string, key: string, field: DatabaseField): Promise<void>
```

**Parameters:**

- `databaseId`: Database identifier
- `collectionId`: Collection identifier
- `key`: Attribute name
- `field`: Field definition with constraints

**Example:**

```typescript
const attrManager = new AttributeManager(databases);

await attrManager.createAttribute('main-db', 'users', 'email', {
  type: 'string',
  required: true,
  size: 255
});
```

## PermissionManager Class

Manages collection permissions and access control.

```typescript
class PermissionManager {
  constructor(databases: Databases);
  
  async setCollectionPermissions(databaseId: string, collectionId: string, permissions: string[]): Promise<void>;
  async getCollectionPermissions(databaseId: string, collectionId: string): Promise<string[]>;
}
```

### setCollectionPermissions()

Sets permissions for a collection.

```typescript
async setCollectionPermissions(databaseId: string, collectionId: string, permissions: string[]): Promise<void>
```

**Parameters:**

- `databaseId`: Database identifier
- `collectionId`: Collection identifier
- `permissions`: Array of permission strings

**Example:**

```typescript
const permManager = new PermissionManager(databases);

await permManager.setCollectionPermissions('main-db', 'users', [
  'role:all',
  'role:member'
]);
```

## Usage Examples

### Basic Server Setup

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

async function initializeDatabase() {
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true
  });

  const db = await orm.init([userTable]);
  return db;
}
```

### Express.js API Integration

```typescript
import express from 'express';
import { ServerORM, ORMValidationError } from 'appwrite-orm/server';

const app = express();
app.use(express.json());

let db: any;

// Initialize database
async function setupDatabase() {
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true
  });

  db = await orm.init([userTable]);
}

// API Routes
app.post('/users', async (req, res) => {
  try {
    const user = await db.users.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ORMValidationError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await db.users.all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.users.get(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Start server
setupDatabase().then(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
});
```

### Manual Migration

```typescript
import { Migration } from 'appwrite-orm/server';

async function runMigration() {
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: false // Disable auto-migration
  });

  // Get databases instance
  const databases = (orm as any).databases;
  const migration = new Migration(databases, {
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!
  });

  // Run migration manually
  await migration.migrate([userTable, postTable]);
  console.log('Migration completed');
}
```

### Batch Operations

```typescript
async function batchCreateUsers(userData: any[]) {
  const results = [];
  
  for (const data of userData) {
    try {
      const user = await db.users.create(data);
      results.push({ success: true, user });
    } catch (error) {
      results.push({ success: false, error: error.message, data });
    }
  }
  
  return results;
}

// Usage
const users = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Smith', email: 'jane@example.com' }
];

const results = await batchCreateUsers(users);
```

### Advanced Query Operations

```typescript
import { Query } from 'appwrite-orm/server';

async function getActiveAdultUsers() {
  return await db.users.find([
    Query.equal('isActive', true),
    Query.greaterThanEqual('age', 18),
    Query.orderDesc('createdAt'),
    Query.limit(50)
  ]);
}

async function getUserStats() {
  const totalUsers = await db.users.count();
  const activeUsers = await db.users.count({ isActive: true });
  const adminUsers = await db.users.count({ role: 'admin' });
  
  return {
    total: totalUsers,
    active: activeUsers,
    admins: adminUsers,
    inactive: totalUsers - activeUsers
  };
}
```

## Environment Variables

Server applications should use environment variables for configuration:

```bash
# .env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-server-api-key
NODE_ENV=development
```

## Error Handling

```typescript
import { ORMValidationError, ORMMigrationError } from 'appwrite-orm/server';

try {
  await db.users.create(userData);
} catch (error) {
  if (error instanceof ORMValidationError) {
    // Handle validation errors
    console.log('Validation failed:', error.errors);
  } else if (error instanceof ORMMigrationError) {
    // Handle migration errors
    console.log('Migration failed:', error.message);
  } else {
    // Handle other errors
    console.log('Unexpected error:', error);
  }
}
```

## Performance Considerations

- Use batch operations for multiple records
- Implement proper indexing in Appwrite
- Use pagination for large datasets
- Cache frequently accessed data
- Monitor query performance

## Security Best Practices

- Store API keys securely (environment variables)
- Use least-privilege permissions
- Validate all input data
- Implement rate limiting
- Log security events
- Regular security audits

## Next Steps

- [Table Operations](table-operations.md) - Master CRUD and query operations
- [Migration](migration.md) - Learn about schema migrations
- [Validation](validation.md) - Understand server-side validation