# Schema Definition

Define type-safe schemas for your Appwrite collections.

## Basic Structure

```typescript
import { TableDefinition } from 'appwrite-orm';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0 }
  }
};
```

## Field Types

### String

```typescript
{
  name: { type: 'string', required: true, size: 100 },
  email: { type: 'string', required: true },
  bio: { type: 'string', size: 500 }
}
```

### Numbers: Integer and Float

**Important:** Use explicit `'integer'` or `'float'` types:

```typescript
{
  age: { type: 'integer', min: 0, max: 150 },
  count: { type: 'integer', default: 0 },
  price: { type: 'float', min: 0 },
  balance: { type: 'float', default: 0 },
  rating: { type: 'float', min: 0, max: 5 }
}
```

### Boolean

```typescript
{
  isActive: { type: 'boolean', default: true },
  verified: { type: 'boolean', required: true }
}
```

### Date

```typescript
{
  createdAt: { type: 'Date' },
  birthDate: { type: 'Date', required: true }
}
```

### Enum

```typescript
{
  role: {
    type: ['admin', 'user', 'guest'],
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  status: {
    type: ['active', 'inactive'],
    enum: ['active', 'inactive'],
    required: true
  }
}
```

### Arrays

```typescript
{
  tags: { type: 'string', array: true },
  scores: { type: 'integer', array: true }
}
```

## Complete Examples

### User Table

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'integer', min: 0, max: 150 },
    balance: { type: 'float', default: 0 },
    role: {
      type: ['admin', 'user'],
      enum: ['admin', 'user'],
      default: 'user'
    },
    isActive: { type: 'boolean', default: true }
  }
};
```

### Product Table

```typescript
const productTable: TableDefinition = {
  name: 'products',
  schema: {
    name: { type: 'string', required: true, size: 255 },
    sku: { type: 'string', required: true, size: 50 },
    price: { type: 'float', required: true, min: 0 },
    stock: { type: 'integer', default: 0, min: 0 },
    rating: { type: 'float', min: 0, max: 5 },
    tags: { type: 'string', array: true },
    inStock: { type: 'boolean', default: true }
  }
};
```

## Relationships

Model relationships using ID fields:

```typescript
// One-to-Many
const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    authorId: { type: 'string', required: true }, // Foreign key
    views: { type: 'integer', default: 0 }
  }
};

// Query posts by author
const userPosts = await db.posts.query({ authorId: user.$id });
```

## Custom Collection IDs

```typescript
const table: TableDefinition = {
  name: 'users',
  id: 'custom_collection_id', // Optional
  schema: { /* ... */ }
};
```

If `id` is not specified, the `name` is used as the collection ID.

## Best Practices

1. **Use explicit integer/float types** - Never use generic `'number'`
2. **Set size limits on strings** - Prevents storage issues
3. **Add min/max constraints** - Validates data at schema level
4. **Use enums for fixed values** - Better than free-form strings
5. **Include timestamps** - Track creation/update times

```typescript
// Good schema
{
  age: { type: 'integer', min: 0, max: 150 },
  price: { type: 'float', min: 0 },
  role: { type: ['admin', 'user'], enum: ['admin', 'user'] }
}

// Bad schema
{
  age: { type: 'number' }, // Use 'integer' instead
  price: { type: 'number' }, // Use 'float' instead
  role: { type: 'string' } // Use enum instead
}
```
