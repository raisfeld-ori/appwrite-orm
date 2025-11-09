# Validation System

The Appwrite ORM includes a comprehensive validation system that ensures data integrity before it reaches the database. Validation occurs on both client and server sides with detailed error reporting.

## Validator Class

Core validation utilities used across the ORM.

```typescript
class Validator {
  static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[];
  private static validateType(value: any, expectedType: TypeScriptType): boolean;
  private static getTypeString(type: TypeScriptType): string;
}
```

### validateField()

Validates a single field value against its definition.

```typescript
static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[]
```

**Parameters:**

- `value`: The value to validate
- `field`: Field definition with constraints
- `fieldName`: Name of the field (for error reporting)

**Returns:**

- `ValidationError[]`: Array of validation errors (empty if valid)

**Example:**

```typescript
import { Validator } from 'appwrite-orm';

const fieldDef = {
  type: 'string',
  required: true,
  size: 50
};

const errors = Validator.validateField('', fieldDef, 'name');
// Returns: [{ field: 'name', message: 'Field is required', value: '' }]

const errors2 = Validator.validateField('Very long string that exceeds limit', fieldDef, 'name');
// Returns: [{ field: 'name', message: 'String length exceeds maximum of 50', value: '...' }]
```

## Validation Rules

### Required Fields

Fields marked as `required: true` must have a non-null, non-undefined value.

```typescript
const field = { type: 'string', required: true };

// ✅ Valid
Validator.validateField('John Doe', field, 'name');

// ❌ Invalid
Validator.validateField('', field, 'name');
Validator.validateField(null, field, 'name');
Validator.validateField(undefined, field, 'name');
```

### Type Validation

Values must match the specified TypeScript type.

```typescript
// String validation
const stringField = { type: 'string' };
Validator.validateField('hello', stringField, 'text');     // ✅ Valid
Validator.validateField(123, stringField, 'text');        // ❌ Invalid

// Number validation
const numberField = { type: 'number' };
Validator.validateField(42, numberField, 'age');          // ✅ Valid
Validator.validateField('42', numberField, 'age');        // ❌ Invalid
Validator.validateField(NaN, numberField, 'age');         // ❌ Invalid

// Boolean validation
const boolField = { type: 'boolean' };
Validator.validateField(true, boolField, 'active');       // ✅ Valid
Validator.validateField('true', boolField, 'active');     // ❌ Invalid

// Date validation
const dateField = { type: 'Date' };
Validator.validateField(new Date(), dateField, 'created'); // ✅ Valid
Validator.validateField('2024-01-01', dateField, 'created'); // ✅ Valid (string dates accepted)
```

### String Constraints

String fields support size limitations.

```typescript
const field = { type: 'string', size: 10 };

// ✅ Valid
Validator.validateField('short', field, 'text');

// ❌ Invalid
Validator.validateField('this string is too long', field, 'text');
// Returns: [{ field: 'text', message: 'String length exceeds maximum of 10' }]
```

### Number Constraints

Number fields support minimum and maximum value constraints.

```typescript
const field = { type: 'number', min: 0, max: 100 };

// ✅ Valid
Validator.validateField(50, field, 'score');

// ❌ Invalid - below minimum
Validator.validateField(-10, field, 'score');
// Returns: [{ field: 'score', message: 'Value -10 is below minimum of 0' }]

// ❌ Invalid - above maximum
Validator.validateField(150, field, 'score');
// Returns: [{ field: 'score', message: 'Value 150 exceeds maximum of 100' }]
```

### Enum Validation

Enum fields must match one of the allowed values.

```typescript
const field = { 
  type: ['admin', 'user', 'guest'], 
  enum: ['admin', 'user', 'guest'] 
};

// ✅ Valid
Validator.validateField('admin', field, 'role');

// ❌ Invalid
Validator.validateField('superuser', field, 'role');
// Returns: [{ field: 'role', message: 'Value must be one of: admin, user, guest' }]
```

## Validation Errors

### ValidationError Interface

```typescript
interface ValidationError {
  field: string;    // Field name that failed validation
  message: string;  // Human-readable error message
  value?: any;      // The invalid value (optional)
}
```

### ORMValidationError Class

Custom error class that aggregates multiple validation errors.

```typescript
class ORMValidationError extends Error {
  public errors: ValidationError[];
  
  constructor(errors: ValidationError[]);
}
```

**Properties:**

- `errors`: Array of individual validation errors
- `message`: Formatted summary of all errors
- `name`: Always 'ORMValidationError'

**Example:**

```typescript
try {
  await db.users.create({
    name: '',      // Required field empty
    age: -5,       // Below minimum
    role: 'invalid' // Not in enum
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    console.log('Validation failed:');
    error.errors.forEach(err => {
      console.log(`- ${err.field}: ${err.message}`);
    });
    
    // Output:
    // - name: Field is required
    // - age: Value -5 is below minimum of 0
    // - role: Value must be one of: admin, user, guest
  }
}
```

## Schema Validation

### Complete Object Validation

The ORM validates entire objects against their schema during create and update operations.

```typescript
const userSchema = {
  name: { type: 'string', required: true, size: 100 },
  email: { type: 'string', required: true, size: 255 },
  age: { type: 'number', min: 0, max: 120 },
  role: { type: ['admin', 'user'], default: 'user' }
};

// This will validate all fields
await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'user'
});
```

