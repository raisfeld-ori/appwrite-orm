# Changelog

All notable changes to the Appwrite ORM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **`autoValidate` configuration option**: Automatically validates database structure on initialization (defaults to `true`)
  - When `autoValidate` is `true`, the ORM validates that all collections and required attributes exist
  - Always enabled when `autoMigrate` is `true`
  - Helps catch schema mismatches early during development
  - Can be disabled for faster initialization when schema is known to be correct
- **Optional `id` field in `TableDefinition`**: Collection ID now defaults to the table name if not specified
  - Simplifies table definitions for new projects
  - Allows custom collection IDs when needed (e.g., legacy migrations, naming conventions)
  - Backward compatible - existing code with explicit IDs continues to work
- **Validation method in Migration class**: New `validate()` method checks database structure without modifying it
  - Used by `autoValidate` feature to verify collections and attributes
  - Provides detailed error messages about missing collections or attributes
  - Available for both ServerORM and WebORM
- Comprehensive documentation with MkDocs
- Advanced query examples and patterns
- Migration system documentation
- Testing guide with examples
- Performance optimization patterns

### Changed
- **`TableDefinition` interface**: Added optional `id?: string` property
  - Default behavior: Uses `name` as collection ID if `id` is not provided
  - Breaking change: None (fully backward compatible)
- **`ORMConfig` interface**: Added `autoValidate?: boolean` property (defaults to `true`)
  - Automatically set to `true` when `autoMigrate` is `true`
  - Can be explicitly set to `false` to skip validation
- **ServerORM initialization**: Now validates database structure when `autoValidate` is enabled
  - Checks for missing collections and attributes before allowing queries
  - Throws `ORMMigrationError` with details if validation fails
- **WebORM initialization**: Now validates that collections exist when `autoValidate` is enabled
  - Provides helpful error messages suggesting to create collections or use ServerORM with autoMigrate
  - Method signature changed from synchronous to asynchronous (`init()` now returns a Promise)
- Improved error handling with custom error types
- Enhanced type safety across all modules
- Better validation error messages

### Fixed
- Type inference issues in complex schemas
- Migration error handling edge cases

## [0.0.1] - 2024-01-15

### Added
- Initial release of Appwrite ORM
- Core ORM functionality for web and server environments
- Type-safe schema definitions with validation
- Automatic migration support (server-only)
- SQLAlchemy-inspired query interface
- Comprehensive CRUD operations
- Support for relationships through foreign keys
- Built-in data validation with custom error types
- Web and server-specific implementations
- TypeScript support with full type inference
- Jest testing framework integration
- CI/CD workflows for automated testing and releases

### Features

#### Core ORM
- `WebORM` class for browser environments
- `ServerORM` class for Node.js environments with migration support
- `BaseTable` class with comprehensive query methods
- Type-safe table definitions with `TableDefinition` interface
- Automatic type inference from schema definitions

#### Query Interface
- `create()` - Create new documents with validation
- `get()` / `getOrFail()` - Retrieve documents by ID
- `update()` - Update existing documents
- `delete()` - Remove documents
- `query()` - Filter documents with simple criteria
- `all()` - Retrieve all documents with pagination
- `first()` / `firstOrFail()` - Get first matching document
- `count()` - Count matching documents
- `find()` - Complex queries using Appwrite Query builder

#### Validation System
- Field-level validation (required, type, constraints)
- String validation (size limits)
- Number validation (min/max ranges)
- Enum validation with predefined values
- Custom validation error types (`ORMValidationError`)
- Client-side and server-side validation

#### Migration System (Server-only)
- Automatic schema migration with `autoMigrate` option
- Manual migration control for production environments
- `Migration` class for schema management
- `AttributeManager` for Appwrite attribute operations
- `PermissionManager` for collection permissions

#### Type System
- Full TypeScript support with strict typing
- Automatic type inference from schema definitions
- Support for all Appwrite attribute types
- Type-safe query results and operations
- Custom error types with detailed information

#### Testing
- Jest configuration with TypeScript support
- Test utilities and helpers
- Integration test examples
- Mocking strategies for unit tests
- CI/CD integration with GitHub Actions

### Schema Types Supported
- `string` - Text fields with size constraints
- `number` - Numeric fields with min/max validation
- `boolean` - True/false values with defaults
- `Date` - Date and time values
- `enum` - Predefined string values with validation

### Validation Features
- Required field validation
- Type checking and conversion
- String length validation
- Number range validation
- Enum value validation
- Default value assignment
- Custom error messages with field context

### Migration Features
- Automatic collection creation
- Attribute addition and updates
- Schema version management
- Migration error handling
- Rollback support (manual)

### Developer Experience
- IntelliSense support with full type information
- Detailed error messages with field-level context
- Comprehensive documentation and examples
- Easy setup with minimal configuration
- Familiar SQLAlchemy-inspired API

### Package Structure
- Main package: `appwrite-orm`
- Web-only: `appwrite-orm/web`
- Server-only: `appwrite-orm/server`
- Shared utilities and types
- Separate builds for different environments

### Dependencies
- `appwrite` SDK (peer dependency)
- TypeScript support
- Node.js 18+ compatibility
- Browser compatibility (modern browsers)

### Documentation
- Complete API reference
- Getting started guide
- Schema definition examples
- Query pattern documentation
- Migration guides
- Testing strategies
- Best practices and patterns

### Known Limitations
- No built-in relationship management (use foreign keys)
- Limited to Appwrite's query capabilities
- No automatic index management
- Migration rollback requires manual intervention
- No built-in caching layer

### Breaking Changes
- None (initial release)

### Migration Guide
- None (initial release)

---

## Release Notes Format

For future releases, we follow this format:

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes and corrections

### Security
- Security-related changes and fixes

---

## Versioning Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

### Version History

- `0.0.1` - Initial release with core functionality
- `0.1.0` - Planned: Enhanced query capabilities
- `0.2.0` - Planned: Advanced relationship support
- `1.0.0` - Planned: Stable API with full feature set

---

## Contributing

See [CONTRIBUTING.md](contributing.md) for information about contributing to this project.

## Support

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and community support
- Documentation: Comprehensive guides and API reference