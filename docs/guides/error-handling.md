# Error Handling Guide

Master error handling in Appwrite ORM applications to build robust, user-friendly systems that gracefully handle failures and provide meaningful feedback.

## Error Types

### ORM-Specific Errors

#### ORMValidationError

Thrown when data validation fails during create or update operations.

```typescript
import { ORMValidationError } from 'appwrite-orm';

try {
  await db.users.create({
    name: '',  // Required field empty
    age: -5    // Below minimum value
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    console.log('Validation failed:');
    error.errors.forEach(err => {
      console.log(`- ${err.field}: ${err.message}`);
    });
  }
}
```

#### ORMMigrationError

Thrown when database migration operations fail (server-only).

```typescript
import { ORMMigrationError } from 'appwrite-orm/server';

try {
  await migration.migrate([userTable]);
} catch (error) {
  if (error instanceof ORMMigrationError) {
    console.error('Migration failed:', error.message);
    // Handle migration-specific recovery
  }
}
```

### Appwrite SDK Errors

The ORM passes through Appwrite SDK errors for network and database issues.

```typescript
try {
  const user = await db.users.get('non-existent-id');
} catch (error) {
  // Appwrite error codes
  if (error.code === 404) {
    console.log('Document not found');
  } else if (error.code === 401) {
    console.log('Unauthorized access');
  } else if (error.code === 500) {
    console.log('Server error');
  }
}
```

## Error Handling Patterns

### Basic Try-Catch Pattern

```typescript
async function createUser(userData: any) {
  try {
    const user = await db.users.create(userData);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof ORMValidationError) {
      return {
        success: false,
        type: 'validation',
        errors: error.errors
      };
    }
    
    return {
      success: false,
      type: 'unknown',
      message: error.message
    };
  }
}
```

### Comprehensive Error Handler

```typescript
class ErrorHandler {
  static handle(error: any): ErrorResponse {
    if (error instanceof ORMValidationError) {
      return {
        success: false,
        type: 'validation',
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.field,
          message: err.message,
          value: err.value
        }))
      };
    }
    
    if (error instanceof ORMMigrationError) {
      return {
        success: false,
        type: 'migration',
        message: 'Database migration failed',
        details: error.message
      };
    }
    
    // Appwrite errors
    if (error.code) {
      return this.handleAppwriteError(error);
    }
    
    // Unknown errors
    return {
      success: false,
      type: 'unknown',
      message: 'An unexpected error occurred',
      details: error.message
    };
  }
  
  private static handleAppwriteError(error: any): ErrorResponse {
    const errorMap: Record<number, string> = {
      400: 'Bad request - please check your input',
      401: 'Unauthorized - please log in',
      403: 'Forbidden - insufficient permissions',
      404: 'Resource not found',
      409: 'Conflict - resource already exists',
      429: 'Too many requests - please try again later',
      500: 'Server error - please try again later'
    };
    
    return {
      success: false,
      type: 'appwrite',
      message: errorMap[error.code] || 'An error occurred',
      code: error.code,
      details: error.message
    };
  }
}

interface ErrorResponse {
  success: false;
  type: 'validation' | 'migration' | 'appwrite' | 'unknown';
  message: string;
  code?: number;
  details?: any;
}
```

## Web Application Error Handling

### React Error Boundaries

```typescript
import React, { Component, ReactNode } from 'react';
import { ORMValidationError } from 'appwrite-orm/web';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ORMErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    if (error instanceof ORMValidationError) {
      console.log('Validation error caught:', error.errors);
    } else {
      console.error('Unexpected error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error instanceof ORMValidationError) {
        return (
          <div className="validation-error">
            <h3>Please correct the following errors:</h3>
            <ul>
              {this.state.error.errors.map((err, index) => (
                <li key={index}>{err.field}: {err.message}</li>
              ))}
            </ul>
          </div>
        );
      }
      
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ORMErrorBoundary>
      <UserForm />
    </ORMErrorBoundary>
  );
}
```

### React Hook for Error Handling

