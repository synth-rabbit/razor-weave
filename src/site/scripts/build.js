#!/usr/bin/env node

/**
 * Build script for Razorweave website
 * Processes HTML partials and copies assets to dist/
 */

const fs = require('fs-extra');
const path = require('path');

const SRC = path.join(__dirname, '../src');
const PUBLIC = path.join(__dirname, '../public');
const DIST = path.join(__dirname, '../dist');

console.log('🏗️  Building Razorweave website...\n');

// Clean dist directory
console.log('🧹 Cleaning dist/');
fs.emptyDirSync(DIST);

// Copy public assets as-is
console.log('📦 Copying public assets...');
if (fs.existsSync(PUBLIC)) {
  fs.copySync(PUBLIC, DIST);
  console.log('✓ Public assets copied\n');
} else {
  console.log('⚠️  No public/ directory found, skipping\n');
}

// Process HTML pages (insert partials)
console.log('📄 Processing HTML pages...');
const pagesDir = path.join(SRC, 'pages');

if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

  // Read partials
  const headerPath = path.join(SRC, 'partials/header.html');
  const footerPath = path.join(SRC, 'partials/footer.html');

  const header = fs.existsSync(headerPath)
    ? fs.readFileSync(headerPath, 'utf8')
    : '';
  const footer = fs.existsSync(footerPath)
    ? fs.readFileSync(footerPath, 'utf8')
    : '';

  pages.forEach(page => {
    let content = fs.readFileSync(path.join(pagesDir, page), 'utf8');

    // Replace placeholders
    content = content.replace('{{HEADER}}', header);
    content = content.replace('{{FOOTER}}', footer);

    fs.writeFileSync(path.join(DIST, page), content);
    console.log(`✓ Processed ${page}`);
  });

  console.log('');
} else {
  console.log('⚠️  No src/pages/ directory found\n');
}

// Copy styles
console.log('🎨 Copying styles...');
const stylesDir = path.join(SRC, 'styles');
if (fs.existsSync(stylesDir)) {
  fs.copySync(stylesDir, path.join(DIST, 'styles'));
  console.log('✓ Styles copied\n');
}

// Copy scripts
console.log('📜 Copying scripts...');
const scriptsDir = path.join(SRC, 'scripts');
if (fs.existsSync(scriptsDir)) {
  fs.copySync(scriptsDir, path.join(DIST, 'scripts'));
  console.log('✓ Scripts copied\n');
}

console.log('✅ Build complete! Output in dist/\n');
