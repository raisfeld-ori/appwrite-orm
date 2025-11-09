# Testing Guide

Learn how to effectively test your Appwrite ORM applications with comprehensive testing strategies, from unit tests to integration tests.

## Testing Setup

### Jest Configuration

The project includes Jest configuration for testing:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Test Environment Setup

```typescript
// tests/setup.ts
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test timeout
jest.setTimeout(30000);
```

### Environment Variables for Testing

```bash
# .env.test
APPWRITE_ENDPOINT=https://test.appwrite.io/v1
APPWRITE_PROJECT_ID=test-project-id
APPWRITE_DATABASE_ID=test-database-id
APPWRITE_API_KEY=test-api-key
```

## Unit Testing

### Testing Schema Validation

```typescript
// tests/validation.test.ts
import { Validator, ValidationError } from '../src/shared/utils';
import { DatabaseField } from '../src/shared/types';

describe('Validator', () => {
  describe('validateField', () => {
    test('should validate required string fields', () => {
      const field: DatabaseField = { type: 'string', required: true };
      
      // Valid case
      const validErrors = Validator.validateField('John Doe', field, 'name');
      expect(validErrors).toHaveLength(0);
      
      // Invalid cases
      const emptyErrors = Validator.validateField('', field, 'name');
      expect(emptyErrors).toHaveLength(1);
      expect(emptyErrors[0].message).toBe('Field is required');
      
      const nullErrors = Validator.validateField(null, field, 'name');
      expect(nullErrors).toHaveLength(1);
    });

    test('should validate string size constraints', () => {
      const field: DatabaseField = { type: 'string', size: 10 };
      
      const validErrors = Validator.validateField('short', field, 'text');
      expect(validErrors).toHaveLength(0);
      
      const invalidErrors = Validator.validateField('this is too long', field, 'text');
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].message).toContain('exceeds maximum');
    });

    test('should validate number constraints', () => {
      const field: DatabaseField = { type: 'number', min: 0, max: 100 };
      
      // Valid cases
      expect(Validator.validateField(50, field, 'score')).toHaveLength(0);
      expect(Validator.validateField(0, field, 'score')).toHaveLength(0);
      expect(Validator.validateField(100, field, 'score')).toHaveLength(0);
      
      // Invalid cases
      const belowMinErrors = Validator.validateField(-1, field, 'score');
      expect(belowMinErrors).toHaveLength(1);
      expect(belowMinErrors[0].message).toContain('below minimum');
      
      const aboveMaxErrors = Validator.validateField(101, field, 'score');
      expect(aboveMaxErrors).toHaveLength(1);
      expect(aboveMaxErrors[0].message).toContain('exceeds maximum');
    });

    test('should validate enum fields', () => {
      const field: DatabaseField = {
        type: ['admin', 'user', 'guest'],
        enum: ['admin', 'user', 'guest']
      };
      
      // Valid cases
      expect(Validator.validateField('admin', field, 'role')).toHaveLength(0);
      expect(Validator.validateField('user', field, 'role')).toHaveLength(0);
      
      // Invalid case
      const invalidErrors = Validator.validateField('superuser', field, 'role');
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].message).toContain('must be one of');
    });

    test('should validate type mismatches', () => {
      const stringField: DatabaseField = { type: 'string' };
      const numberField: DatabaseField = { type: 'number' };
      const booleanField: DatabaseField = { type: 'boolean' };
      
      // Type mismatches
      expect(Validator.validateField(123, stringField, 'name')).toHaveLength(1);
      expect(Validator.validateField('abc', numberField, 'age')).toHaveLength(1);
      expect(Validator.validateField('true', booleanField, 'active')).toHaveLength(1);
    });
  });
});
```

### Testing Type Mapping

```typescript
// tests/type-mapper.test.ts
import { TypeMapper } from '../src/shared/utils';

describe('TypeMapper', () => {
  describe('toAppwriteType', () => {
    test('should map TypeScript types to Appwrite types', () => {
      expect(TypeMapper.toAppwriteType('string')).toBe('string');
      expect(TypeMapper.toAppwriteType('number')).toBe('integer');
      expect(TypeMapper.toAppwriteType('boolean')).toBe('boolean');
      expect(TypeMapper.toAppwriteType('Date')).toBe('datetime');
      expect(TypeMapper.toAppwriteType(['a', 'b', 'c'])).toBe('enum');
    });
  });

  describe('fromAppwriteType', () => {
    test('should map Appwrite types to TypeScript types', () => {
      expect(TypeMapper.fromAppwriteType('string')).toBe('string');
      expect(TypeMapper.fromAppwriteType('integer')).toBe('number');
      expect(TypeMapper.fromAppwriteType('float')).toBe('number');
      expect(TypeMapper.fromAppwriteType('boolean')).toBe('boolean');
      expect(TypeMapper.fromAppwriteType('datetime')).toBe('Date');
      expect(TypeMapper.fromAppwriteType('enum')).toEqual([]);
    });
  });
});
```

