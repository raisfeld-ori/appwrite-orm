import { TypeMapper, Validator } from '../../src/shared/utils';
import { DatabaseField } from '../../src/shared/types';

describe('TypeMapper', () => {
  describe('toAppwriteType', () => {
    it('should map TypeScript types to Appwrite types correctly', () => {
      expect(TypeMapper.toAppwriteType('string')).toBe('string');
      expect(TypeMapper.toAppwriteType('number')).toBe('integer');
      expect(TypeMapper.toAppwriteType('boolean')).toBe('boolean');
      expect(TypeMapper.toAppwriteType('Date')).toBe('datetime');
      expect(TypeMapper.toAppwriteType(['option1', 'option2'])).toBe('enum');
    });
  });

  describe('fromAppwriteType', () => {
    it('should map Appwrite types to TypeScript types correctly', () => {
      expect(TypeMapper.fromAppwriteType('string')).toBe('string');
      expect(TypeMapper.fromAppwriteType('integer')).toBe('number');
      expect(TypeMapper.fromAppwriteType('float')).toBe('number');
      expect(TypeMapper.fromAppwriteType('boolean')).toBe('boolean');
      expect(TypeMapper.fromAppwriteType('datetime')).toBe('Date');
      expect(TypeMapper.fromAppwriteType('enum')).toEqual([]);
    });
  });
});

describe('Validator', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const field: DatabaseField = { type: 'string', required: true };
      
      const errors1 = Validator.validateField(undefined, field, 'testField');
      expect(errors1).toHaveLength(1);
      expect(errors1[0].message).toBe('Field is required');
      
      const errors2 = Validator.validateField('valid', field, 'testField');
      expect(errors2).toHaveLength(0);
    });

    it('should validate string types', () => {
      const field: DatabaseField = { type: 'string' };
      
      const errors1 = Validator.validateField(123, field, 'testField');
      expect(errors1).toHaveLength(1);
      expect(errors1[0].message).toContain('Expected type string');
      
      const errors2 = Validator.validateField('valid', field, 'testField');
      expect(errors2).toHaveLength(0);
    });

    it('should validate string size limits', () => {
      const field: DatabaseField = { type: 'string', size: 5 };
      
      const errors1 = Validator.validateField('toolong', field, 'testField');
      expect(errors1).toHaveLength(1);
      expect(errors1[0].message).toContain('String length exceeds maximum');
      
      const errors2 = Validator.validateField('ok', field, 'testField');
      expect(errors2).toHaveLength(0);
    });

    it('should validate number ranges', () => {
      const field: DatabaseField = { type: 'number', min: 0, max: 100 };
      
      const errors1 = Validator.validateField(-1, field, 'testField');
      expect(errors1).toHaveLength(1);
      expect(errors1[0].message).toContain('below minimum');
      
      const errors2 = Validator.validateField(101, field, 'testField');
      expect(errors2).toHaveLength(1);
      expect(errors2[0].message).toContain('exceeds maximum');
      
      const errors3 = Validator.validateField(50, field, 'testField');
      expect(errors3).toHaveLength(0);
    });

    it('should validate enum values', () => {
      const field: DatabaseField = { 
        type: ['red', 'green', 'blue'], 
        enum: ['red', 'green', 'blue'] 
      };
      
      const errors1 = Validator.validateField('yellow', field, 'testField');
      expect(errors1).toHaveLength(1);
      expect(errors1[0].message).toContain('must be one of');
      
      const errors2 = Validator.validateField('red', field, 'testField');
      expect(errors2).toHaveLength(0);
    });
  });
});