```typescript
import { useState, useCallback } from 'react';
import { ORMValidationError } from 'appwrite-orm/web';

interface UseErrorHandlerReturn {
  error: string | null;
  validationErrors: ValidationError[];
  handleError: (error: any) => void;
  clearError: () => void;
  isLoading: boolean;
  withErrorHandling: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: any) => {
    if (error instanceof ORMValidationError) {
      setValidationErrors(error.errors);
      setError('Please correct the validation errors');
    } else if (error.code === 404) {
      setError('Resource not found');
    } else if (error.code === 401) {
      setError('Please log in to continue');
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  const withErrorHandling = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      const result = await fn();
      return result;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    validationErrors,
    handleError,
    clearError,
    isLoading,
    withErrorHandling
  };
}

// Usage in component
function UserForm() {
  const { error, validationErrors, withErrorHandling, isLoading } = useErrorHandler();
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = await withErrorHandling(async () => {
      return await db.users.create(formData);
    });
    
    if (user) {
      console.log('User created successfully:', user);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      {validationErrors.map(err => (
        <div key={err.field} className="field-error">
          {err.field}: {err.message}
        </div>
      ))}
      
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Vue.js Error Handling

```typescript
import { ref, computed } from 'vue';
import { ORMValidationError } from 'appwrite-orm/web';

export function useErrorHandler() {
  const error = ref<string | null>(null);
  const validationErrors = ref<ValidationError[]>([]);
  const isLoading = ref(false);

  const hasError = computed(() => error.value !== null || validationErrors.value.length > 0);

  const handleError = (err: any) => {
    if (err instanceof ORMValidationError) {
      validationErrors.value = err.errors;
      error.value = 'Please correct the validation errors';
    } else if (err.code === 404) {
      error.value = 'Resource not found';
    } else {
      error.value = 'An unexpected error occurred';
    }
  };

  const clearError = () => {
    error.value = null;
    validationErrors.value = [];
  };

  const withErrorHandling = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      isLoading.value = true;
      clearError();
      return await fn();
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    error: readonly(error),
    validationErrors: readonly(validationErrors),
    hasError,
    isLoading: readonly(isLoading),
    handleError,
    clearError,
    withErrorHandling
  };
}
```

## Server Application Error Handling

### Express.js Error Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { ORMValidationError, ORMMigrationError } from 'appwrite-orm/server';

function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error occurred:', error);

  if (error instanceof ORMValidationError) {
    return res.status(400).json({
      success: false,
      type: 'validation',
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.field,
        message: err.message
      }))
    });
  }

  if (error instanceof ORMMigrationError) {
    return res.status(500).json({
      success: false,
      type: 'migration',
      message: 'Database migration failed',
      details: error.message
    });
  }

  // Appwrite errors
  if (error.code) {
    const statusCode = getStatusCodeFromAppwriteError(error.code);
    return res.status(statusCode).json({
      success: false,
      type: 'appwrite',
      message: getMessageFromAppwriteError(error.code),
      code: error.code
    });
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    type: 'unknown',
    message: 'Internal server error'
  });
}

function getStatusCodeFromAppwriteError(code: number): number {
  const codeMap: Record<number, number> = {
    400: 400, // Bad Request
    401: 401, // Unauthorized
    403: 403, // Forbidden
    404: 404, // Not Found
    409: 409, // Conflict
    429: 429, // Too Many Requests
    500: 500  // Internal Server Error
  };
  
  return codeMap[code] || 500;
}

function getMessageFromAppwriteError(code: number): string {
  const messageMap: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource not found',
    409: 'Resource already exists',
    429: 'Too many requests',
    500: 'Internal server error'
  };
  
  return messageMap[code] || 'An error occurred';
}

// Usage
app.use(errorHandler);
```

### Async Route Handler Wrapper

```typescript
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.post('/users', asyncHandler(async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201).json({ success: true, data: user });
}));

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.users.getOrFail(req.params.id);
  res.json({ success: true, data: user });
}));
```

### Service Layer Error Handling

```typescript
class UserService {
  static async createUser(userData: any): Promise<ServiceResult<User>> {
    try {
      const user = await db.users.create(userData);
      return { success: true, data: user };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async getUserById(id: string): Promise<ServiceResult<User>> {
    try {
      const user = await db.users.get(id);
      if (!user) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'User not found',
            code: 404
          }
        };
      }
      return { success: true, data: user };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private static handleError(error: any): ServiceResult<never> {
    if (error instanceof ORMValidationError) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          details: error.errors,
          code: 400
        }
      };
    }

    return {
      success: false,
      error: {
        type: 'unknown',
        message: 'An unexpected error occurred',
        code: 500
      }
    };
  }
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    code: number;
    details?: any;
  };
}
```

## Retry and Recovery Strategies

### Exponential Backoff Retry

```typescript
class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry validation errors
        if (error instanceof ORMValidationError) {
          throw error;
        }
        
        // Don't retry client errors (4xx)
        if (error.code && error.code >= 400 && error.code < 500) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Usage
async function createUserWithRetry(userData: any) {
  return await RetryHandler.withRetry(async () => {
    return await db.users.create(userData);
  });
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker();

async function safeCreateUser(userData: any) {
  return await circuitBreaker.execute(async () => {
    return await db.users.create(userData);
  });
}
```

