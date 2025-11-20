export class DatabaseError extends Error {
  constructor(message: string, public readonly query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class FileError extends Error {
  constructor(message: string, public readonly path?: string) {
    super(message);
    this.name = 'FileError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
