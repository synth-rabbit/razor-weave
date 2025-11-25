/**
 * book:info CLI Command
 *
 * Shows detailed information about a specific book.
 *
 * Usage:
 *   pnpm book:info --slug <slug>
 *   pnpm book:info <slug>
 */

import { CommandBuilder, requireArg } from '../cli/command-builder.js';
import { CLIFormatter } from '../cli/formatter.js';
import { BookRepository } from '../books/repository.js';

new CommandBuilder('book:info')
  .description('Shows detailed information about a specific book')
  .option('slug', { type: 'string', short: 's', description: 'Book slug' })
  .positionals()
  .useDatabase()
  .run((ctx) => {
    const slug = requireArg(ctx, 'slug', 0);
    const bookRepo = new BookRepository(ctx.db!);

    const book = bookRepo.getBySlug(slug);
    if (!book) {
      throw new Error(`Book not found: ${slug}`);
    }

    // Format book details as table
    const tableRows = [
      { key: 'ID', value: book.id },
      { key: 'Slug', value: book.slug },
      { key: 'Title', value: book.title },
      { key: 'Type', value: book.book_type },
      { key: 'Status', value: book.status },
      { key: 'Source Path', value: book.source_path },
      { key: 'Version', value: book.current_version },
      { key: 'Created', value: book.created_at },
      { key: 'Updated', value: book.updated_at ?? 'N/A' },
    ];

    // Determine status indicator
    const statusIndicator =
      book.status === 'published'
        ? { label: 'Published', success: true }
        : book.status === 'editing'
          ? { label: 'In editing', pending: true }
          : { label: 'Draft', pending: true };

    return {
      title: `BOOK: ${book.title}`,
      content: CLIFormatter.table(tableRows),
      status: [statusIndicator],
      nextStep: ['List all books:', '  pnpm book:list'],
    };
  });
