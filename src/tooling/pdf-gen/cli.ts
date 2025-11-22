// src/tooling/pdf-gen/cli.ts
import path from 'path';
import fs from 'fs';

export interface PDFBuildOptions {
  input?: string;
  output?: string;
  quick?: boolean;
}

const DEFAULT_INPUT = 'data/html/print-design/core-rulebook.html';
const DEFAULT_OUTPUT = 'data/pdfs/draft/core-rulebook.pdf';

/**
 * Build PDF from print-design HTML.
 */
export async function buildPDF(options: PDFBuildOptions = {}): Promise<void> {
  const {
    input = DEFAULT_INPUT,
    output = DEFAULT_OUTPUT,
    quick = false,
  } = options;

  const inputPath = path.resolve(process.cwd(), input);
  const outputPath = path.resolve(process.cwd(), output);

  console.log('Building PDF...');
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}`);

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`\nError: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const startTime = Date.now();

  // Import pipeline dynamically to allow CLI to work even if pipeline isn't ready
  const { generatePDF } = await import('./pipeline.js');

  await generatePDF(inputPath, outputPath, {
    skipChapterOpeners: quick,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nPDF generated successfully in ${duration}s`);
  console.log(`  Size: ${getFileSizeString(outputPath)}`);
}

/**
 * Get human-readable file size.
 */
export function getFileSizeString(filePath: string): string {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * CLI entry point.
 */
export async function runCLI(args: string[]): Promise<void> {
  const command = args[0];

  switch (command) {
    case 'build':
      await buildPDF({
        quick: args.includes('--quick'),
      });
      break;

    default:
      console.log('Usage: pdf:build [--quick]');
      console.log('');
      console.log('Commands:');
      console.log('  build         Build PDF from print-design HTML');
      console.log('');
      console.log('Options:');
      console.log('  --quick       Skip chapter opener pages (faster)');
      break;
  }
}

// Run CLI when executed directly
runCLI(process.argv.slice(2));
