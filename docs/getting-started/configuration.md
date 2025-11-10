# Configuration

## Required Configuration

All Appwrite ORM instances require these mandatory configuration values:

```typescript
interface ORMConfig {
  endpoint: string;      // Appwrite server endpoint
  projectId: string;     // Your Appwrite project ID
  databaseId: string;    // Target database ID
  apiKey?: string;       // Required for server-side operations
  autoMigrate?: boolean; // Server-only: auto-migrate schemas
  autoValidate?: boolean; // Validate database structure on init (defaults to true)
}
```

## Environment Variables

The recommended approach is to use environment variables for configuration:

### Create Environment File

Create a `.env` file in your project root:

```bash
# .env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key-for-server
```

### Use in Configuration

```typescript
import { ServerORM } from 'appwrite-orm';

const config = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY, // Server only
  autoMigrate: process.env.NODE_ENV === 'development'
};

const orm = new ServerORM(config);
```

## Configuration Validation

The ORM automatically validates required configuration values:

```typescript
// ✅ Valid configuration
const validConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db'
};

// ❌ Will throw error
const invalidConfig = {
  endpoint: '',  // Empty string not allowed
  projectId: 'my-project',
  databaseId: 'main-db'
};
```

## Web vs Server Configuration

### Web Configuration

For browser environments, only basic configuration is needed:

```typescript
import { WebORM } from 'appwrite-orm/web';

const webConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id'
  // No API key needed for web
};

const webORM = new WebORM(webConfig);
```

### Server Configuration

Server environments require an API key and support additional options:

```typescript
import { ServerORM } from 'appwrite-orm/server';

const serverConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key',        // Required for server
  autoMigrate: true              // Optional: auto-migrate schemas
};

const serverORM = new ServerORM(serverConfig);
```

## Auto-Migration

The `autoMigrate` option (server-only) controls automatic schema migration:

```typescript
const config = {
  // ... other config
  autoMigrate: true  // Automatically create/update collections
};
```

!!! warning "Production Warning"
    Auto-migration is not recommended for production environments. Use it only during development or with careful consideration.

## Auto-Validation

The `autoValidate` option controls automatic database structure validation during initialization. By default, `autoValidate` is set to `true`.

```typescript
const config = {
  // ... other config
  autoValidate: true  // Validate database structure on init (default)
};
```

### Behavior

- **Default**: `autoValidate` is automatically set to `true` if not specified
- **With autoMigrate**: When `autoMigrate` is `true`, `autoValidate` is always `true` (validation happens after migration)
- **Server-side**: Validates that all collections exist and have the required attributes defined in your schemas
- **Web-side**: Validates that all collections exist in the database

### When to Disable

You may want to set `autoValidate` to `false` in scenarios where:

```typescript
const config = {
  // ... other config
  autoValidate: false  // Skip validation
};
```

- You want faster initialization and are confident the database structure is correct
- You're connecting to a database that's managed externally
- You're using lazy initialization patterns

!!! tip "Recommended Practice"
    Keep `autoValidate` enabled during development to catch schema mismatches early. Consider disabling it in production only if you have other validation mechanisms in place.

## Testing Configuration

For testing, create a separate `.env.test` file:

```bash
# .env.test
APPWRITE_ENDPOINT=https://test.appwrite.io/v1
APPWRITE_PROJECT_ID=test-project-id
APPWRITE_DATABASE_ID=test-database-id
APPWRITE_API_KEY=test-api-key
```

The package includes dotenv support for test environments.

## Configuration Examples

### Development Setup

```typescript
const devConfig = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true  // Safe for development
};
```

### Production Setup

```typescript
const prodConfig = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: false  // Manual migration control
};
```

## Next Steps

- [Quick Start](quick-start.md) - Build your first application
- [Schema Definition](../guides/schema-definition.md) - Define your data models
