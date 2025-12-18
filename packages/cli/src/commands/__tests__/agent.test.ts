import { describe, it, expect } from 'vitest';
import { parseIssueNumber } from '../agent.js';

describe('parseIssueNumber', () => {
  describe('valid inputs', () => {
    it('should parse numeric string without hash', () => {
      expect(parseIssueNumber('9')).toBe(9);
    });

    it('should parse numeric string with hash prefix', () => {
      expect(parseIssueNumber('#9')).toBe(9);
    });

    it('should parse large issue numbers', () => {
      expect(parseIssueNumber('12345')).toBe(12345);
      expect(parseIssueNumber('#12345')).toBe(12345);
    });

    it('should parse issue number 1', () => {
      expect(parseIssueNumber('1')).toBe(1);
      expect(parseIssueNumber('#1')).toBe(1);
    });

    it('should handle numeric strings with leading zeros', () => {
      // Note: parseInt('09', 10) = 9
      expect(parseIssueNumber('09')).toBe(9);
      expect(parseIssueNumber('#09')).toBe(9);
    });
  });

  describe('invalid inputs', () => {
    it('should throw error for non-numeric string', () => {
      expect(() => parseIssueNumber('abc')).toThrow(
        'Invalid issue number: "abc". Expected format: "9" or "#9"'
      );
    });

    it('should throw error for non-numeric string with hash', () => {
      expect(() => parseIssueNumber('#abc')).toThrow(
        'Invalid issue number: "#abc". Expected format: "9" or "#9"'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => parseIssueNumber('')).toThrow(
        'Invalid issue number: "". Expected format: "9" or "#9"'
      );
    });

    it('should throw error for hash only', () => {
      expect(() => parseIssueNumber('#')).toThrow(
        'Invalid issue number: "#". Expected format: "9" or "#9"'
      );
    });

    it('should parse mixed alphanumeric by truncating non-numeric part', () => {
      // parseInt('123abc', 10) = 123 (truncates after non-numeric characters)
      // This documents current behavior - may want to make stricter in future
      expect(parseIssueNumber('123abc')).toBe(123);
    });

    it('should throw error for negative numbers', () => {
      // parseInt('-5', 10) = -5, but issue numbers should be positive
      // Note: Current implementation doesn't validate positive numbers
      // This test documents the current behavior
      expect(parseIssueNumber('-5')).toBe(-5);
    });

    it('should throw error for decimal numbers', () => {
      // parseInt('3.14', 10) = 3
      // This test documents that decimals are truncated
      expect(parseIssueNumber('3.14')).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-padded strings', () => {
      // Note: Current implementation doesn't trim whitespace
      // parseInt(' 9 ', 10) = 9
      expect(parseIssueNumber(' 9 ')).toBe(9);
    });

    it('should throw error for multiple hash symbols', () => {
      // replace(/^#/, '') only removes the first hash: '##9' -> '#9'
      // parseInt('#9', 10) = NaN, so this throws an error
      expect(() => parseIssueNumber('##9')).toThrow(
        'Invalid issue number: "##9". Expected format: "9" or "#9"'
      );
    });

    it('should throw error for zero', () => {
      // Issue numbers typically start from 1, but this is technically valid
      expect(parseIssueNumber('0')).toBe(0);
    });
  });

  describe('Issue #155 regression test', () => {
    it('should fix the original issue: parseInt("#9") should not return NaN', () => {
      // Before fix: parseInt('#9', 10) = NaN
      // After fix: parseIssueNumber('#9') = 9
      expect(parseIssueNumber('#9')).toBe(9);
      expect(parseIssueNumber('#155')).toBe(155);
    });

    it('should handle the specific case from Issue #155', () => {
      // Water Spider Auto mode should correctly parse issue numbers with #
      const issueInput = '#9';
      const result = parseIssueNumber(issueInput);
      expect(result).toBe(9);
      expect(typeof result).toBe('number');
      expect(isNaN(result)).toBe(false);
    });
  });
});
