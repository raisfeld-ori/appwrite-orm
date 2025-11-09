# Migration System

The migration system (server-only) provides automated database schema management, allowing you to create and update Appwrite collections based on your table definitions.

## Migration Class

Core migration functionality for schema management.

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

### Constructor

Creates a new Migration instance.

```typescript
constructor(databases: Databases, config: ORMConfig)
```

**Parameters:**

- `databases`: Appwrite Databases instance
- `config`: ORM configuration

**Example:**

```typescript
import { Migration } from 'appwrite-orm/server';

const migration = new Migration(databases, {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db'
});
```

### migrate()

Runs complete migration for all provided tables.

```typescript
async migrate(tables: TableDefinition[]): Promise<void>
```

**Parameters:**

- `tables`: Array of table definitions to migrate

**Process:**

1. Checks if collections exist
2. Creates missing collections
3. Updates existing collections with schema changes
4. Adds new attributes
5. Updates existing attributes (where possible)

**Example:**

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  }
};

await migration.migrate([userTable, postTable]);
```

### createCollection()

Creates a new collection with all attributes.

```typescript
async createCollection(table: TableDefinition): Promise<void>
```

**Parameters:**

- `table`: Table definition to create

**Process:**

1. Creates the collection in Appwrite
2. Adds all attributes defined in the schema
3. Sets up permissions (if specified)

**Example:**

```typescript
await migration.createCollection({
  name: 'products',
  schema: {
    name: { type: 'string', required: true, size: 255 },
    price: { type: 'number', min: 0 },
    inStock: { type: 'boolean', default: true }
  }
});
```

### updateCollection()

Updates an existing collection to match the schema.

```typescript
async updateCollection(table: TableDefinition): Promise<void>
```

**Parameters:**

- `table`: Updated table definition

**Process:**

1. Compares current collection with new schema
2. Adds missing attributes
3. Updates existing attributes (limited by Appwrite capabilities)
4. Logs warnings for incompatible changes

**Limitations:**

- Cannot delete attributes (Appwrite limitation)
- Cannot change attribute types (Appwrite limitation)
- Cannot modify some constraints after creation

**Example:**

```typescript
// Original schema
const originalTable = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true }
  }
};

// Updated schema with new field
const updatedTable = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }, // New field
    age: { type: 'number', min: 0 }            // New field
  }
};

await migration.updateCollection(updatedTable);
// Adds 'email' and 'age' attributes to existing collection
```

## AttributeManager Class

Manages individual attribute operations.

```typescript
class AttributeManager {
  constructor(databases: Databases);
  
  async createAttribute(databaseId: string, collectionId: string, key: string, field: DatabaseField): Promise<void>;
  async getAttribute(databaseId: string, collectionId: string, key: string): Promise<any>;
  async deleteAttribute(databaseId: string, collectionId: string, key: string): Promise<void>;
}
```

### createAttribute()

Creates a new attribute with proper type mapping.

```typescript
async createAttribute(databaseId: string, collectionId: string, key: string, field: DatabaseField): Promise<void>
```

**Parameters:**

- `databaseId`: Database identifier
- `collectionId`: Collection identifier  
- `key`: Attribute name
- `field`: Field definition with constraints

**Type Mapping:**

| TypeScript Type | Appwrite Type | Notes |
|----------------|---------------|-------|
| `'string'` | `'string'` | Supports size constraint |
| `'number'` | `'integer'` or `'float'` | Auto-detected based on constraints |
| `'boolean'` | `'boolean'` | - |
| `'Date'` | `'datetime'` | - |
| `string[]` (enum) | `'enum'` | Uses enum values |

**Example:**

```typescript
const attrManager = new AttributeManager(databases);

// String attribute
await attrManager.createAttribute('main-db', 'users', 'name', {
  type: 'string',
  required: true,
  size: 100
});

// Number attribute with constraints
await attrManager.createAttribute('main-db', 'users', 'age', {
  type: 'number',
  min: 0,
  max: 120
});

// Enum attribute
await attrManager.createAttribute('main-db', 'users', 'role', {
  type: ['admin', 'user', 'guest'],
  enum: ['admin', 'user', 'guest'],
  default: 'user'
});
```

## Auto-Migration

### Enabling Auto-Migration

Auto-migration is controlled by the `autoMigrate` flag in the ORM configuration:

```typescript
const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db',
  apiKey: 'your-api-key',
  autoMigrate: true  // Enable auto-migration
});

// Migration runs automatically during init()
const db = await orm.init([userTable, postTable]);
```

### Manual Migration

For production environments, disable auto-migration and run migrations manually:

```typescript
const orm = new ServerORM({
  // ... config
  autoMigrate: false  // Disable auto-migration
});

// Run migration manually
const migration = new Migration(databases, config);
await migration.migrate([userTable, postTable]);

// Then initialize ORM
const db = await orm.init([userTable, postTable]);
```

## Migration Strategies

### Development Environment

```typescript
// Development: Enable auto-migration for rapid iteration
const devConfig = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true  // Safe for development
};
```

### Production Environment

```typescript
// Production: Manual migration control
const prodConfig = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: false  // Manual control for production
};

