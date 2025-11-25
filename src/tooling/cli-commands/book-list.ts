/**
 * book:list CLI Command
 *
 * Lists all books in the registry.
 *
 * Usage:
 *   pnpm book:list [--status <status>]
 */

import { CommandBuilder, validateEnum } from '../cli/command-builder.js';
import { BookRepository } from '../books/repository.js';
import type { BookStatus } from '../books/types.js';

const VALID_STATUSES: BookStatus[] = ['draft', 'editing', 'published'];

new CommandBuilder('book:list')
  .description('Lists all books in the registry')
  .option('status', { type: 'string', short: 's', description: 'Filter by status' })
  .useDatabase()
  .run((ctx) => {
    const statusFilter = validateEnum(ctx.args.status, VALID_STATUSES, 'status');
    const bookRepo = new BookRepository(ctx.db!);

    // Get all books and apply filter
    let books = bookRepo.list();
    if (statusFilter) {
      books = books.filter((book) => book.status === statusFilter);
    }

    if (books.length === 0) {
      const filterMessage = statusFilter ? ` with status '${statusFilter}'` : '';
      return {
        title: 'BOOK LIST',
        content: `No books found${filterMessage}.`,
        status: [{ label: 'Empty registry', pending: true }],
        nextStep: [
          'Register a new book with:',
          '  pnpm book:register --slug <slug> --title <title> --path <path>',
        ],
      };
    }

    // Build table
    const tableHeader = 'SLUG                 TYPE        STATUS      TITLE';
    const separator = '-'.repeat(70);
    const tableRows = books.map((book) => {
      const slug = book.slug.padEnd(20).slice(0, 20);
      const type = book.book_type.padEnd(11).slice(0, 11);
      const status = book.status.padEnd(11).slice(0, 11);
      const title = book.title.slice(0, 30);
      return `${slug} ${type} ${status} ${title}`;
    });

    return {
      title: 'BOOK LIST',
      content: [tableHeader, separator, ...tableRows].join('\n'),
      status: [
        { label: `${books.length} book(s) found`, success: true },
        ...(statusFilter ? [{ label: `Filtered by: ${statusFilter}`, pending: true }] : []),
      ],
      nextStep: ['View book details with:', '  pnpm book:info --slug <slug>'],
    };
  });