### Testing Error Classes

```typescript
// tests/errors.test.ts
import { ORMValidationError, ValidationError } from '../src/shared/types';

describe('ORMValidationError', () => {
  test('should create error with validation details', () => {
    const errors: ValidationError[] = [
      { field: 'name', message: 'Field is required' },
      { field: 'age', message: 'Value is below minimum', value: -5 }
    ];
    
    const ormError = new ORMValidationError(errors);
    
    expect(ormError.name).toBe('ORMValidationError');
    expect(ormError.errors).toEqual(errors);
    expect(ormError.message).toContain('name: Field is required');
    expect(ormError.message).toContain('age: Value is below minimum');
  });

  test('should be instanceof Error', () => {
    const errors: ValidationError[] = [
      { field: 'test', message: 'Test error' }
    ];
    
    const ormError = new ORMValidationError(errors);
    
    expect(ormError instanceof Error).toBe(true);
    expect(ormError instanceof ORMValidationError).toBe(true);
  });
});
```

## Integration Testing

### Test Database Setup

```typescript
// tests/test-database.ts
import { ServerORM, TableDefinition } from '../src/server';

export const testUserTable: TableDefinition = {
  name: 'test_users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    isActive: { type: 'boolean', default: true }
  }
};

export const testPostTable: TableDefinition = {
  name: 'test_posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
    isPublished: { type: 'boolean', default: false }
  }
};

export async function setupTestDatabase() {
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true
  });

  return await orm.init([testUserTable, testPostTable]);
}

export async function cleanupTestData(db: any) {
  // Clean up test data after tests
  const users = await db.test_users.all();
  const posts = await db.test_posts.all();
  
  await Promise.all([
    ...users.map((user: any) => db.test_users.delete(user.$id)),
    ...posts.map((post: any) => db.test_posts.delete(post.$id))
  ]);
}
```

### Testing CRUD Operations

```typescript
// tests/integration/crud.test.ts
import { setupTestDatabase, cleanupTestData } from '../test-database';
import { ORMValidationError } from '../../src/shared/types';

describe('CRUD Operations', () => {
  let db: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestData(db);
  });

  describe('Create operations', () => {
    test('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = await db.test_users.create(userData);

      expect(user.$id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBe(userData.age);
      expect(user.isActive).toBe(true); // Default value
    });

    test('should throw validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Required field empty
        email: 'john@example.com',
        age: -5   // Below minimum
      };

      await expect(db.test_users.create(invalidData))
        .rejects
        .toThrow(ORMValidationError);
    });

    test('should apply default values', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const user = await db.test_users.create(userData);
      expect(user.isActive).toBe(true);
    });
  });

  describe('Read operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await db.test_users.create({
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      });
    });

    test('should get user by ID', async () => {
      const user = await db.test_users.get(testUser.$id);
      
      expect(user).not.toBeNull();
      expect(user.$id).toBe(testUser.$id);
      expect(user.name).toBe('Test User');
    });

    test('should return null for non-existent ID', async () => {
      const user = await db.test_users.get('non-existent-id');
      expect(user).toBeNull();
    });

    test('should throw error with getOrFail for non-existent ID', async () => {
      await expect(db.test_users.getOrFail('non-existent-id'))
        .rejects
        .toThrow('not found');
    });

    test('should get all users', async () => {
      // Create another user
      await db.test_users.create({
        name: 'Another User',
        email: 'another@example.com'
      });

      const users = await db.test_users.all();
      expect(users).toHaveLength(2);
    });

    test('should count users', async () => {
      const count = await db.test_users.count();
      expect(count).toBe(1);
    });
  });

  describe('Update operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await db.test_users.create({
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      });
    });

    test('should update user data', async () => {
      const updatedUser = await db.test_users.update(testUser.$id, {
        name: 'Updated Name',
        age: 26
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.age).toBe(26);
      expect(updatedUser.email).toBe('test@example.com'); // Unchanged
    });

    test('should validate update data', async () => {
      await expect(db.test_users.update(testUser.$id, {
        age: -10 // Invalid value
      })).rejects.toThrow(ORMValidationError);
    });
  });

  describe('Delete operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await db.test_users.create({
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('should delete user', async () => {
      await db.test_users.delete(testUser.$id);
      
      const user = await db.test_users.get(testUser.$id);
      expect(user).toBeNull();
    });
  });
});
```

