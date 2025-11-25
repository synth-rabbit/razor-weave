// src/tooling/cli/command-builder.test.ts
import { describe, it, expect } from 'vitest';
import { requireArg, validateEnum } from './command-builder.js';

describe('command-builder helpers', () => {
  describe('requireArg', () => {
    it('should return arg value when present', () => {
      const ctx = {
        args: { slug: 'test-slug' },
        positionals: [],
      };
      expect(requireArg(ctx, 'slug')).toBe('test-slug');
    });

    it('should return positional when arg missing and positional index given', () => {
      const ctx = {
        args: {},
        positionals: ['positional-value'],
      };
      expect(requireArg(ctx, 'slug', 0)).toBe('positional-value');
    });

    it('should prefer arg over positional', () => {
      const ctx = {
        args: { slug: 'arg-value' },
        positionals: ['positional-value'],
      };
      expect(requireArg(ctx, 'slug', 0)).toBe('arg-value');
    });

    it('should throw when arg missing and no positional index', () => {
      const ctx = {
        args: {},
        positionals: [],
      };
      expect(() => requireArg(ctx, 'slug')).toThrow('Missing required argument: --slug <value>');
    });

    it('should throw when arg missing and positional index out of bounds', () => {
      const ctx = {
        args: {},
        positionals: [],
      };
      expect(() => requireArg(ctx, 'slug', 0)).toThrow('Missing required argument: --slug <value> or positional argument');
    });

    it('should throw when arg is boolean instead of string', () => {
      const ctx = {
        args: { verbose: true },
        positionals: [],
      };
      expect(() => requireArg(ctx, 'verbose')).toThrow('Missing required argument');
    });
  });

  describe('validateEnum', () => {
    const validStatuses = ['draft', 'editing', 'published'] as const;

    it('should return value when valid', () => {
      expect(validateEnum('draft', validStatuses, 'status')).toBe('draft');
      expect(validateEnum('editing', validStatuses, 'status')).toBe('editing');
      expect(validateEnum('published', validStatuses, 'status')).toBe('published');
    });

    it('should return undefined when value is undefined', () => {
      expect(validateEnum(undefined, validStatuses, 'status')).toBeUndefined();
    });

    it('should throw for invalid value', () => {
      expect(() => validateEnum('invalid', validStatuses, 'status')).toThrow(
        'Invalid status: invalid. Valid values: draft, editing, published'
      );
    });
  });
});
