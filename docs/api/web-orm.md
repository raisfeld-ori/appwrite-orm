# Web ORM API

The Web ORM provides browser-optimized database operations with client-side validation and type safety.

## WebORM Class

Main ORM class for web applications.

```typescript
class WebORM {
  constructor(config: ORMConfig);
  init<T extends TableDefinition[]>(tables: T): WebORMInstance<T>;
}
```

### Constructor

Creates a new WebORM instance with the provided configuration.

```typescript
constructor(config: ORMConfig)
```

**Parameters:**

- `config`: Configuration object with endpoint, projectId, and databaseId

**Example:**

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db'
});
```

### init()

Initializes the ORM with table definitions and returns a typed instance.

```typescript
init<T extends TableDefinition[]>(tables: T): WebORMInstance<T>
```

**Parameters:**

- `tables`: Array of table definitions

**Returns:**

- `WebORMInstance<T>`: Typed ORM instance with table access

**Example:**

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

const db = orm.init([userTable]);
// db.users is now available with full type safety
```

## WebORMInstance Class

Initialized ORM instance providing access to table operations.

```typescript
class WebORMInstance<T extends TableDefinition[]> {
  // Dynamic table properties based on table definitions
  [K in T[number]['name']]: WebTable<ExtractSchema<T, K>>;
}
```

### Properties

The instance dynamically creates properties for each table defined during initialization:

```typescript
const db = orm.init([userTable, postTable]);

// Available properties:
db.users  // WebTable<UserSchema>
db.posts  // WebTable<PostSchema>
```

## WebTable Class

Web-specific implementation of table operations.

```typescript
class WebTable<T extends DatabaseSchema> extends BaseTable<T> {
  // Inherits all BaseTable methods
  // Web-specific optimizations and validations
}
```

### Inherited Methods

WebTable inherits all methods from [BaseTable](table-operations.md):

- CRUD operations: `create()`, `get()`, `update()`, `delete()`
- Query operations: `query()`, `all()`, `first()`, `count()`
- Advanced queries: `find()`, `findOne()`

### Web-Specific Features

#### Client-Side Validation

All data is validated on the client before sending to Appwrite:

```typescript
try {
  await db.users.create({
    name: '',  // Will fail validation
    email: 'invalid-email'
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    // Handle validation errors before network request
  }
}
```

#### Browser Optimizations

- Minimal bundle size
- No server-specific dependencies
- Optimized for client-side performance

## WebValidator Class

Client-side validation utilities.

```typescript
class WebValidator {
  static validateSchema(data: any, schema: DatabaseSchema): ValidationError[];
  static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[];
}
```

### validateSchema()

Validates an entire object against a schema.

```typescript
static validateSchema(data: any, schema: DatabaseSchema): ValidationError[]
```

**Parameters:**

- `data`: Object to validate
- `schema`: Schema definition to validate against

**Returns:**

- `ValidationError[]`: Array of validation errors (empty if valid)

**Example:**

```typescript
import { WebValidator } from 'appwrite-orm/web';

const schema = {
  name: { type: 'string', required: true },
  age: { type: 'number', min: 0 }
};

const errors = WebValidator.validateSchema(
  { name: '', age: -5 },
  schema
);

// errors will contain validation failures
```

### validateField()

Validates a single field value.

```typescript
static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[]
```

**Parameters:**

- `value`: Value to validate
- `field`: Field definition
- `fieldName`: Name of the field (for error reporting)

**Returns:**

- `ValidationError[]`: Array of validation errors

**Example:**

```typescript
const fieldDef = { type: 'string', required: true, size: 10 };
const errors = WebValidator.validateField('too long string', fieldDef, 'name');
```

## Usage Examples

### Basic Setup

```typescript
import { WebORM, TableDefinition } from 'appwrite-orm/web';

// Define tables
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 }
  }
};

// Initialize ORM
const orm = new WebORM({
  endpoint: process.env.REACT_APP_APPWRITE_ENDPOINT!,
  projectId: process.env.REACT_APP_APPWRITE_PROJECT_ID!,
  databaseId: process.env.REACT_APP_APPWRITE_DATABASE_ID!
});

const db = orm.init([userTable]);
```

### React Integration

```typescript
import React, { useState, useEffect } from 'react';
import { WebORM } from 'appwrite-orm/web';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const orm = new WebORM({
          endpoint: process.env.REACT_APP_APPWRITE_ENDPOINT!,
          projectId: process.env.REACT_APP_APPWRITE_PROJECT_ID!,
          databaseId: process.env.REACT_APP_APPWRITE_DATABASE_ID!
        });

        const db = orm.init([userTable]);
        const userList = await db.users.all();
        setUsers(userList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.$id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  );
}
```

### Form Validation

```typescript
import { WebValidator, ORMValidationError } from 'appwrite-orm/web';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 0
  });
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate before submission
      const validationErrors = WebValidator.validateSchema(formData, userTable.schema);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Submit to database
      const user = await db.users.create(formData);
      console.log('User created:', user);
      
      // Reset form
      setFormData({ name: '', email: '', age: 0 });
      setErrors([]);
      
    } catch (error) {
      if (error instanceof ORMValidationError) {
        setErrors(error.errors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      
      {errors.filter(e => e.field === 'name').map(error => (
        <div key={error.field} className="error">{error.message}</div>
      ))}
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### Vue.js Integration

```typescript
import { defineComponent, ref, onMounted } from 'vue';
import { WebORM } from 'appwrite-orm/web';

export default defineComponent({
  setup() {
    const users = ref([]);
    const loading = ref(true);

    const fetchUsers = async () => {
      const orm = new WebORM({
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
      });

      const db = orm.init([userTable]);
      users.value = await db.users.all();
      loading.value = false;
    };

    onMounted(fetchUsers);

    return {
      users,
      loading
    };
  }
});
```

## Environment Variables

For web applications, use environment variables with your framework's prefix:

### React (.env)

```bash
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=your-project-id
REACT_APP_APPWRITE_DATABASE_ID=your-database-id
```

### Vue.js (.env)

```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
```

### Next.js (.env.local)

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
```

## Limitations

The Web ORM has some limitations compared to the Server ORM:

- **No Migration Support**: Cannot create or modify collections
- **No Administrative Operations**: Limited to CRUD operations
- **Client-Side Only**: Validation happens on the client
- **No API Key**: Uses session-based authentication

## Security Considerations

- All validation happens on the client and should be considered untrusted
- Use Appwrite's built-in security rules for server-side validation
- Never expose sensitive configuration in client-side code
- Use environment variables for configuration values

## Next Steps

- [Server ORM](server-orm.md) - Learn about server-specific features
- [Table Operations](table-operations.md) - Master CRUD and query operations
- [Validation](validation.md) - Understand the validation system