import { TextMigrations } from '../../../src/server/text-migrations';
import { TableDefinition, ORMMigrationError } from '../../../src/shared/types';

describe('TextMigrations', () => {
  let textMigrations: TextMigrations;

  beforeEach(() => {
    const mockConfig = {
      endpoint: 'https://test.appwrite.io/v1',
      projectId: 'test-project',
      databaseId: 'test-database'
    };
    textMigrations = new TextMigrations(mockConfig);
  });

  describe('text format structure and readability', () => {
    it('should generate text with header', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      
      expect(result).toContain('Database Schema');
      expect(result).toContain('===============');
    });

    it('should generate collection header with proper formatting', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      
      expect(result).toContain('Collection: users');
      expect(result).toContain('-'.repeat('Collection: users'.length));
    });

    it('should include Fields section', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('Fields:');
    });

    it('should always include $id field', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- $id (string, primary key)');
    });

    it('should use proper indentation for fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toMatch(/\s{2}- \$id/);
      expect(result).toMatch(/\s{2}- name/);
    });

    it('should use table id if provided', () => {
      const table: TableDefinition = {
        name: 'users',
        id: 'custom_users_id',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('Collection: custom_users_id');
    });
  });

  describe('field information completeness', () => {
    it('should display string type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- name (string)');
    });

    it('should display integer type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- age (integer)');
    });

    it('should display number type as integer', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          count: { type: 'number' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- count (integer)');
    });

    it('should display float type', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          price: { type: 'float' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- price (float)');
    });

    it('should display boolean type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- isActive (boolean)');
    });

    it('should display Date type as datetime', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          createdAt: { type: 'Date' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- createdAt (datetime)');
    });

    it('should display datetime type', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          timestamp: { type: 'datetime' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- timestamp (datetime)');
    });

    it('should display enum type with values', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: ['admin', 'user'], enum: ['admin', 'user'] }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- role (enum: admin, user)');
    });

    it('should display required constraint', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string', required: true }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- email (string, required)');
    });

    it('should display array indicator', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          tags: { type: 'string', array: true }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- tags (string, array)');
    });

    it('should display max length for string fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', size: 100 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- name (string, max length: 100)');
    });

    it('should display min constraint', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- age (integer, min: 0)');
    });

    it('should display max constraint', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', max: 120 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- age (integer, max: 120)');
    });

    it('should display min and max constraints', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0, max: 120 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- age (integer, min: 0, max: 120)');
    });

    it('should display string default value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: 'string', default: 'user' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- role (string, default: "user")');
    });

    it('should display numeric default value', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          stock: { type: 'integer', default: 0 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- stock (integer, default: 0)');
    });

    it('should display boolean default value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean', default: true }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- isActive (boolean, default: true)');
    });

    it('should display false boolean default value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isDeleted: { type: 'boolean', default: false }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- isDeleted (boolean, default: false)');
    });

    it('should display null default value', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          middleName: { type: 'string', default: null }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- middleName (string, default: null)');
    });

    it('should display multiple attributes together', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string', required: true, size: 255, default: 'user@example.com' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- email (string, required, max length: 255, default: "user@example.com")');
    });
  });

  describe('index information display', () => {
    it('should display Indexes section when indexes exist', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('Indexes:');
    });

    it('should not display Indexes section when no indexes', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).not.toContain('Indexes:');
    });

    it('should display unique index', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- email_idx (unique): email');
    });

    it('should display key index', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer' }
        },
        indexes: [
          { key: 'age_idx', type: 'key', attributes: ['age'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- age_idx (key): age');
    });

    it('should display composite index', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        },
        indexes: [
          { key: 'name_idx', type: 'key', attributes: ['firstName', 'lastName'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- name_idx (key): firstName, lastName');
    });

    it('should display multiple indexes', () => {
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

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- email_idx (unique): email');
      expect(result).toContain('- username_idx (unique): username');
    });

    it('should use proper indentation for indexes', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          email: { type: 'string' }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      expect(result).toMatch(/\s{2}- email_idx/);
    });
  });

  describe('multiple collections formatting', () => {
    it('should generate text for multiple collections', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: {
            name: { type: 'string' }
          }
        },
        {
          name: 'posts',
          schema: {
            title: { type: 'string' }
          }
        }
      ];

      const result = textMigrations.generateText(tables);
      
      expect(result).toContain('Collection: users');
      expect(result).toContain('Collection: posts');
    });

    it('should separate collections properly', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: {
            name: { type: 'string' }
          }
        },
        {
          name: 'posts',
          schema: {
            title: { type: 'string' }
          }
        }
      ];

      const result = textMigrations.generateText(tables);
      expect(result).toContain('Collection: users');
      expect(result).toContain('Collection: posts');
      expect(result.indexOf('Collection: posts')).toBeGreaterThan(result.indexOf('Collection: users'));
    });

    it('should maintain consistent formatting across collections', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: {
            name: { type: 'string', required: true }
          },
          indexes: [
            { key: 'name_idx', type: 'key', attributes: ['name'] }
          ]
        },
        {
          name: 'posts',
          schema: {
            title: { type: 'string', required: true }
          },
          indexes: [
            { key: 'title_idx', type: 'key', attributes: ['title'] }
          ]
        }
      ];

      const result = textMigrations.generateText(tables);
      
      const userSection = result.substring(result.indexOf('Collection: users'), result.indexOf('Collection: posts'));
      const postSection = result.substring(result.indexOf('Collection: posts'));
      
      expect(userSection).toContain('Fields:');
      expect(userSection).toContain('Indexes:');
      expect(postSection).toContain('Fields:');
      expect(postSection).toContain('Indexes:');
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      const result = textMigrations.generateText([]);
      
      expect(result).toContain('Database Schema');
      expect(result).toContain('No tables defined');
    });

    it('should handle collection with no indexes', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = textMigrations.generateText([table]);
      
      expect(result).toContain('Collection: users');
      expect(result).toContain('Fields:');
      expect(result).not.toContain('Indexes:');
    });

    it('should handle complex field types', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          name: { type: 'string', required: true, size: 200 },
          price: { type: 'float', required: true, min: 0 },
          category: { type: ['electronics', 'clothing', 'food'], enum: ['electronics', 'clothing', 'food'], default: 'electronics' },
          tags: { type: 'string', array: true },
          inStock: { type: 'boolean', default: true }
        }
      };

      const result = textMigrations.generateText([table]);
      
      expect(result).toContain('- name (string, required, max length: 200)');
      expect(result).toContain('- price (float, required, min: 0)');
      expect(result).toContain('- category (enum: electronics, clothing, food, default: "electronics")');
      expect(result).toContain('- tags (string, array)');
      expect(result).toContain('- inStock (boolean, default: true)');
    });

    it('should handle array fields with constraints', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          scores: { type: 'integer', array: true, min: 0, max: 100 }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- scores (integer, array, min: 0, max: 100)');
    });

    it('should throw error for invalid table definition without name', () => {
      const invalidTable = {
        schema: { name: { type: 'string' } }
      } as any;

      expect(() => {
        textMigrations.generateText([invalidTable]);
      }).toThrow(ORMMigrationError);
      expect(() => {
        textMigrations.generateText([invalidTable]);
      }).toThrow("Invalid table definition: missing 'name' or 'schema' field");
    });

    it('should throw error for invalid table definition without schema', () => {
      const invalidTable = {
        name: 'users'
      } as any;

      expect(() => {
        textMigrations.generateText([invalidTable]);
      }).toThrow(ORMMigrationError);
      expect(() => {
        textMigrations.generateText([invalidTable]);
      }).toThrow("Invalid table definition: missing 'name' or 'schema' field");
    });

    it('should handle Date default value', () => {
      const testDate = new Date('2024-01-01T00:00:00.000Z');
      const table: TableDefinition = {
        name: 'events',
        schema: {
          createdAt: { type: 'Date', default: testDate }
        }
      };

      const result = textMigrations.generateText([table]);
      expect(result).toContain('- createdAt (datetime, default: 2024-01-01T00:00:00.000Z)');
    });

    it('should handle empty indexes array', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        },
        indexes: []
      };

      const result = textMigrations.generateText([table]);
      expect(result).not.toContain('Indexes:');
    });
  });

  describe('schema information completeness', () => {
    it('should include all schema information in output', () => {
      const table: TableDefinition = {
        name: 'users',
        id: 'users_collection',
        schema: {
          name: { type: 'string', required: true, size: 100 },
          email: { type: 'string', required: true, size: 255 },
          age: { type: 'integer', min: 0, max: 120 },
          role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' },
          balance: { type: 'float', default: 0, min: 0 },
          isActive: { type: 'boolean', default: true },
          tags: { type: 'string', array: true }
        },
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'age_idx', type: 'key', attributes: ['age'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      
      expect(result).toContain('Collection: users_collection');
      expect(result).toContain('- $id (string, primary key)');
      expect(result).toContain('- name (string, required, max length: 100)');
      expect(result).toContain('- email (string, required, max length: 255)');
      expect(result).toContain('- age (integer, min: 0, max: 120)');
      expect(result).toContain('- role (enum: admin, user, default: "user")');
      expect(result).toContain('- balance (float, min: 0, default: 0)');
      expect(result).toContain('- isActive (boolean, default: true)');
      expect(result).toContain('- tags (string, array)');
      expect(result).toContain('- email_idx (unique): email');
      expect(result).toContain('- age_idx (key): age');
    });

    it('should verify complete output structure', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        },
        indexes: [
          { key: 'name_idx', type: 'key', attributes: ['name'] }
        ]
      };

      const result = textMigrations.generateText([table]);
      
      const headerIndex = result.indexOf('Database Schema');
      const collectionIndex = result.indexOf('Collection: users');
      const fieldsIndex = result.indexOf('Fields:');
      const indexesIndex = result.indexOf('Indexes:');
      
      expect(headerIndex).toBeLessThan(collectionIndex);
      expect(collectionIndex).toBeLessThan(fieldsIndex);
      expect(fieldsIndex).toBeLessThan(indexesIndex);
    });
  });
});