## Logging and Monitoring

### Structured Logging

```typescript
interface LogContext {
  operation: string;
  userId?: string;
  data?: any;
  error?: any;
  duration?: number;
}

class Logger {
  static info(message: string, context?: LogContext) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  static error(message: string, context?: LogContext) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  static warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
}

// Usage in error handling
async function createUserWithLogging(userData: any) {
  const startTime = Date.now();
  
  try {
    Logger.info('Creating user', { 
      operation: 'create_user',
      data: { email: userData.email } // Don't log sensitive data
    });
    
    const user = await db.users.create(userData);
    
    Logger.info('User created successfully', {
      operation: 'create_user',
      userId: user.$id,
      duration: Date.now() - startTime
    });
    
    return user;
  } catch (error) {
    Logger.error('Failed to create user', {
      operation: 'create_user',
      error: {
        type: error.constructor.name,
        message: error.message,
        ...(error instanceof ORMValidationError && { errors: error.errors })
      },
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}
```

### Error Metrics

```typescript
class ErrorMetrics {
  private static errorCounts = new Map<string, number>();
  
  static recordError(errorType: string, operation: string) {
    const key = `${errorType}:${operation}`;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }
  
  static getErrorCounts() {
    return Object.fromEntries(this.errorCounts);
  }
  
  static resetCounts() {
    this.errorCounts.clear();
  }
}

// Usage
function handleError(error: any, operation: string) {
  if (error instanceof ORMValidationError) {
    ErrorMetrics.recordError('validation', operation);
  } else if (error.code) {
    ErrorMetrics.recordError(`appwrite_${error.code}`, operation);
  } else {
    ErrorMetrics.recordError('unknown', operation);
  }
}
```

## Testing Error Scenarios

### Unit Testing Error Handling

```typescript
import { ORMValidationError } from 'appwrite-orm';

describe('Error handling', () => {
  test('should handle validation errors', async () => {
    const invalidData = { name: '', age: -5 };
    
    await expect(db.users.create(invalidData))
      .rejects
      .toThrow(ORMValidationError);
  });
  
  test('should handle not found errors', async () => {
    await expect(db.users.getOrFail('non-existent'))
      .rejects
      .toThrow('not found');
  });
  
  test('should return null for get() with invalid ID', async () => {
    const user = await db.users.get('non-existent');
    expect(user).toBeNull();
  });
});
```

### Integration Testing

```typescript
describe('User service error handling', () => {
  test('should return error result for invalid data', async () => {
    const result = await UserService.createUser({ name: '' });
    
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('validation');
  });
  
  test('should return not found for missing user', async () => {
    const result = await UserService.getUserById('non-existent');
    
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('not_found');
  });
});
```

## Best Practices

### 1. Fail Fast, Fail Clearly

```typescript
// ✅ Good: Clear, specific error handling
async function updateUser(id: string, data: any) {
  if (!id) {
    throw new Error('User ID is required');
  }
  
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data is required');
  }
  
  return await db.users.update(id, data);
}

// ❌ Bad: Silent failures or unclear errors
async function badUpdateUser(id: string, data: any) {
  try {
    return await db.users.update(id || '', data || {});
  } catch {
    return null; // Silent failure
  }
}
```

### 2. Provide Context in Errors

```typescript
// ✅ Good: Contextual error information
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

// ❌ Bad: Generic error messages
throw new Error('Not found');
```

### 3. Handle Errors at the Right Level

```typescript
// ✅ Good: Handle errors where you can take action
async function getUserProfile(userId: string) {
  try {
    const user = await db.users.getOrFail(userId);
    return formatUserProfile(user);
  } catch (error) {
    if (error.message.includes('not found')) {
      return createGuestProfile();
    }
    throw error; // Re-throw if we can't handle it
  }
}

// ❌ Bad: Catching and ignoring errors
async function badGetUserProfile(userId: string) {
  try {
    const user = await db.users.getOrFail(userId);
    return formatUserProfile(user);
  } catch {
    return null; // Lost error information
  }
}
```

### 4. Use Type-Safe Error Handling

```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function safeCreateUser(userData: any): Promise<Result<User, ValidationError[]>> {
  try {
    const user = await db.users.create(userData);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof ORMValidationError) {
      return { success: false, error: error.errors };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

## Next Steps

- [Testing](testing.md) - Learn to test error scenarios
- [Data Validation](data-validation.md) - Prevent errors with validation
- [API Reference](../api/overview.md) - Understand all error types