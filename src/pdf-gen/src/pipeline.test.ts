// src/tooling/pdf-gen/pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { generatePDF } from './pipeline';
import fs from 'fs';
import path from 'path';

describe('generatePDF', () => {
  it('generates a PDF file from HTML input', async () => {
    const htmlPath = path.join(__dirname, '../__fixtures__/test-chapter.html');
    const outputPath = '/tmp/test-output.pdf';

    // Create test fixture if it doesn't exist
    if (!fs.existsSync(path.dirname(htmlPath))) {
      fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    }

    fs.writeFileSync(htmlPath, `
      <!DOCTYPE html>
      <html>
      <body>
        <main>
          <section id="ch-01-test">
            <h2>1. Test Chapter</h2>
            <p>This is test content.</p>
          </section>
        </main>
      </body>
      </html>
    `);

    await generatePDF(htmlPath, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);

    // Clean up
    fs.unlinkSync(outputPath);
    fs.unlinkSync(htmlPath);
  });
});
