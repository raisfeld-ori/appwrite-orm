# Data Validation Guide

Learn how to implement robust data validation in your Appwrite ORM applications to ensure data integrity and provide excellent user experience.

## Understanding Validation Layers

The Appwrite ORM provides multiple layers of validation:

1. **Schema-level validation** - Defined in your table schemas
2. **Client-side validation** - Immediate feedback in web applications
3. **Server-side validation** - Authoritative validation for security
4. **Custom validation** - Application-specific business rules

## Schema-Level Validation

### Basic Field Validation

```typescript
const userSchema = {
  // Required field validation
  email: { type: 'string', required: true },
  
  // Type validation
  age: { type: 'number' },
  isActive: { type: 'boolean' },
  createdAt: { type: 'Date' },
  
  // String constraints
  username: { type: 'string', required: true, size: 50 },
  
  // Number constraints
  score: { type: 'number', min: 0, max: 100 },
  
  // Enum validation
  role: {
    type: ['admin', 'user', 'guest'],
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  }
};
```

### Validation Rules by Type

#### String Validation

```typescript
const stringFields = {
  // Basic string
  name: { type: 'string', required: true },
  
  // Length constraints
  username: { type: 'string', required: true, size: 30 },
  bio: { type: 'string', size: 500 },
  
  // With defaults
  status: { type: 'string', default: 'active' }
};

// Validation behavior:
// - Required fields cannot be null, undefined, or empty string
// - Size constraint limits string length
// - Default values are used when field is not provided
```

#### Number Validation

```typescript
const numberFields = {
  // Range validation
  age: { type: 'number', min: 0, max: 120 },
  price: { type: 'number', min: 0 },
  rating: { type: 'number', min: 1, max: 5 },
  
  // Required numbers
  quantity: { type: 'number', required: true, min: 1 }
};

// Validation behavior:
// - Values must be valid numbers (not NaN)
// - Min/max constraints are enforced
// - Required fields cannot be null or undefined
```

#### Boolean Validation

```typescript
const booleanFields = {
  isActive: { type: 'boolean', default: true },
  isVerified: { type: 'boolean', required: true },
  acceptsTerms: { type: 'boolean', required: true }
};

// Validation behavior:
// - Values must be true or false
// - Required booleans must be explicitly set
```

#### Date Validation

```typescript
const dateFields = {
  birthDate: { type: 'Date', required: true },
  createdAt: { type: 'Date', default: new Date() },
  updatedAt: { type: 'Date' }
};

// Validation behavior:
// - Accepts Date objects or valid date strings
// - Required dates must be provided
```

#### Enum Validation

```typescript
const enumFields = {
  priority: {
    type: ['low', 'medium', 'high'],
    enum: ['low', 'medium', 'high'],
    required: true
  },
  
  status: {
    type: ['draft', 'published', 'archived'],
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
};

// Validation behavior:
// - Value must be one of the enum options
// - Case-sensitive matching
// - Default values are applied when not provided
```

## Client-Side Validation

### Manual Validation

```typescript
import { WebValidator, ORMValidationError } from 'appwrite-orm/web';

function validateUserForm(formData: any) {
  const schema = {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'number', min: 18, max: 120 }
  };
  
  const errors = WebValidator.validateSchema(formData, schema);
  
  if (errors.length > 0) {
    throw new ORMValidationError(errors);
  }
  
  return true;
}

// Usage in form submission
async function handleSubmit(formData: any) {
  try {
    validateUserForm(formData);
    const user = await db.users.create(formData);
    console.log('User created successfully');
  } catch (error) {
    if (error instanceof ORMValidationError) {
      displayValidationErrors(error.errors);
    }
  }
}
```

### React Form Validation