### Partial Validation (Updates)

During updates, only provided fields are validated.

```typescript
// Only validates the 'age' field
await db.users.update('user-id', {
  age: 31
});
```

### Required Field Checking

For create operations, all required fields must be present.

```typescript
// ❌ This will fail - missing required 'name' field
await db.users.create({
  email: 'john@example.com'
});
// Throws: ORMValidationError with error for missing 'name' field
```

## Web vs Server Validation

### Web Validation (Client-Side)

- Validates data before sending to Appwrite
- Provides immediate feedback to users
- Reduces unnecessary network requests
- Should not be trusted for security

```typescript
import { WebValidator } from 'appwrite-orm/web';

// Manual validation
const errors = WebValidator.validateSchema(userData, schema);
if (errors.length > 0) {
  // Handle errors before submission
  displayValidationErrors(errors);
  return;
}
```

### Server Validation

- Validates data on the server side
- Provides security and data integrity
- Can access server-side resources
- Authoritative validation

```typescript
// Server validation happens automatically
try {
  const user = await db.users.create(userData);
} catch (error) {
  if (error instanceof ORMValidationError) {
    // Handle server-side validation errors
  }
}
```

## Custom Validation

### Field-Level Validation

You can add custom validation by extending the validation logic:

```typescript
function validateEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!email.includes('@')) {
    errors.push({
      field: 'email',
      message: 'Email must contain @ symbol',
      value: email
    });
  }
  
  return errors;
}

// Use in your application logic
const emailErrors = validateEmail(userData.email);
if (emailErrors.length > 0) {
  throw new ORMValidationError(emailErrors);
}
```

### Schema-Level Validation

```typescript
function validateUserData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Custom business logic validation
  if (data.age < 18 && data.role === 'admin') {
    errors.push({
      field: 'role',
      message: 'Users under 18 cannot be administrators',
      value: data.role
    });
  }
  
  return errors;
}
```

## Validation Helpers

### Type Checking Utilities

```typescript
import { TypeMapper } from 'appwrite-orm';

// Convert TypeScript types to Appwrite types
const appwriteType = TypeMapper.toAppwriteType('string'); // 'string'
const appwriteType2 = TypeMapper.toAppwriteType('number'); // 'integer'

// Convert Appwrite types to TypeScript types
const tsType = TypeMapper.fromAppwriteType('datetime'); // 'Date'
```

### Validation Configuration

```typescript
// Disable validation for specific operations (not recommended)
const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db',
  skipValidation: false // Custom flag (if implemented)
};
```

## Best Practices

### 1. Define Clear Constraints

```typescript
// ✅ Good: Clear, specific constraints
const userSchema = {
  username: { 
    type: 'string', 
    required: true, 
    size: 50 
  },
  email: { 
    type: 'string', 
    required: true, 
    size: 255 
  },
  age: { 
    type: 'number', 
    min: 13, 
    max: 120 
  }
};

// ❌ Bad: Vague or missing constraints
const badSchema = {
  username: { type: 'string' }, // No size limit
  age: { type: 'number' }       // No range validation
};
```

### 2. Handle Validation Errors Gracefully

```typescript
async function createUser(userData: any) {
  try {
    return await db.users.create(userData);
  } catch (error) {
    if (error instanceof ORMValidationError) {
      // Return user-friendly error messages
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.field,
          message: err.message
        }))
      };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### 3. Validate Early and Often

```typescript
// ✅ Good: Validate on the client before submission
function validateForm(formData: any) {
  const errors = WebValidator.validateSchema(formData, userSchema);
  if (errors.length > 0) {
    displayErrors(errors);
    return false;
  }
  return true;
}

// Submit only if validation passes
if (validateForm(formData)) {
  await submitForm(formData);
}
```

### 4. Use Default Values

```typescript
const schema = {
  isActive: { type: 'boolean', default: true },
  role: { type: ['admin', 'user'], default: 'user' },
  createdAt: { type: 'Date', default: () => new Date() }
};
```

## Error Messages

The validation system provides clear, actionable error messages:

| Validation Type | Example Message |
|----------------|-----------------|
| Required field | "Field is required" |
| Type mismatch | "Expected type string, got number" |
| String too long | "String length exceeds maximum of 50" |
| Number too small | "Value -5 is below minimum of 0" |
| Number too large | "Value 150 exceeds maximum of 100" |
| Invalid enum | "Value must be one of: admin, user, guest" |

## Testing Validation

```typescript
import { Validator, ORMValidationError } from 'appwrite-orm';

describe('User validation', () => {
  const userSchema = {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0 }
  };

  test('should validate required fields', () => {
    const errors = Validator.validateField('', userSchema.name, 'name');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Field is required');
  });

  test('should validate number ranges', () => {
    const errors = Validator.validateField(-5, userSchema.age, 'age');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Value -5 is below minimum of 0');
  });
});
```

## Next Steps

- [Migration](migration.md) - Learn about schema migrations
- [Error Handling](../guides/error-handling.md) - Master error handling patterns
- [Testing](../guides/testing.md) - Test your validation logic