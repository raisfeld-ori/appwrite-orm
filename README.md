# Appwrite ORM

A TypeScript ORM package for Appwrite with separate web and server implementations.

## Installation

```bash
npm install appwrite-orm appwrite
```

## Configuration

### Required Configuration Values

All configuration values (`endpoint`, `projectId`, `databaseId`) are now mandatory and will be validated:

```typescript
import { WebORM, ServerORM } from 'appwrite-orm';

// ✓ Valid configuration
const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id'
};

// ✗ Will throw error for missing values
const invalidConfig = {
  endpoint: '',  // Empty string not allowed
  projectId: 'your-project-id',
  databaseId: 'your-database-id'
};
```

### Environment Variables

Use environment variables for configuration (recommended):

```typescript
// Create a .env file
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key-for-server

// Use in your code
const config = {
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY // Server only
};
```

### Testing with dotenv

The package includes dotenv support for tests. Create a `.env.test` file for test-specific values:

```bash
# .env.test
APPWRITE_ENDPOINT=https://test.appwrite.io/v1
APPWRITE_PROJECT_ID=test-project-id
APPWRITE_DATABASE_ID=test-database-id
APPWRITE_API_KEY=test-api-key
```

## Usage

```typescript
import { Table } from 'appwrite-orm';

// Step 1: create your tables
const testDatabase: Table = {
  name: 'test-collection',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0 },
    isActive: { type: 'boolean', default: true }
  }
};

// step 2: create your ORM config
const config = {
  endpoint: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key-for-server',
  tables: [testDatabase],
  autoMigrate: true, // this will make the ORM autometically create/modify the table to fit. Not reccomended in production code, and especially not on the main appwrite server
};

// Step 3: create your ORM instance

// ---- ON WEB -----
const webORM = new WebORM(config);

// ---- ON NODEJS ---
const serverORM = new ServerORM(config);
```

The ORM has now activated! On web this will autometically validate you database
and throw an error if there's a difference between your schema and the database.

On nodejs this will create a new database if it doesn't exist and validate the schema.
If the schema is different AND autoMigrate is true, then it will modify the database to fit.

## CI/CD & Testing

This package includes comprehensive GitHub Actions workflows for automated testing and releases:

### Automated Testing
- **Pull Request Checks**: Runs tests, builds, type checking, and security audits on every PR
- **Continuous Integration**: Tests against Node.js versions 18.x, 20.x, and 22.x
- **Security Auditing**: Automatically checks for vulnerabilities in dependencies

### Release Automation
- **Automated Publishing**: Publishes to NPM when a new GitHub release is created
- **Release Assets**: Automatically creates and uploads build artifacts
- **Multi-Node Testing**: Ensures compatibility across supported Node.js versions

### Running Tests Locally
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run build
npm run build

# Type checking
npx tsc --noEmit
```

## Contributing

1. Fork the repository
2. Create an appwrite project for testing, and place a .env according to .env.example
3. Create a fork or a branch for your changes
4. Create a pull request

Feel free to also send stuff in discussions on github. This is the first package the I am actually
planning on fully continuing and working on. I just really hate working with dashboards and having to guess the DB structure

## Future plans

Idk fully for now, cause I still haven't thought about where to take this package, but I'd like to fix my biggest issues with appwrite (so far):

1. More types for objects: I want to add support for things like the type domain or the type regex
2. Better sample mock data: Appwrite makes really bad mock data (assumes all 255 strings are names, keeps a lot of things null). I'd like to make some system for this
3. Better error handling: When appwrite throws an error it takes wayyy too long to figure out what happend. I'd like to make it easier
4. Better query support: The appwrite query system is fine. But I'd really like a system like SQLAlchemy where I can just pick a table and filter it with pre-set filters

## License

MIT License - see [LICENSE](LICENSE) file for details.
