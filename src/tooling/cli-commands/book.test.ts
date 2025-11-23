import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DB_DIR = 'data/test-book-cli';
const TEST_DB_PATH = join(TEST_DB_DIR, 'test.db');

describe('book CLI commands', () => {
  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
    mkdirSync(TEST_DB_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up test database
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
  });

  describe('book:register', () => {
    it('should register a new book with all required args', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug test-book --title "Test Book" --path books/test --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('BOOK REGISTERED');
      expect(output).toContain('Test Book');
      expect(output).toContain('test-book');
    });

    it('should register a book with custom type', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug campaign-book --title "Campaign Guide" --path books/campaign --type campaign --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('BOOK REGISTERED');
      expect(output).toContain('Campaign Guide');
    });

    it('should fail without --slug', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-register.ts --title "Test" --path books/test --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });

    it('should fail without --title', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-register.ts --slug test --path books/test --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });

    it('should fail without --path', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-register.ts --slug test --title "Test" --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });

    it('should fail with invalid book type', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-register.ts --slug test --title "Test" --path books/test --type invalid --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });

    it('should fail when registering duplicate slug', () => {
      // First registration should succeed
      execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug unique-slug --title "First Book" --path books/first --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      // Second registration with same slug should fail
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-register.ts --slug unique-slug --title "Second Book" --path books/second --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });
  });

  describe('book:list', () => {
    beforeEach(() => {
      // Register some books for list tests
      execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug book-one --title "Book One" --path books/one --type core --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );
      execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug book-two --title "Book Two" --path books/two --type source --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );
    });

    it('should list all books', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-list.ts --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('BOOK LIST');
      expect(output).toContain('book-one');
      expect(output).toContain('book-two');
      expect(output).toContain('Book One');
      expect(output).toContain('Book Two');
    });

    it('should show seeded book from migrations', () => {
      // Use a fresh database - migrations seed a core-rulebook
      const freshDbPath = join(TEST_DB_DIR, 'fresh.db');
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-list.ts --db ${freshDbPath}`,
        { encoding: 'utf-8' }
      );

      // Should contain the seeded core-rulebook from migrations
      expect(output).toContain('core-rulebook');
      expect(output).toContain('Razorweave Core Rulebook');
    });

    it('should show empty message when filtered status returns no books', () => {
      // Fresh database has seeded books with 'editing' status
      // Filter by 'published' should return empty
      const freshDbPath = join(TEST_DB_DIR, 'fresh2.db');
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-list.ts --status published --db ${freshDbPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('No books found');
      expect(output).toContain("with status 'published'");
    });

    it('should filter by status', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-list.ts --status draft --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('Filtered by: draft');
    });

    it('should fail with invalid status filter', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-list.ts --status invalid --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });
  });

  describe('book:info', () => {
    beforeEach(() => {
      // Register a book for info tests
      execSync(
        `npx tsx src/tooling/cli-commands/book-register.ts --slug info-test --title "Info Test Book" --path books/info-test --type supplement --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );
    });

    it('should show book info with --slug argument', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-info.ts --slug info-test --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('Info Test Book');
      expect(output).toContain('info-test');
      expect(output).toContain('supplement');
      expect(output).toContain('books/info-test');
    });

    it('should show book info with positional slug', () => {
      const output = execSync(
        `npx tsx src/tooling/cli-commands/book-info.ts info-test --db ${TEST_DB_PATH}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('Info Test Book');
      expect(output).toContain('info-test');
    });

    it('should fail without slug', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-info.ts --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });

    it('should fail when book not found', () => {
      expect(() => {
        execSync(
          `npx tsx src/tooling/cli-commands/book-info.ts --slug nonexistent --db ${TEST_DB_PATH}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });
  });
});
