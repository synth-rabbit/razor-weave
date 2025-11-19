#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read files
const rulebookPath = path.join(__dirname, '../core_rulebook.html');
const readPagePath = path.join(__dirname, '../src/pages/read.html');

const rulebook = fs.readFileSync(rulebookPath, 'utf-8');
const readPage = fs.readFileSync(readPagePath, 'utf-8');

// Extract TOC (nav element content)
const navMatch = rulebook.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
if (!navMatch) {
  console.error('❌ Could not find <nav> element in core_rulebook.html');
  process.exit(1);
}

// Extract just the inner content (h2 + ul)
const navContent = navMatch[1];

// Extract main content
const mainMatch = rulebook.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) {
  console.error('❌ Could not find <main> element in core_rulebook.html');
  process.exit(1);
}

const mainContent = mainMatch[1];

// Update read.html
// Replace TOC content (everything inside .reader-toc aside after <h2>Contents</h2>)
let updated = readPage.replace(
  /(<aside class="reader-toc">\s*<h2>Contents<\/h2>\s*)[\s\S]*?(\s*<\/aside>)/,
  `$1\n${navContent}\n      $2`
);

// Replace main content (everything inside .reader-content)
updated = updated.replace(
  /(<main class="reader-content">)[\s\S]*?(<\/main>)/,
  `$1\n${mainContent}\n    $2`
);

// Write updated file
fs.writeFileSync(readPagePath, updated, 'utf-8');

console.log('✅ Successfully imported rulebook content!');
console.log(`   TOC: ${navContent.length} characters`);
console.log(`   Main: ${mainContent.length} characters`);