// Separate migration script
async function runMigration() {
  const migration = new Migration(databases, prodConfig);
  await migration.migrate(allTables);
  console.log('Migration completed successfully');
}
```

### Staging Environment

```typescript
// Staging: Controlled migration with validation
const stagingConfig = {
  // ... config
  autoMigrate: process.env.NODE_ENV === 'development'
};
```

## Migration Workflow

### 1. Schema Changes

When you modify your table definitions:

```typescript
// Before
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

// After - adding new fields
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0, max: 120 },      // New field
    isActive: { type: 'boolean', default: true },    // New field
    role: { type: ['admin', 'user'], default: 'user' } // New enum field
  }
};
```

### 2. Migration Execution

```typescript
// Auto-migration (development)
const db = await orm.init([userTable]); // Migration runs automatically

// Manual migration (production)
await migration.migrate([userTable]);   // Run migration first
const db = await orm.init([userTable]); // Then initialize
```

### 3. Verification

```typescript
// Verify migration success
try {
  const testUser = await db.users.create({
    name: 'Test User',
    email: 'test@example.com',
    age: 25,
    role: 'user'
  });
  console.log('Migration successful - new fields work');
} catch (error) {
  console.error('Migration may have failed:', error);
}
```

## Error Handling

### ORMMigrationError

Custom error class for migration failures.

```typescript
class ORMMigrationError extends Error {
  constructor(message: string);
}
```

**Example:**

```typescript
try {
  await migration.migrate([userTable]);
} catch (error) {
  if (error instanceof ORMMigrationError) {
    console.error('Migration failed:', error.message);
    // Handle migration-specific errors
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Common Migration Errors

```typescript
// Handle specific migration scenarios
try {
  await migration.createCollection(table);
} catch (error) {
  if (error.message.includes('Collection already exists')) {
    console.log('Collection exists, updating instead...');
    await migration.updateCollection(table);
  } else if (error.message.includes('Invalid attribute')) {
    console.error('Schema definition error:', error.message);
  } else {
    throw error;
  }
}
```

## Migration Limitations

### Appwrite Constraints

1. **Cannot Delete Attributes**: Once created, attributes cannot be removed
2. **Cannot Change Types**: Attribute types cannot be modified after creation
3. **Limited Updates**: Some constraints cannot be changed after creation
4. **No Rollback**: Migrations are forward-only

### Workarounds

```typescript
// Instead of changing types, create new attributes
const userTableV2: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    // age: { type: 'string' },  // Old field (can't change to number)
    ageNumber: { type: 'number', min: 0 }, // New field with correct type
  }
};
```

## Best Practices

### 1. Version Your Schemas

```typescript
// Use versioned schema definitions
const userSchemaV1 = {
  name: { type: 'string', required: true },
  email: { type: 'string', required: true }
};

const userSchemaV2 = {
  ...userSchemaV1,
  age: { type: 'number', min: 0 },
  isActive: { type: 'boolean', default: true }
};
```

### 2. Test Migrations

```typescript
// Test migrations in development first
describe('User table migration', () => {
  test('should add new fields', async () => {
    await migration.migrate([userTableV2]);
    
    const user = await db.users.create({
      name: 'Test',
      email: 'test@example.com',
      age: 25
    });
    
    expect(user.age).toBe(25);
    expect(user.isActive).toBe(true); // Default value
  });
});
```

### 3. Backup Before Migration

```typescript
// Production migration script
async function safeMigration() {
  console.log('Starting migration...');
  
  try {
    // Backup data (implement your backup strategy)
    await backupDatabase();
    
    // Run migration
    await migration.migrate(newTables);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    // Implement rollback strategy
    await restoreFromBackup();
    throw error;
  }
}
```

### 4. Gradual Migration

```typescript
// Migrate tables one by one for better control
async function gradualMigration() {
  const tables = [userTable, postTable, commentTable];
  
  for (const table of tables) {
    try {
      console.log(`Migrating ${table.name}...`);
      await migration.migrate([table]);
      console.log(`✓ ${table.name} migrated successfully`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${table.name}:`, error);
      throw error;
    }
  }
}
```

## Migration Scripts

### Standalone Migration Script

```typescript
// migrate.ts
import { ServerORM, Migration } from 'appwrite-orm/server';
import { allTables } from './schemas';

async function runMigration() {
  const config = {
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!
  };

  const orm = new ServerORM(config);
  const databases = (orm as any).databases;
  const migration = new Migration(databases, config);

  try {
    console.log('Starting database migration...');
    await migration.migrate(allTables);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

### Package.json Scripts

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate.ts",
    "migrate:dev": "NODE_ENV=development npm run migrate",
    "migrate:prod": "NODE_ENV=production npm run migrate"
  }
}
```

## Next Steps

- [Server ORM](server-orm.md) - Learn about server-specific features
- [Error Handling](../guides/error-handling.md) - Handle migration errors
- [Testing](../guides/testing.md) - Test your migrations