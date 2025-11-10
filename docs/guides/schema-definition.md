# Schema Definition Guide

Learn how to define robust, type-safe schemas for your Appwrite collections using the ORM's schema system.

## Basic Schema Structure

A schema defines the structure and constraints of your data:

```typescript
import { TableDefinition } from 'appwrite-orm';

const userTable: TableDefinition = {
  name: 'users',           // Collection name in Appwrite
  schema: {                // Field definitions
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 }
  },
  role: {                  // Optional permissions
    'role:all': ['read'],
    'role:member': ['read', 'create', 'update']
  }
};
```

## Table Definition Properties

### Collection ID vs Name

The `TableDefinition` interface includes two important properties:

- **`name`** (required): The human-readable name of your table/collection
- **`id`** (optional): The collection ID used in Appwrite

If you don't specify an `id`, the ORM automatically uses the `name` as the collection ID:

```typescript
// Without explicit ID - collection ID will be 'users'
const userTable: TableDefinition = {
  name: 'users',
  schema: { /* ... */ }
};

// With explicit ID - collection ID will be 'user_collection'
const userTable: TableDefinition = {
  name: 'users',
  id: 'user_collection',
  schema: { /* ... */ }
};
```

### When to Use Custom IDs

Use custom collection IDs when:

```typescript
// 1. Migrating from an existing database with specific IDs
const legacyUsers: TableDefinition = {
  name: 'users',
  id: 'legacy_users_v2', // Match existing collection ID
  schema: { /* ... */ }
};

// 2. Using naming conventions or prefixes
const userTable: TableDefinition = {
  name: 'users',
  id: 'prod_users', // Environment-specific prefix
  schema: { /* ... */ }
};

// 3. Avoiding naming conflicts
const adminUsers: TableDefinition = {
  name: 'adminUsers',
  id: 'admin_users_collection',
  schema: { /* ... */ }
};
```

**Best Practice**: For new projects, simply use the `name` property and let the ORM handle the collection ID automatically.

## Field Types

### String Fields

```typescript
const stringFields = {
  // Basic string
  name: { type: 'string' },
  
  // Required string
  email: { type: 'string', required: true },
  
  // String with size limit
  username: { type: 'string', required: true, size: 50 },
  
  // String with default value
  status: { type: 'string', default: 'active' },
  
  // Optional string (explicitly)
  bio: { type: 'string', required: false }
};
```

**String Constraints:**

- `required`: Whether the field is mandatory
- `size`: Maximum string length
- `default`: Default value when not provided

### Number Fields

```typescript
const numberFields = {
  // Basic number
  count: { type: 'number' },
  
  // Number with range constraints
  age: { type: 'number', min: 0, max: 120 },
  
  // Required number
  price: { type: 'number', required: true, min: 0 },
  
  // Number with default
  rating: { type: 'number', default: 0, min: 0, max: 5 }
};
```

**Number Constraints:**

- `required`: Whether the field is mandatory
- `min`: Minimum allowed value
- `max`: Maximum allowed value
- `default`: Default value when not provided

### Boolean Fields

```typescript
const booleanFields = {
  // Basic boolean
  isActive: { type: 'boolean' },
  
  // Boolean with default
  isVerified: { type: 'boolean', default: false },
  
  // Required boolean
  acceptsTerms: { type: 'boolean', required: true }
};
```

### Date Fields

```typescript
const dateFields = {
  // Basic date
  createdAt: { type: 'Date' },
  
  // Date with default (current time)
  updatedAt: { type: 'Date', default: new Date() },
  
  // Required date
  birthDate: { type: 'Date', required: true }
};
```

### Enum Fields

```typescript
const enumFields = {
  // Basic enum
  role: { 
    type: ['admin', 'user', 'guest'],
    enum: ['admin', 'user', 'guest']
  },
  
  // Enum with default
  status: {
    type: ['active', 'inactive', 'pending'],
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  
  // Required enum
  priority: {
    type: ['low', 'medium', 'high'],
    enum: ['low', 'medium', 'high'],
    required: true
  }
};
```

## Complete Schema Examples