```typescript
import React, { useState } from 'react';
import { WebValidator, ValidationError } from 'appwrite-orm/web';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: ''
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const schema = {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'number', min: 18, max: 120 }
  };

  const validateField = (fieldName: string, value: any) => {
    const fieldSchema = schema[fieldName];
    if (fieldSchema) {
      const fieldErrors = WebValidator.validateField(value, fieldSchema, fieldName);
      
      // Update errors state
      setErrors(prev => [
        ...prev.filter(e => e.field !== fieldName),
        ...fieldErrors
      ]);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const allErrors = WebValidator.validateSchema(formData, schema);
    setErrors(allErrors);
    
    if (allErrors.length === 0) {
      try {
        await db.users.create(formData);
        // Handle success
      } catch (error) {
        // Handle server errors
      }
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        {getFieldError('name') && (
          <div className="error">{getFieldError('name')?.message}</div>
        )}
      </div>
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        {getFieldError('email') && (
          <div className="error">{getFieldError('email')?.message}</div>
        )}
      </div>
      
      <div>
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => handleChange('age', parseInt(e.target.value))}
        />
        {getFieldError('age') && (
          <div className="error">{getFieldError('age')?.message}</div>
        )}
      </div>
      
      <button type="submit" disabled={errors.length > 0}>
        Create User
      </button>
    </form>
  );
}
```

### Vue.js Form Validation

```typescript
import { ref, computed } from 'vue';
import { WebValidator, ValidationError } from 'appwrite-orm/web';

export default {
  setup() {
    const formData = ref({
      name: '',
      email: '',
      age: null
    });
    
    const errors = ref<ValidationError[]>([]);
    
    const schema = {
      name: { type: 'string', required: true, size: 100 },
      email: { type: 'string', required: true, size: 255 },
      age: { type: 'number', min: 18, max: 120 }
    };
    
    const validateForm = () => {
      errors.value = WebValidator.validateSchema(formData.value, schema);
    };
    
    const isValid = computed(() => errors.value.length === 0);
    
    const getFieldError = (fieldName: string) => {
      return errors.value.find(e => e.field === fieldName);
    };
    
    const handleSubmit = async () => {
      validateForm();
      
      if (isValid.value) {
        try {
          await db.users.create(formData.value);
          // Handle success
        } catch (error) {
          // Handle server errors
        }
      }
    };
    
    return {
      formData,
      errors,
      isValid,
      getFieldError,
      handleSubmit,
      validateForm
    };
  }
};
```

## Server-Side Validation

### Automatic Validation

Server-side validation happens automatically during ORM operations:

```typescript
try {
  const user = await db.users.create({
    name: '',  // Will fail: required field
    age: -5    // Will fail: below minimum
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    // Handle validation errors
    error.errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

### Express.js Validation Middleware

```typescript
import { ORMValidationError } from 'appwrite-orm/server';

function validateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Validation happens in the ORM operation
    next();
  } catch (error) {
    if (error instanceof ORMValidationError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      next(error);
    }
  }
}

