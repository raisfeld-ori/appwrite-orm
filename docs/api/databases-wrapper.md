# DatabasesWrapper and ClientWrapper

## Overview

The `DatabasesWrapper` and `ClientWrapper` classes provide type-safe access to Appwrite's server-side API methods that are not exposed in the TypeScript SDK type definitions.

## Why These Wrappers Exist

The Appwrite SDK (v13+) includes server-side methods for managing databases, collections, and attributes programmatically. However, these methods are not included in the TypeScript type definitions. Instead of using unsafe type casts (`as any`), we've created wrapper classes that:

1. **Provide type safety** - All methods have proper TypeScript signatures
2. **Make explicit API calls** - Uses the underlying `client.call()` method to interact with the Appwrite REST API
3. **Include validation** - Ensures the client is properly initialized
4. **Are fully tested** - Comprehensive test coverage for all operations

## DatabasesWrapper

### Usage

```typescript
import { Databases } from 'appwrite';
import { DatabasesWrapper } from 'appwrite-orm/server';

const databases = new Databases(client);
const db = new DatabasesWrapper(databases);

// Now you can use server-side methods with full type safety
await db.createDatabase('my-db', 'My Database');
await db.createCollection('my-db', 'users', 'Users Collection');
```

### Available Methods

#### Database Operations

```typescript
// Get a database
await db.getDatabase(databaseId: string): Promise<any>

// Create a database
await db.createDatabase(databaseId: string, name: string): Promise<any>
```

#### Collection Operations

```typescript
// Get a collection
await db.getCollection(databaseId: string, collectionId: string): Promise<any>

// Create a collection
await db.createCollection(
  databaseId: string,
  collectionId: string,
  name: string,
  permissions?: string[],
  documentSecurity?: boolean
): Promise<any>

// Delete a collection
await db.deleteCollection(databaseId: string, collectionId: string): Promise<void>
```

#### Attribute Operations

```typescript
// Create string attribute
await db.createStringAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  size: number,
  required: boolean,
  defaultValue?: string | null,
  array?: boolean
): Promise<any>

// Create integer attribute
await db.createIntegerAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  required: boolean,
  min?: number | null,
  max?: number | null,
  defaultValue?: number | null,
  array?: boolean
): Promise<any>

// Create float attribute
await db.createFloatAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  required: boolean,
  min?: number | null,
  max?: number | null,
  defaultValue?: number | null,
  array?: boolean
): Promise<any>

// Create boolean attribute
await db.createBooleanAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  required: boolean,
  defaultValue?: boolean | null,
  array?: boolean
): Promise<any>

// Create datetime attribute
await db.createDatetimeAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  required: boolean,
  defaultValue?: string | null,
  array?: boolean
): Promise<any>

// Create enum attribute
await db.createEnumAttribute(
  databaseId: string,
  collectionId: string,
  key: string,
  elements: string[],
  required: boolean,
  defaultValue?: string | null,
  array?: boolean
): Promise<any>
```

### Accessing Standard Methods

You can still access all standard `Databases` methods through the `standard` property:

```typescript
const db = new DatabasesWrapper(databases);

// Use wrapper methods
await db.createCollection('db1', 'col1', 'My Collection');

// Use standard Databases methods
await db.standard.createDocument('db1', 'col1', ID.unique(), { name: 'John' });
await db.standard.listDocuments('db1', 'col1');
```

## ClientWrapper

### Usage

```typescript
import { Client } from 'appwrite';
import { ClientWrapper } from 'appwrite-orm/server';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('your-project-id');

const clientWrapper = new ClientWrapper(client);
clientWrapper.setKey('your-api-key');
```

### Available Methods

```typescript
// Set API key for server-side operations
setKey(key: string): this
```

### Accessing Standard Methods

```typescript
const clientWrapper = new ClientWrapper(client);

// Use wrapper methods
clientWrapper.setKey('api-key');

// Use standard Client methods
clientWrapper.standard.setEndpoint('https://cloud.appwrite.io/v1');
```

## Internal Implementation

Both wrappers use the `client.call()` method to make direct API calls to the Appwrite REST API:

```typescript
// Example: Creating a database
await this.client.call('post', '/databases', {
  'content-type': 'application/json',
}, {
  databaseId: 'my-db',
  name: 'My Database',
});
```

This ensures that:
1. We're using the official Appwrite SDK's networking layer
2. All authentication and error handling is managed by the SDK
3. The implementation is compatible with any Appwrite SDK version that has the `call()` method

## Error Handling

The wrappers include built-in validation:

```typescript
// Will throw an error if client is not accessible
const db = new DatabasesWrapper(invalidDatabases);
// Error: DatabasesWrapper: Unable to access Appwrite client

// Will throw an error if client.call is not a function
const db = new DatabasesWrapper(incompatibleDatabases);
// Error: DatabasesWrapper: Client does not have a call method
```

## Testing

Both wrappers have comprehensive test coverage. See:
- `tests/server/databases-wrapper.test.ts` - Unit tests for both wrappers
- `tests/server/server-orm.test.ts` - Integration tests using the wrappers

## When to Use

### Use DatabasesWrapper/ClientWrapper when:
- You need to programmatically create/manage databases and collections
- You're building a migration system
- You're implementing schema management
- You need server-side administrative operations

### Use standard Databases when:
- You're performing CRUD operations on documents
- You're querying collections
- You're working with user data (not administrative operations)

## Migration from Old Code

If you were previously using `as any` casts:

```typescript
// ❌ Old way (not type-safe)
await (databases as any).createCollection(dbId, colId, name);

// ✅ New way (type-safe)
const db = new DatabasesWrapper(databases);
await db.createCollection(dbId, colId, name);
```

## API Reference

For detailed API documentation, see:
- [Appwrite Databases API](https://appwrite.io/docs/server/databases)
- [Appwrite Collections API](https://appwrite.io/docs/server/databases#collections)
- [Appwrite Attributes API](https://appwrite.io/docs/server/databases#attributes)