### User Management System

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    // Identity fields
    username: { type: 'string', required: true, size: 50 },
    email: { type: 'string', required: true, size: 255 },
    firstName: { type: 'string', required: true, size: 100 },
    lastName: { type: 'string', required: true, size: 100 },
    
    // Profile fields
    bio: { type: 'string', size: 500 },
    avatar: { type: 'string', size: 255 },
    birthDate: { type: 'Date' },
    
    // System fields
    role: {
      type: ['admin', 'moderator', 'user'],
      enum: ['admin', 'moderator', 'user'],
      default: 'user'
    },
    isActive: { type: 'boolean', default: true },
    isVerified: { type: 'boolean', default: false },
    
    // Timestamps
    createdAt: { type: 'Date', default: new Date() },
    lastLoginAt: { type: 'Date' }
  }
};
```

### E-commerce Product Catalog

```typescript
const productTable: TableDefinition = {
  name: 'products',
  schema: {
    // Basic info
    name: { type: 'string', required: true, size: 255 },
    description: { type: 'string', size: 2000 },
    sku: { type: 'string', required: true, size: 100 },
    
    // Pricing
    price: { type: 'number', required: true, min: 0 },
    salePrice: { type: 'number', min: 0 },
    cost: { type: 'number', min: 0 },
    
    // Inventory
    stock: { type: 'number', default: 0, min: 0 },
    lowStockThreshold: { type: 'number', default: 10, min: 0 },
    
    // Categories
    category: {
      type: ['electronics', 'clothing', 'books', 'home', 'sports'],
      enum: ['electronics', 'clothing', 'books', 'home', 'sports'],
      required: true
    },
    
    // Status
    status: {
      type: ['draft', 'active', 'inactive', 'discontinued'],
      enum: ['draft', 'active', 'inactive', 'discontinued'],
      default: 'draft'
    },
    
    // Metadata
    weight: { type: 'number', min: 0 },
    dimensions: { type: 'string', size: 100 },
    tags: { type: 'string', size: 500 },
    
    // Timestamps
    createdAt: { type: 'Date', default: new Date() },
    updatedAt: { type: 'Date', default: new Date() }
  }
};
```

### Blog System

```typescript
const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    // Content
    title: { type: 'string', required: true, size: 255 },
    slug: { type: 'string', required: true, size: 255 },
    content: { type: 'string', required: true },
    excerpt: { type: 'string', size: 500 },
    
    // Author
    authorId: { type: 'string', required: true },
    
    // Publishing
    status: {
      type: ['draft', 'published', 'archived'],
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: { type: 'Date' },
    
    // SEO
    metaTitle: { type: 'string', size: 60 },
    metaDescription: { type: 'string', size: 160 },
    
    // Engagement
    viewCount: { type: 'number', default: 0, min: 0 },
    likeCount: { type: 'number', default: 0, min: 0 },
    
    // Features
    isFeatured: { type: 'boolean', default: false },
    allowComments: { type: 'boolean', default: true },
    
    // Timestamps
    createdAt: { type: 'Date', default: new Date() },
    updatedAt: { type: 'Date', default: new Date() }
  }
};
```

## Schema Relationships

While Appwrite doesn't have built-in relationships, you can model them using string IDs:

### One-to-Many Relationship

```typescript
// User (One)
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

// Posts (Many) - each post belongs to one user
const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true } // Foreign key to users
  }
};

// Usage
const user = await db.users.create({ name: 'John', email: 'john@example.com' });
const post = await db.posts.create({
  title: 'My Post',
  content: 'Post content',
  authorId: user.$id
});

// Query posts by author
const userPosts = await db.posts.query({ authorId: user.$id });
```

### Many-to-Many Relationship

```typescript
// Junction table for many-to-many relationships
const userRoleTable: TableDefinition = {
  name: 'user_roles',
  schema: {
    userId: { type: 'string', required: true },
    roleId: { type: 'string', required: true }
  }
};

const roleTable: TableDefinition = {
  name: 'roles',
  schema: {
    name: { type: 'string', required: true },
    permissions: { type: 'string' } // JSON string of permissions
  }
};
```

## Schema Validation Patterns

### Email Validation

```typescript
// While the ORM doesn't have built-in email validation,
// you can add custom validation in your application layer
const userSchema = {
  email: { type: 'string', required: true, size: 255 }
};

// Custom validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### URL Validation

```typescript
const linkSchema = {
  url: { type: 'string', required: true, size: 2048 }
};

function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### JSON Fields

```typescript
// Store JSON as strings and parse in application
const settingsSchema = {
  preferences: { type: 'string' }, // JSON string
  metadata: { type: 'string' }     // JSON string
};

