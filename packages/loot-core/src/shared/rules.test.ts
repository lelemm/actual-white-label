import { describe, expect, it } from 'vitest';

import { getValidOpsLegacy, isValidOpLegacy } from './rules';

describe('rules', () => {
  describe('isValidOpLegacy', () => {
    it('should return false for oneOf operation on notes field', () => {
      expect(isValidOpLegacy('notes', 'oneOf')).toBe(false);
    });

    it('should return false for notOneOf operation on notes field', () => {
      expect(isValidOpLegacy('notes', 'notOneOf')).toBe(false);
    });

    it('should return true for valid string operations on notes field', () => {
      expect(isValidOpLegacy('notes', 'is')).toBe(true);
      expect(isValidOpLegacy('notes', 'isNot')).toBe(true);
      expect(isValidOpLegacy('notes', 'contains')).toBe(true);
      expect(isValidOpLegacy('notes', 'doesNotContain')).toBe(true);
      expect(isValidOpLegacy('notes', 'matches')).toBe(true);
    });

    it('should return true for oneOf operation on payee field', () => {
      expect(isValidOpLegacy('payee', 'oneOf')).toBe(true);
    });

    it('should return true for notOneOf operation on payee field', () => {
      expect(isValidOpLegacy('payee', 'notOneOf')).toBe(true);
    });
  });

  describe('getValidOpsLegacy', () => {
    it('should not include oneOf and notOneOf for notes field', () => {
      const validOps = getValidOpsLegacy('notes');
      expect(validOps).not.toContain('oneOf');
      expect(validOps).not.toContain('notOneOf');
    });

    it('should include other valid string operations for notes field', () => {
      const validOps = getValidOpsLegacy('notes');
      expect(validOps).toContain('is');
      expect(validOps).toContain('isNot');
      expect(validOps).toContain('contains');
      expect(validOps).toContain('doesNotContain');
      expect(validOps).toContain('matches');
    });

    it('should include oneOf and notOneOf for payee field', () => {
      const validOps = getValidOpsLegacy('payee');
      expect(validOps).toContain('oneOf');
      expect(validOps).toContain('notOneOf');
    });
  });
});