### Testing Query Operations

```typescript
// tests/integration/queries.test.ts
import { setupTestDatabase, cleanupTestData } from '../test-database';
import { Query } from 'appwrite';

describe('Query Operations', () => {
  let db: any;
  let testUsers: any[];

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  beforeEach(async () => {
    // Create test data
    testUsers = await Promise.all([
      db.test_users.create({ name: 'Alice', email: 'alice@example.com', age: 25, isActive: true }),
      db.test_users.create({ name: 'Bob', email: 'bob@example.com', age: 30, isActive: false }),
      db.test_users.create({ name: 'Charlie', email: 'charlie@example.com', age: 35, isActive: true })
    ]);
  });

  afterEach(async () => {
    await cleanupTestData(db);
  });

  describe('Simple queries', () => {
    test('should filter by single field', async () => {
      const activeUsers = await db.test_users.query({ isActive: true });
      
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.map((u: any) => u.name)).toContain('Alice');
      expect(activeUsers.map((u: any) => u.name)).toContain('Charlie');
    });

    test('should filter by multiple fields', async () => {
      const activeAdults = await db.test_users.query({
        isActive: true,
        age: 35
      });
      
      expect(activeAdults).toHaveLength(1);
      expect(activeAdults[0].name).toBe('Charlie');
    });

    test('should get first matching record', async () => {
      const firstActive = await db.test_users.first({ isActive: true });
      
      expect(firstActive).not.toBeNull();
      expect(firstActive.isActive).toBe(true);
    });

    test('should count matching records', async () => {
      const activeCount = await db.test_users.count({ isActive: true });
      expect(activeCount).toBe(2);
    });
  });

  describe('Advanced queries', () => {
    test('should use complex queries with Query builder', async () => {
      const adults = await db.test_users.find([
        Query.greaterThanEqual('age', 30)
      ]);
      
      expect(adults).toHaveLength(2);
      expect(adults.map((u: any) => u.name)).toContain('Bob');
      expect(adults.map((u: any) => u.name)).toContain('Charlie');
    });

    test('should sort results', async () => {
      const usersByAge = await db.test_users.all({
        orderBy: ['age']
      });
      
      expect(usersByAge[0].name).toBe('Alice'); // age 25
      expect(usersByAge[1].name).toBe('Bob');   // age 30
      expect(usersByAge[2].name).toBe('Charlie'); // age 35
    });

    test('should paginate results', async () => {
      const firstPage = await db.test_users.all({
        limit: 2,
        offset: 0,
        orderBy: ['name']
      });
      
      expect(firstPage).toHaveLength(2);
      
      const secondPage = await db.test_users.all({
        limit: 2,
        offset: 2,
        orderBy: ['name']
      });
      
      expect(secondPage).toHaveLength(1);
    });

    test('should select specific fields', async () => {
      const users = await db.test_users.all({
        select: ['name', 'email']
      });
      
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('$id');
      // Age should not be included (though Appwrite might still return it)
    });
  });
});
```

### Testing Relationships

```typescript
// tests/integration/relationships.test.ts
import { setupTestDatabase, cleanupTestData } from '../test-database';

describe('Relationship Operations', () => {
  let db: any;
  let testUser: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  beforeEach(async () => {
    testUser = await db.test_users.create({
      name: 'Author',
      email: 'author@example.com'
    });
  });

  afterEach(async () => {
    await cleanupTestData(db);
  });

  test('should create related records', async () => {
    const post = await db.test_posts.create({
      title: 'Test Post',
      content: 'This is a test post',
      authorId: testUser.$id
    });

    expect(post.authorId).toBe(testUser.$id);
  });

  test('should query related records', async () => {
    // Create posts for the user
    await Promise.all([
      db.test_posts.create({
        title: 'Post 1',
        content: 'Content 1',
        authorId: testUser.$id
      }),
      db.test_posts.create({
        title: 'Post 2',
        content: 'Content 2',
        authorId: testUser.$id
      })
    ]);

    const userPosts = await db.test_posts.query({ authorId: testUser.$id });
    expect(userPosts).toHaveLength(2);
  });

  test('should handle orphaned records', async () => {
    const post = await db.test_posts.create({
      title: 'Test Post',
      content: 'Content',
      authorId: testUser.$id
    });

    // Delete the user
    await db.test_users.delete(testUser.$id);

    // Post should still exist but author won't be found
    const existingPost = await db.test_posts.get(post.$id);
    expect(existingPost).not.toBeNull();

    const author = await db.test_users.get(existingPost.authorId);
    expect(author).toBeNull();
  });
});
```