app.post('/users', validateUser, async (req, res) => {
  try {
    const user = await db.users.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ORMValidationError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## Custom Validation

### Business Logic Validation

```typescript
import { ValidationError, ORMValidationError } from 'appwrite-orm';

class UserValidator {
  static async validateUniqueEmail(email: string, userId?: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    const existingUser = await db.users.first({ email });
    if (existingUser && existingUser.$id !== userId) {
      errors.push({
        field: 'email',
        message: 'Email address is already in use',
        value: email
      });
    }
    
    return errors;
  }
  
  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
        value: password
      });
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter'
      });
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter'
      });
    }
    
    if (!/\d/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number'
      });
    }
    
    return errors;
  }
  
  static validateAge(birthDate: Date): ValidationError[] {
    const errors: ValidationError[] = [];
    const age = new Date().getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      errors.push({
        field: 'birthDate',
        message: 'Users must be at least 13 years old',
        value: birthDate
      });
    }
    
    return errors;
  }
}

// Usage in user creation
async function createUser(userData: any) {
  const errors: ValidationError[] = [];
  
  // Custom validations
  if (userData.email) {
    const emailErrors = await UserValidator.validateUniqueEmail(userData.email);
    errors.push(...emailErrors);
  }
  
  if (userData.password) {
    const passwordErrors = UserValidator.validatePassword(userData.password);
    errors.push(...passwordErrors);
  }
  
  if (userData.birthDate) {
    const ageErrors = UserValidator.validateAge(new Date(userData.birthDate));
    errors.push(...ageErrors);
  }
  
  if (errors.length > 0) {
    throw new ORMValidationError(errors);
  }
  
  // ORM validation will also run
  return await db.users.create(userData);
}
```

### Validation Decorators (Advanced)

```typescript
// Custom validation decorator system
function validate(validatorFn: (value: any) => ValidationError[]) {
  return function (target: any, propertyKey: string) {
    // Store validation metadata
    if (!target._validators) {
      target._validators = {};
    }
    target._validators[propertyKey] = validatorFn;
  };
}

class UserModel {
  @validate(UserValidator.validatePassword)
  password: string;
  
  @validate((email) => UserValidator.validateUniqueEmail(email))
  email: string;
  
  static async validateInstance(data: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    for (const [field, validator] of Object.entries(this.prototype._validators || {})) {
      if (data[field] !== undefined) {
        const fieldErrors = await (validator as Function)(data[field]);
        errors.push(...fieldErrors);
      }
    }
    
    return errors;
  }
}
```

## Validation Patterns

### Conditional Validation

```typescript
function validateOrder(orderData: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Conditional validation based on order type
  if (orderData.type === 'subscription') {
    if (!orderData.billingCycle) {
      errors.push({
        field: 'billingCycle',
        message: 'Billing cycle is required for subscriptions'
      });
    }
  }
  
  if (orderData.type === 'one-time') {
    if (!orderData.paymentMethod) {
      errors.push({
        field: 'paymentMethod',
        message: 'Payment method is required for one-time orders'
      });
    }
  }
  
  return errors;
}
```

### Cross-Field Validation

```typescript
function validateDateRange(data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (start >= end) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date'
      });
    }
  }
  
  return errors;
}
```

### Async Validation

```typescript
async function validateUserData(userData: any): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  // Check email uniqueness
  if (userData.email) {
    const existingUser = await db.users.first({ email: userData.email });
    if (existingUser) {
      errors.push({
        field: 'email',
        message: 'Email is already registered'
      });
    }
  }
  
  // Check username availability
  if (userData.username) {
    const existingUsername = await db.users.first({ username: userData.username });
    if (existingUsername) {
      errors.push({
        field: 'username',
        message: 'Username is not available'
      });
    }
  }
  
  return errors;
}
```

## Error Handling and User Experience

### Friendly Error Messages

```typescript
function formatValidationError(error: ValidationError): string {
  const friendlyMessages: Record<string, string> = {
    'Field is required': `${error.field} is required`,
    'String length exceeds maximum': `${error.field} is too long`,
    'Value is below minimum': `${error.field} must be at least ${getMinValue(error.field)}`,
    'Value exceeds maximum': `${error.field} cannot exceed ${getMaxValue(error.field)}`
  };
  
  return friendlyMessages[error.message] || error.message;
}

function displayValidationErrors(errors: ValidationError[]) {
  const errorContainer = document.getElementById('errors');
  errorContainer.innerHTML = '';
  
  errors.forEach(error => {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = formatValidationError(error);
    errorContainer.appendChild(errorElement);
  });
}
```

### Progressive Validation

```typescript
class ProgressiveValidator {
  private errors: Map<string, ValidationError[]> = new Map();
  
  validateField(fieldName: string, value: any, schema: any) {
    const fieldErrors = WebValidator.validateField(value, schema[fieldName], fieldName);
    this.errors.set(fieldName, fieldErrors);
    
    // Update UI immediately
    this.updateFieldUI(fieldName, fieldErrors);
  }
  
  private updateFieldUI(fieldName: string, errors: ValidationError[]) {
    const field = document.getElementById(fieldName);
    const errorContainer = document.getElementById(`${fieldName}-error`);
    
    if (errors.length > 0) {
      field?.classList.add('error');
      if (errorContainer) {
        errorContainer.textContent = errors[0].message;
        errorContainer.style.display = 'block';
      }
    } else {
      field?.classList.remove('error');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }
  }
  
  isValid(): boolean {
    return Array.from(this.errors.values()).every(errors => errors.length === 0);
  }
  
  getAllErrors(): ValidationError[] {
    return Array.from(this.errors.values()).flat();
  }
}
```

## Testing Validation

### Unit Testing Validation Logic

```typescript
import { Validator, ValidationError } from 'appwrite-orm';

describe('User validation', () => {
  const userSchema = {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'number', min: 18, max: 120 }
  };

  describe('name validation', () => {
    test('should require name', () => {
      const errors = Validator.validateField('', userSchema.name, 'name');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Field is required');
    });

    test('should enforce name length', () => {
      const longName = 'a'.repeat(101);
      const errors = Validator.validateField(longName, userSchema.name, 'name');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('exceeds maximum');
    });
  });

  describe('age validation', () => {
    test('should enforce minimum age', () => {
      const errors = Validator.validateField(17, userSchema.age, 'age');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('below minimum');
    });

    test('should enforce maximum age', () => {
      const errors = Validator.validateField(121, userSchema.age, 'age');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('exceeds maximum');
    });
  });
});
```

### Integration Testing

```typescript
describe('User creation validation', () => {
  test('should validate user data on creation', async () => {
    const invalidUser = {
      name: '',  // Required field empty
      email: 'invalid-email',  // Invalid format
      age: 15   // Below minimum
    };

    await expect(db.users.create(invalidUser))
      .rejects
      .toThrow(ORMValidationError);
  });

  test('should create user with valid data', async () => {
    const validUser = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    };

    const user = await db.users.create(validUser);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});
```

## Best Practices

### 1. Validate Early and Often

```typescript
// ✅ Good: Validate on input
function handleInputChange(field: string, value: any) {
  validateField(field, value);
  updateFormData(field, value);
}

// ✅ Good: Validate before submission
function handleSubmit() {
  if (validateForm()) {
    submitForm();
  }
}
```

### 2. Provide Clear Error Messages

```typescript
// ✅ Good: Specific, actionable messages
const errors = {
  'email-required': 'Please enter your email address',
  'email-invalid': 'Please enter a valid email address',
  'password-weak': 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
};

// ❌ Bad: Generic messages
const badErrors = {
  'field-error': 'Invalid input',
  'validation-failed': 'Please check your input'
};
```

### 3. Use Progressive Enhancement

```typescript
// Start with basic validation, add advanced features
class FormValidator {
  constructor(private schema: any) {}
  
  // Basic validation
  validate(data: any): ValidationError[] {
    return WebValidator.validateSchema(data, this.schema);
  }
  
  // Enhanced validation with custom rules
  validateEnhanced(data: any): Promise<ValidationError[]> {
    const basicErrors = this.validate(data);
    const customErrors = this.validateCustomRules(data);
    return Promise.resolve([...basicErrors, ...customErrors]);
  }
}
```

### 4. Handle Validation Gracefully

```typescript
async function safeCreateUser(userData: any) {
  try {
    return await db.users.create(userData);
  } catch (error) {
    if (error instanceof ORMValidationError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.field,
          message: formatUserFriendlyMessage(err.message)
        }))
      };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

## Next Steps

- [Error Handling](error-handling.md) - Learn comprehensive error handling
- [Testing](testing.md) - Test your validation logic thoroughly
- [Schema Definition](schema-definition.md) - Design better schemas