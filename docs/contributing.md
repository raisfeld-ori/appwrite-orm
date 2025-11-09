# Contributing to Appwrite ORM

Thank you for your interest in contributing to Appwrite ORM! This guide will help you get started with contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Git
- An Appwrite project for testing

### Development Setup

1. **Fork and Clone the Repository**

```bash
git clone https://github.com/your-username/appwrite-orm.git
cd appwrite-orm
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up Environment Variables**

Create a `.env` file for development:

```bash
cp .env.example .env
```

Fill in your Appwrite project details:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
```

4. **Run Tests**

```bash
npm test
```

5. **Build the Project**

```bash
npm run build
```

## Development Workflow

### Project Structure

```
appwrite-orm/
├── src/
│   ├── shared/          # Common types and utilities
│   ├── web/            # Web-specific implementation
│   ├── server/         # Server-specific implementation
│   └── index.ts        # Main exports
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── setup.ts        # Test configuration
├── docs/               # Documentation
├── dist/               # Built files (generated)
└── examples/           # Usage examples
```

### Code Style and Standards

We use TypeScript with strict type checking and follow these conventions:

#### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public methods
- Avoid `any` type - use proper typing
- Use meaningful variable and function names

```typescript
// ✅ Good
interface UserData {
  name: string;
  email: string;
  age?: number;
}

async function createUser(userData: UserData): Promise<User> {
  // Implementation
}

// ❌ Bad
function createUser(data: any): any {
  // Implementation
}
```

#### Naming Conventions

- **Classes**: PascalCase (`UserService`, `WebORM`)
- **Functions/Methods**: camelCase (`createUser`, `validateData`)
- **Variables**: camelCase (`userData`, `isValid`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_LIMIT`, `MAX_RETRIES`)
- **Files**: kebab-case (`user-service.ts`, `validation-error.ts`)

#### Error Handling

- Use custom error classes for specific error types
- Provide meaningful error messages
- Include context in error messages

```typescript
// ✅ Good
if (!userData.email) {
  throw new ORMValidationError([{
    field: 'email',
    message: 'Email is required',
    value: userData.email
  }]);
}

// ❌ Bad
if (!userData.email) {
  throw new Error('Invalid data');
}
```

### Testing Guidelines

#### Test Structure

- Write tests for all public methods
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Test both success and failure scenarios

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    test('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Act
      const user = await UserService.createUser(userData);
      
      // Assert
      expect(user.name).toBe(userData.name);
      expect(user.$id).toBeDefined();
    });

    test('should throw validation error for invalid data', async () => {
      // Arrange
      const invalidData = { name: '', email: 'invalid' };
      
      // Act & Assert
      await expect(UserService.createUser(invalidData))
        .rejects
        .toThrow(ORMValidationError);
    });
  });
});
```

#### Test Categories

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete workflows

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="validation"
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

1. **Bug Reports**: Help us identify and fix issues
2. **Feature Requests**: Suggest new functionality
3. **Code Contributions**: Implement features or fix bugs
4. **Documentation**: Improve or add documentation
5. **Examples**: Add usage examples and tutorials

### Reporting Issues

When reporting bugs, please include:

- **Clear Description**: What happened vs. what you expected
- **Reproduction Steps**: Minimal steps to reproduce the issue
- **Environment**: Node.js version, OS, Appwrite version
- **Code Sample**: Minimal code that demonstrates the issue

**Bug Report Template:**

```markdown
## Bug Description
Brief description of the issue.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Node.js version: 
- Appwrite ORM version: 
- Appwrite version: 
- OS: 

## Code Sample
```typescript
// Minimal code to reproduce the issue
```

### Feature Requests

For feature requests, please include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other ways to achieve the same goal
- **Examples**: Code examples of how it would be used

### Pull Request Process

1. **Create an Issue First**: For significant changes, create an issue to discuss the approach

2. **Fork and Branch**: Create a feature branch from `main`

```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**: Implement your changes following the coding standards

4. **Add Tests**: Ensure your changes are covered by tests

5. **Update Documentation**: Update relevant documentation

6. **Commit Changes**: Use clear, descriptive commit messages

```bash
git commit -m "feat: add user validation for email field

- Add email format validation
- Include comprehensive error messages
- Add unit tests for validation logic"
```

7. **Push and Create PR**: Push your branch and create a pull request

```bash
git push origin feature/your-feature-name
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(validation): add email format validation
fix(server): resolve migration error handling
docs(api): update query examples
test(web): add integration tests for WebORM
```

### Code Review Process

All contributions go through code review:

1. **Automated Checks**: CI/CD runs tests and linting
2. **Peer Review**: Maintainers review code for quality and design
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, changes are merged

### Review Criteria

We look for:

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it well-written and maintainable?
- **Tests**: Are there adequate tests?
- **Documentation**: Is it properly documented?
- **Performance**: Does it impact performance?
- **Breaking Changes**: Are breaking changes justified and documented?

## Development Best Practices

### API Design

- **Consistency**: Follow existing patterns and conventions
- **Simplicity**: Keep APIs simple and intuitive
- **Type Safety**: Leverage TypeScript for better developer experience
- **Error Handling**: Provide clear error messages and proper error types

### Performance Considerations

- **Lazy Loading**: Load resources only when needed
- **Caching**: Cache expensive operations where appropriate
- **Batch Operations**: Support batch operations for better performance
- **Memory Usage**: Be mindful of memory usage in long-running processes

### Security

- **Input Validation**: Always validate user input
- **SQL Injection**: Use parameterized queries (handled by Appwrite)
- **Authentication**: Respect Appwrite's authentication mechanisms
- **Permissions**: Follow principle of least privilege

## Documentation

### Writing Documentation

- **Clear and Concise**: Use simple, clear language
- **Examples**: Include practical examples
- **Code Samples**: Provide working code samples
- **API Reference**: Document all public APIs
- **Guides**: Create step-by-step guides for common tasks

### Documentation Structure

```markdown
# Title

Brief description of what this covers.

## Overview

High-level explanation.

## Usage

Basic usage examples.

## API Reference

Detailed API documentation.

## Examples

Practical examples.

## Best Practices

Recommended approaches.
```

### Building Documentation

```bash
# Install MkDocs
pip install mkdocs mkdocs-material

# Serve documentation locally
mkdocs serve

# Build documentation
mkdocs build
```

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build and test distribution
5. Create release notes
6. Tag release
7. Publish to npm

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: Real-time chat with the community

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Recognition

Contributors are recognized in:

- Release notes
- Contributors section in README
- Special mentions for significant contributions

## Resources

### Useful Links

- [Appwrite Documentation](https://appwrite.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Development Tools

- **VS Code Extensions**:
  - TypeScript and JavaScript Language Features
  - Jest Runner
  - ESLint
  - Prettier

### Learning Resources

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Testing JavaScript](https://testingjavascript.com/)

## Questions?

If you have questions about contributing, feel free to:

1. Open a discussion on GitHub
2. Create an issue with the `question` label
3. Reach out to maintainers

Thank you for contributing to Appwrite ORM! 🚀