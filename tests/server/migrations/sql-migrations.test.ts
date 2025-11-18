import { SqlMigrations } from '../../../src/server/sql-migrations';
import { TableDefinition, ORMMigrationError } from '../../../src/shared/types';

describe('SqlMigrations', () => {
  let sqlMigrations: SqlMigrations;

  beforeEach(() => {
    const mockConfig = {
      endpoint: 'https://test.appwrite.io/v1',
      projectId: 'test-project',
      databaseId: 'test-database'
    };
    sqlMigrations = new SqlMigrations(mockConfig);
  });

  describe('type mapping', () => {
    it('should map string type to VARCHAR', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', size: 100 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('name VARCHAR(100)');
    });

    it('should map string type to VARCHAR(255) by default', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('email VARCHAR(255)');
    });

    it('should map integer type to INTEGER', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('age INTEGER');
    });

    it('should map number type to INTEGER', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          count: { type: 'number' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('count INTEGER');
    });

    it('should map float type to REAL', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          price: { type: 'float' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('price REAL');
    });

    it('should map boolean type to INTEGER', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('isActive INTEGER');
    });

    it('should map Date type to TEXT', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          createdAt: { type: 'Date' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('createdAt TEXT');
    });

    it('should map datetime type to TEXT', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          timestamp: { type: 'datetime' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('timestamp TEXT');
    });

    it('should map enum type to VARCHAR with size', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: ['admin', 'user'], enum: ['admin', 'user'], size: 50 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('role VARCHAR(50)');
    });

    it('should map enum type to VARCHAR(255) by default', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          status: { type: ['active', 'inactive'], enum: ['active', 'inactive'] }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('status VARCHAR(255)');
    });
  });

  describe('constraint generation', () => {
    it('should add PRIMARY KEY constraint for $id field', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('$id VARCHAR(255) PRIMARY KEY');
    });

    it('should add NOT NULL constraint for required fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string', required: true }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('email VARCHAR(255) NOT NULL');
    });

    it('should add DEFAULT constraint for fields with default values', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: 'string', default: 'user' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain("role VARCHAR(255) DEFAULT 'user'");
    });

    it('should add DEFAULT constraint for boolean fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean', default: true }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('isActive INTEGER DEFAULT 1');
    });

    it('should add DEFAULT constraint for numeric fields', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          stock: { type: 'integer', default: 0 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('stock INTEGER DEFAULT 0');
    });

    it('should add UNIQUE constraint from indexes', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] }
        ]
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('UNIQUE (email)');
    });

    it('should add UNIQUE constraint for multiple columns', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        },
        indexes: [
          { key: 'name_idx', type: 'unique', attributes: ['firstName', 'lastName'] }
        ]
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('UNIQUE (firstName, lastName)');
    });

    it('should add CHECK constraint for min value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('CHECK (age >= 0)');
    });

    it('should add CHECK constraint for max value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', max: 120 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('CHECK (age <= 120)');
    });

    it('should add CHECK constraint for min and max values', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0, max: 120 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('CHECK (age >= 0 AND age <= 120)');
    });

    it('should add CHECK constraint for boolean fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('CHECK (isActive IN (0, 1))');
    });

    it('should add CHECK constraint for enum fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: ['admin', 'user'], enum: ['admin', 'user'] }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain("CHECK (role IN ('admin', 'user'))");
    });
  });

  describe('complete table generation', () => {
    it('should generate complete CREATE TABLE statement', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', required: true, size: 100 },
          email: { type: 'string', required: true },
          age: { type: 'integer', min: 0, max: 120 },
          isActive: { type: 'boolean', default: true }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] }
        ]
      };

      const result = sqlMigrations.generateSQL([table]);
      
      expect(result).toContain('CREATE TABLE users');
      expect(result).toContain('$id VARCHAR(255) PRIMARY KEY');
      expect(result).toContain('name VARCHAR(100) NOT NULL');
      expect(result).toContain('email VARCHAR(255) NOT NULL');
      expect(result).toContain('age INTEGER');
      expect(result).toContain('isActive INTEGER DEFAULT 1');
      expect(result).toContain('UNIQUE (email)');
      expect(result).toContain('CHECK (age >= 0 AND age <= 120)');
      expect(result).toContain('CHECK (isActive IN (0, 1))');
    });

    it('should use table id if provided', () => {
      const table: TableDefinition = {
        name: 'users',
        id: 'custom_users_id',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('CREATE TABLE custom_users_id');
    });

    it('should handle multiple indexes', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' },
          username: { type: 'string' }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'username_idx', type: 'unique', attributes: ['username'] }
        ]
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('UNIQUE (email)');
      expect(result).toContain('UNIQUE (username)');
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      const result = sqlMigrations.generateSQL([]);
      expect(result).toBe('-- No tables defined\n');
    });

    it('should handle array fields', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          tags: { type: 'string', array: true }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('tags TEXT');
    });

    it('should not add CHECK constraints for array fields', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          scores: { type: 'integer', array: true, min: 0, max: 100 }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain('scores TEXT');
      expect(result).not.toContain('CHECK (scores');
    });

    it('should handle complex constraints', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          name: { type: 'string', required: true, size: 200 },
          price: { type: 'float', required: true, min: 0 },
          category: { type: ['electronics', 'clothing', 'food'], enum: ['electronics', 'clothing', 'food'], default: 'electronics' },
          inStock: { type: 'boolean', default: true }
        },
        indexes: [
          { key: 'name_idx', type: 'unique', attributes: ['name'] }
        ]
      };

      const result = sqlMigrations.generateSQL([table]);
      
      expect(result).toContain('name VARCHAR(200) NOT NULL');
      expect(result).toContain('price REAL NOT NULL');
      expect(result).toContain("category VARCHAR(255) DEFAULT 'electronics'");
      expect(result).toContain('inStock INTEGER DEFAULT 1');
      expect(result).toContain('UNIQUE (name)');
      expect(result).toContain('CHECK (price >= 0)');
      expect(result).toContain("CHECK (category IN ('electronics', 'clothing', 'food'))");
      expect(result).toContain('CHECK (inStock IN (0, 1))');
    });

    it('should escape single quotes in default values', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string', default: "It's a test" }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain("title VARCHAR(255) DEFAULT 'It''s a test'");
    });

    it('should escape single quotes in enum values', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          status: { type: ["draft", "it's published"], enum: ["draft", "it's published"] }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toContain("CHECK (status IN ('draft', 'it''s published'))");
    });

    it('should throw error for invalid table definition', () => {
      const invalidTable = {
        schema: { name: { type: 'string' } }
      } as any;

      expect(() => {
        sqlMigrations.generateSQL([invalidTable]);
      }).toThrow(ORMMigrationError);
      expect(() => {
        sqlMigrations.generateSQL([invalidTable]);
      }).toThrow("Invalid table definition: missing 'name' or 'schema' field");
    });

    it('should throw error for unsupported field type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          data: { type: 'unsupported' as any }
        }
      };

      expect(() => {
        sqlMigrations.generateSQL([table]);
      }).toThrow(ORMMigrationError);
      expect(() => {
        sqlMigrations.generateSQL([table]);
      }).toThrow("Unsupported field type 'unsupported' for SQL export");
    });
  });

  describe('multiple tables', () => {
    it('should generate SQL for multiple tables', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: {
            name: { type: 'string', required: true }
          }
        },
        {
          name: 'posts',
          schema: {
            title: { type: 'string', required: true },
            userId: { type: 'string', required: true }
          }
        }
      ];

      const result = sqlMigrations.generateSQL(tables);
      
      expect(result).toContain('CREATE TABLE users');
      expect(result).toContain('CREATE TABLE posts');
      expect(result).toContain('name VARCHAR(255) NOT NULL');
      expect(result).toContain('title VARCHAR(255) NOT NULL');
      expect(result).toContain('userId VARCHAR(255) NOT NULL');
    });

    it('should separate multiple tables with blank lines', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: { name: { type: 'string' } }
        },
        {
          name: 'posts',
          schema: { title: { type: 'string' } }
        }
      ];

      const result = sqlMigrations.generateSQL(tables);
      expect(result).toMatch(/CREATE TABLE users[\s\S]+\n\nCREATE TABLE posts/);
    });
  });

  describe('SQL syntax correctness', () => {
    it('should generate valid SQL with proper semicolons', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toMatch(/CREATE TABLE users \([\s\S]+\);/);
    });

    it('should properly format fields with commas', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      };

      const result = sqlMigrations.generateSQL([table]);
      expect(result).toMatch(/\$id VARCHAR\(255\) PRIMARY KEY,\s+name VARCHAR\(255\),\s+email VARCHAR\(255\)/);
    });
  });
});
