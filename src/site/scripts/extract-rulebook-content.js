#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the standalone rulebook
const ruleBookPath = path.join(__dirname, '../core_rulebook.html');
const html = fs.readFileSync(ruleBookPath, 'utf-8');

// Extract TOC structure (nav element)
const tocMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
if (tocMatch) {
  console.log('TOC Structure Found:');
  console.log(tocMatch[1].substring(0, 500) + '...\n');
}

// Extract main content (main element)
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (mainMatch) {
  console.log('Main Content Found:');
  console.log('Content length:', mainMatch[1].length, 'characters');
  console.log('First 500 chars:', mainMatch[1].substring(0, 500) + '...\n');
}

// Count sections
const sectionMatches = html.match(/<section/g);
console.log('Number of sections:', sectionMatches ? sectionMatches.length : 0);

// Check for IDs on headings
const h2Ids = html.match(/<h2[^>]+id=/g);
const h3Ids = html.match(/<h3[^>]+id=/g);
console.log('H2 elements with IDs:', h2Ids ? h2Ids.length : 0);
console.log('H3 elements with IDs:', h3Ids ? h3Ids.length : 0);

// Extract embedded styles length
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
console.log('\nEmbedded CSS length:', styleMatch ? styleMatch[1].length : 0, 'characters');
