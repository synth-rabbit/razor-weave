# Error Handling Standards

## Principles

1. **Fail fast** - Validate inputs early
2. **Specific errors** - Use custom error classes, not generic Error
3. **Context** - Include relevant data in error messages
4. **No silent failures** - Always propagate or log errors

## Custom Error Classes

```typescript
export class DatabaseError extends Error {
  constructor(message: string, public readonly query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Patterns

### Database Operations

```typescript
try {
  const result = db.prepare(query).all();
  return result;
} catch (error) {
  throw new DatabaseError(`Failed to execute query: ${error}`, query);
}
```

### File I/O

```typescript
try {
  const content = await fs.readFile(path, 'utf-8');
  return content;
} catch (error) {
  throw new FileError(`Failed to read file: ${path}`, path);
}
```

### Validation

```typescript
if (!isValid(input)) {
  throw new ValidationError('Invalid input', 'fieldName');
}
```

## Testing Errors

```typescript
it('should throw DatabaseError on query failure', () => {
  expect(() => client.query(invalidSQL)).toThrow(DatabaseError);
});
```