## Testing Web Components

### React Component Testing

```typescript
// tests/components/UserForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebORM } from '../../src/web';
import UserForm from '../components/UserForm';

// Mock the ORM
jest.mock('../../src/web');

const mockWebORM = WebORM as jest.MockedClass<typeof WebORM>;
const mockDb = {
  users: {
    create: jest.fn()
  }
};

describe('UserForm', () => {
  beforeEach(() => {
    mockWebORM.mockImplementation(() => ({
      init: () => mockDb
    } as any));
    
    mockDb.users.create.mockClear();
  });

  test('should render form fields', () => {
    render(<UserForm />);
    
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(<UserForm />);
    
    const submitButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
    });
    
    expect(mockDb.users.create).not.toHaveBeenCalled();
  });

  test('should submit valid form', async () => {
    const mockUser = { $id: 'user-123', name: 'John Doe', email: 'john@example.com' };
    mockDb.users.create.mockResolvedValue(mockUser);
    
    render(<UserForm />);
    
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Age'), {
      target: { value: '30' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));
    
    await waitFor(() => {
      expect(mockDb.users.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });
  });

  test('should handle validation errors', async () => {
    const validationError = new ORMValidationError([
      { field: 'email', message: 'Invalid email format' }
    ]);
    mockDb.users.create.mockRejectedValue(validationError);
    
    render(<UserForm />);
    
    // Fill and submit form
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'invalid-email' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });
});
```

### Vue Component Testing

```typescript
// tests/components/UserForm.spec.ts
import { mount } from '@vue/test-utils';
import { WebORM } from '../../src/web';
import UserForm from '../components/UserForm.vue';

// Mock the ORM
jest.mock('../../src/web');

const mockWebORM = WebORM as jest.MockedClass<typeof WebORM>;
const mockDb = {
  users: {
    create: jest.fn()
  }
};

describe('UserForm.vue', () => {
  beforeEach(() => {
    mockWebORM.mockImplementation(() => ({
      init: () => mockDb
    } as any));
    
    mockDb.users.create.mockClear();
  });

  test('should render form fields', () => {
    const wrapper = mount(UserForm);
    
    expect(wrapper.find('input[placeholder="Name"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Email"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Age"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  test('should validate and submit form', async () => {
    const mockUser = { $id: 'user-123', name: 'John Doe', email: 'john@example.com' };
    mockDb.users.create.mockResolvedValue(mockUser);
    
    const wrapper = mount(UserForm);
    
    await wrapper.find('input[placeholder="Name"]').setValue('John Doe');
    await wrapper.find('input[placeholder="Email"]').setValue('john@example.com');
    await wrapper.find('input[placeholder="Age"]').setValue('30');
    
    await wrapper.find('form').trigger('submit');
    
    expect(mockDb.users.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
  });
});
```

## Testing Server APIs

### Express Route Testing

```typescript
// tests/routes/users.test.ts
import request from 'supertest';
import express from 'express';
import { setupTestDatabase, cleanupTestData } from '../test-database';
import { createUserRoutes } from '../../src/routes/users';

describe('User Routes', () => {
  let app: express.Application;
  let db: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
    app = express();
    app.use(express.json());
    app.use('/users', createUserRoutes(db));
  });

  afterEach(async () => {
    await cleanupTestData(db);
  });

  describe('POST /users', () => {
    test('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.$id).toBeDefined();
    });

    test('should return validation errors for invalid data', async () => {
      const invalidData = {
        name: '', // Required field empty
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.type).toBe('validation');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /users/:id', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await db.test_users.create({
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('should get user by ID', async () => {
      const response = await request(app)
        .get(`/users/${testUser.$id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.$id).toBe(testUser.$id);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { setupTestDatabase, cleanupTestData } from '../test-database';

