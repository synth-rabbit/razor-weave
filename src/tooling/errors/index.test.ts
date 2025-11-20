import { describe, it, expect } from 'vitest';
import { DatabaseError, FileError, ValidationError } from './index.js';

describe('Error Classes', () => {
  it('should create DatabaseError with context', () => {
    const error = new DatabaseError('Query failed', 'SELECT * FROM users');
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('Query failed');
    expect(error.query).toBe('SELECT * FROM users');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create DatabaseError without query', () => {
    const error = new DatabaseError('Connection failed');
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('Connection failed');
    expect(error.query).toBeUndefined();
  });

  it('should create FileError with context', () => {
    const error = new FileError('File not found', '/path/to/file.txt');
    expect(error.name).toBe('FileError');
    expect(error.message).toBe('File not found');
    expect(error.path).toBe('/path/to/file.txt');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create FileError without path', () => {
    const error = new FileError('Disk full');
    expect(error.name).toBe('FileError');
    expect(error.message).toBe('Disk full');
    expect(error.path).toBeUndefined();
  });

  it('should create ValidationError with context', () => {
    const error = new ValidationError('Invalid email format', 'email');
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid email format');
    expect(error.field).toBe('email');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create ValidationError without field', () => {
    const error = new ValidationError('Validation failed');
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Validation failed');
    expect(error.field).toBeUndefined();
  });
});
