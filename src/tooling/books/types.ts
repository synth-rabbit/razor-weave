// src/tooling/books/types.ts

/**
 * Type of book in the Razorweave system.
 * - core: Core rulebook (one per system)
 * - source: Source books with additional rules/content
 * - campaign: Campaign-specific books
 * - supplement: Supplementary materials
 */
export type BookType = 'core' | 'source' | 'campaign' | 'supplement';

/**
 * Status of a book in the publishing workflow.
 * - draft: Initial writing phase
 * - editing: Under editorial review
 * - published: Released and available
 */
export type BookStatus = 'draft' | 'editing' | 'published';

/**
 * A book in the Razorweave system.
 */
export interface Book {
  /** Unique identifier (e.g., 'book_core') */
  id: string;
  /** URL-friendly slug (e.g., 'core-rulebook') */
  slug: string;
  /** Display title of the book */
  title: string;
  /** Type of book */
  book_type: BookType;
  /** Relative path to book source files */
  source_path: string;
  /** Current semantic version (e.g., '1.0.0') */
  current_version: string;
  /** Current status in workflow */
  status: BookStatus;
  /** When the book record was created */
  created_at: string;
  /** When the book record was last updated */
  updated_at: string;
}

/**
 * Input for creating a new book.
 * Omits auto-generated fields (created_at, updated_at).
 */
export interface CreateBookInput {
  /** Unique identifier (e.g., 'book_core') */
  id: string;
  /** URL-friendly slug (e.g., 'core-rulebook') */
  slug: string;
  /** Display title of the book */
  title: string;
  /** Type of book */
  book_type: BookType;
  /** Relative path to book source files (base path without version) */
  source_path: string;
  /** Current semantic version (e.g., '1.3.0') - defaults to '1.0.0' */
  current_version?: string;
  /** Current status in workflow (defaults to 'draft') */
  status?: BookStatus;
}

/**
 * Input for updating an existing book.
 * All fields are optional.
 */
export type UpdateBookInput = Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Get the versioned source path for a book.
 * Combines base source_path with current_version.
 * @example getVersionedSourcePath({ source_path: 'books/core', current_version: '1.3.0' })
 *          // returns 'books/core/v1.3.0'
 */
export function getVersionedSourcePath(book: Pick<Book, 'source_path' | 'current_version'>): string {
  return `${book.source_path}/v${book.current_version}`;
}
