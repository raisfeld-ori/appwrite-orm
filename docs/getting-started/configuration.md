# Configuration

Configure your ORM instance with the options you need.

## Required Options

Both server and web ORMs require these:

```typescript
{
  endpoint: string;      // Your Appwrite endpoint
  projectId: string;     // Your Appwrite project ID
  databaseId: string;    // Your database ID
}
```

## Server-Only Options

### `apiKey` (required)

Your Appwrite API key for server-side operations.

```typescript
const orm = new ServerORM({
  // ... other options
  apiKey: process.env.APPWRITE_API_KEY
});
```

### `autoMigrate` (optional)

Automatically create collections, attributes, and indexes on initialization.

```typescript
const orm = new ServerORM({
  // ... other options
  autoMigrate: true  // Default: false
});
```

**When enabled:**
- Collections are created if they don't exist
- Attributes are added if missing
- Indexes are created automatically
- Existing data is preserved

**When disabled:**
- You must create collections manually
- Validation still checks if collections exist (unless `autoValidate` is false)

### `autoValidate` (optional)

Validate that collections and schemas match on initialization.

```typescript
const orm = new ServerORM({
  // ... other options
  autoValidate: true  // Default: true (always true if autoMigrate is true)
});
```

## Web-Only Options

### `development` (optional)

Use cookie-based storage instead of Appwrite for quick prototyping.

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',  // Can be anything in dev mode
  projectId: 'dev',
  databaseId: 'my-db',
  development: true
});
```

**Development mode:**
- ✅ No Appwrite backend needed
- ✅ Instant setup for testing
- ✅ Same API as production
- ❌ Data stored in browser cookies (limited to ~4KB)
- ❌ No authentication
- ❌ Simplified queries

## Example Configurations

### Production Server

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true,
  autoValidate: true
});
```

### Production Web

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  autoValidate: true
});
```

### Development/Testing

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'test-db',
  development: true  // Uses cookies, no Appwrite needed
});
```

## Environment Variables

Recommended environment variable setup:

```bash
# .env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key  # Server only
```

## Next Steps

- [Supported Features](supported-features.md)
- [Server Setup](../server/setup.md)
- [Web Setup](../web/setup.md)