// Usage
const user = await db.users.create({
  name: 'John',
  preferences: JSON.stringify({ theme: 'dark', language: 'en' })
});

const preferences = JSON.parse(user.preferences);
```

## Schema Evolution

### Adding Fields

```typescript
// Version 1
const userTableV1: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

// Version 2 - adding optional fields
const userTableV2: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    // New optional fields
    phone: { type: 'string', size: 20 },
    isVerified: { type: 'boolean', default: false }
  }
};
```

### Handling Breaking Changes

```typescript
// Instead of changing existing fields, add new ones
const userTableV3: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    phone: { type: 'string', size: 20 },
    isVerified: { type: 'boolean', default: false },
    
    // New field instead of changing 'name' type
    fullName: { type: 'string', size: 200 }
  }
};
```

## Best Practices

### 1. Use Descriptive Field Names

```typescript
// ✅ Good: Clear, descriptive names
const schema = {
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  emailAddress: { type: 'string', required: true },
  birthDate: { type: 'Date' },
  isEmailVerified: { type: 'boolean', default: false }
};

// ❌ Bad: Unclear abbreviations
const badSchema = {
  fn: { type: 'string', required: true },
  ln: { type: 'string', required: true },
  em: { type: 'string', required: true },
  bd: { type: 'Date' },
  ver: { type: 'boolean', default: false }
};
```

### 2. Set Appropriate Constraints

```typescript
// ✅ Good: Realistic constraints
const productSchema = {
  name: { type: 'string', required: true, size: 255 },
  price: { type: 'number', required: true, min: 0, max: 999999 },
  rating: { type: 'number', min: 1, max: 5 }
};

// ❌ Bad: No constraints or unrealistic ones
const badSchema = {
  name: { type: 'string' },           // No size limit
  price: { type: 'number' },          // No minimum (could be negative)
  rating: { type: 'number', max: 100 } // Unrealistic scale
};
```

### 3. Use Enums for Fixed Values

```typescript
// ✅ Good: Use enums for known values
const orderSchema = {
  status: {
    type: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
};

// ❌ Bad: Free-form text for status
const badSchema = {
  status: { type: 'string', default: 'pending' }
};
```

### 4. Include Timestamps

```typescript
// ✅ Good: Include creation and update timestamps
const schema = {
  // ... other fields
  createdAt: { type: 'Date', default: new Date() },
  updatedAt: { type: 'Date', default: new Date() }
};
```

### 5. Plan for Growth

```typescript
// ✅ Good: Flexible schema that can grow
const userSchema = {
  // Core required fields
  email: { type: 'string', required: true, size: 255 },
  
  // Optional profile fields
  firstName: { type: 'string', size: 100 },
  lastName: { type: 'string', size: 100 },
  
  // Extensible metadata field
  metadata: { type: 'string' }, // JSON for future extensions
  
  // System fields
  isActive: { type: 'boolean', default: true },
  createdAt: { type: 'Date', default: new Date() }
};
```

## Schema Documentation

Document your schemas for team collaboration:

```typescript
/**
 * User table schema
 * 
 * Stores user account information and profile data.
 * 
 * @field username - Unique username (3-50 characters)
 * @field email - User's email address (required, unique)
 * @field role - User role (admin, moderator, user)
 * @field isActive - Whether the account is active
 * @field createdAt - Account creation timestamp
 */
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    username: { type: 'string', required: true, size: 50 },
    email: { type: 'string', required: true, size: 255 },
    role: {
      type: ['admin', 'moderator', 'user'],
      enum: ['admin', 'moderator', 'user'],
      default: 'user'
    },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'Date', default: new Date() }
  }
};
```

## Testing Schemas

```typescript
import { Validator } from 'appwrite-orm';

describe('User schema validation', () => {
  const userSchema = {
    username: { type: 'string', required: true, size: 50 },
    email: { type: 'string', required: true, size: 255 }
  };

  test('should validate required fields', () => {
    const errors = Validator.validateField('', userSchema.username, 'username');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Field is required');
  });

  test('should validate string length', () => {
    const longUsername = 'a'.repeat(51);
    const errors = Validator.validateField(longUsername, userSchema.username, 'username');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('exceeds maximum');
  });
});
```

## Next Steps

- [Querying Data](querying-data.md) - Learn to query your schema effectively
- [Data Validation](data-validation.md) - Understand validation in depth
- [Migration](../api/migration.md) - Manage schema changes over time
