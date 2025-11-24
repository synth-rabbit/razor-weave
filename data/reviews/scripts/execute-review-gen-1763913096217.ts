/**
 * Execute reviewer prompt for persona gen-1763913096217-prwd9cu1k
 * Campaign: campaign-20251123-192801-j6p4e486
 */
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const startTime = Date.now();

// Open database directly
const dbPath = join(process.cwd(), 'data', 'project.db');
const db = new Database(dbPath);

// Retrieve book content from database
const contentId = 'book-4e615fdb7377';
const stmt = db.prepare('SELECT content FROM book_versions WHERE content_id = ?');
const row = stmt.get(contentId) as { content: string } | undefined;

if (!row) {
  console.error(`Book content not found for content_id: ${contentId}`);
  process.exit(1);
}

const bookContent = row.content;
console.log(`Book content retrieved: ${bookContent.length} characters`);

// Output the main content section for review
const mainIndex = bookContent.indexOf('<main');
if (mainIndex > 0) {
  console.log('\n=== BOOK MAIN CONTENT ===\n');
  console.log(bookContent.substring(mainIndex, mainIndex + 100000)); // Main content section
  console.log('\n=== END BOOK MAIN CONTENT ===\n');
} else {
  console.log('\n=== BOOK CONTENT ===\n');
  console.log(bookContent.substring(0, 50000)); // First 50k chars for context
  console.log('\n=== END BOOK CONTENT ===\n');
}

db.close();