describe('Performance Tests', () => {
  let db: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestData(db);
  });

  test('should handle concurrent user creation', async () => {
    const userCount = 100;
    const startTime = Date.now();
    
    const promises = Array.from({ length: userCount }, (_, i) =>
      db.test_users.create({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50)
      })
    );

    const users = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(users).toHaveLength(userCount);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`Created ${userCount} users in ${duration}ms`);
  });

  test('should handle large query results efficiently', async () => {
    // Create test data
    const userCount = 1000;
    const users = await Promise.all(
      Array.from({ length: userCount }, (_, i) =>
        db.test_users.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        })
      )
    );

    const startTime = Date.now();
    const allUsers = await db.test_users.all();
    const duration = Date.now() - startTime;

    expect(allUsers).toHaveLength(userCount);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    console.log(`Queried ${userCount} users in ${duration}ms`);
  });
});
```

## Test Utilities

### Test Data Factories

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export class UserFactory {
  static create(overrides: Partial<any> = {}) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 18, max: 80 }),
      isActive: faker.datatype.boolean(),
      ...overrides
    };
  }

  static createMany(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

export class PostFactory {
  static create(authorId: string, overrides: Partial<any> = {}) {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      authorId,
      isPublished: faker.datatype.boolean(),
      ...overrides
    };
  }
}

// Usage in tests
test('should create multiple users', async () => {
  const userData = UserFactory.createMany(5, { isActive: true });
  
  const users = await Promise.all(
    userData.map(data => db.test_users.create(data))
  );
  
  expect(users).toHaveLength(5);
  users.forEach(user => {
    expect(user.isActive).toBe(true);
  });
});
```

### Custom Matchers

```typescript
// tests/matchers/orm-matchers.ts
import { ORMValidationError } from '../../src/shared/types';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidationError(): R;
      toHaveValidationError(field: string): R;
    }
  }
}

expect.extend({
  toBeValidationError(received) {
    const pass = received instanceof ORMValidationError;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be an ORMValidationError`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be an ORMValidationError`,
        pass: false
      };
    }
  },

  toHaveValidationError(received, field) {
    if (!(received instanceof ORMValidationError)) {
      return {
        message: () => `Expected an ORMValidationError, got ${typeof received}`,
        pass: false
      };
    }

    const hasFieldError = received.errors.some(error => error.field === field);
    
    if (hasFieldError) {
      return {
        message: () => `Expected not to have validation error for field "${field}"`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected to have validation error for field "${field}"`,
        pass: false
      };
    }
  }
});

// Usage
test('should validate required fields', async () => {
  await expect(db.test_users.create({ name: '' }))
    .rejects
    .toBeValidationError();
    
  try {
    await db.test_users.create({ name: '', email: 'invalid' });
  } catch (error) {
    expect(error).toHaveValidationError('name');
    expect(error).toHaveValidationError('email');
  }
});
```

## Best Practices

### 1. Test Structure

```typescript
// ✅ Good: Clear test structure
describe('UserService', () => {
  describe('createUser', () => {
    test('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Act
      const user = await UserService.createUser(userData);
      
      // Assert
      expect(user.name).toBe(userData.name);
    });
  });
});

// ❌ Bad: Unclear test structure
test('user stuff', async () => {
  const user = await db.users.create({ name: 'John' });
  expect(user).toBeTruthy();
  const updated = await db.users.update(user.$id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});
```

### 2. Test Isolation

```typescript
// ✅ Good: Each test is independent
describe('User operations', () => {
  afterEach(async () => {
    await cleanupTestData(db);
  });

  test('should create user', async () => {
    const user = await db.users.create({ name: 'John' });
    expect(user.name).toBe('John');
  });

  test('should update user', async () => {
    const user = await db.users.create({ name: 'John' });
    const updated = await db.users.update(user.$id, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
  });
});
```

### 3. Mock External Dependencies

```typescript
// ✅ Good: Mock external services
jest.mock('../../src/external/email-service');

test('should send welcome email after user creation', async () => {
  const mockSendEmail = jest.fn();
  (EmailService as jest.Mocked<typeof EmailService>).sendWelcomeEmail = mockSendEmail;
  
  await UserService.createUser({ name: 'John', email: 'john@example.com' });
  
  expect(mockSendEmail).toHaveBeenCalledWith('john@example.com');
});
```

### 4. Test Error Scenarios

```typescript
// ✅ Good: Test both success and failure cases
describe('User creation', () => {
  test('should create user with valid data', async () => {
    // Test success case
  });

  test('should throw validation error for invalid data', async () => {
    // Test failure case
  });

  test('should handle database connection errors', async () => {
    // Test infrastructure failure
  });
});
```

## Running Tests

### NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        env:
          APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
          APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
          APPWRITE_DATABASE_ID: ${{ secrets.APPWRITE_DATABASE_ID }}
          APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Next Steps

- [Error Handling](error-handling.md) - Test error scenarios thoroughly
- [Data Validation](data-validation.md) - Test validation logic
- [Examples](../examples/basic-usage.md) - See testing in real applications