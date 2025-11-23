// src/tooling/books/index.ts
export { BookRepository } from './repository.js';
export { seedCoreRulebook, CORE_RULEBOOK_SEED } from './seed.js';
export type { SeedResult } from './seed.js';
export type {
  Book,
  BookType,
  BookStatus,
  CreateBookInput,
  UpdateBookInput
} from './types.js';
