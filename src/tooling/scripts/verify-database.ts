#!/usr/bin/env tsx
// scripts/verify-database.ts
import { getDatabase } from '../src/tooling/database/index.js';
import { writeFileSync, mkdirSync } from 'fs';

console.log('🔍 Verifying database setup...\n');

// Initialize database
const db = getDatabase();

// 1. Test StateClient
console.log('1️⃣  Testing StateClient...');
db.state.set('verification_test', { status: 'success', timestamp: new Date().toISOString() });
db.state.set('project_version', '1.0.0');
db.state.set('last_verification', new Date().toISOString());

const allState = db.state.getAll();
console.log(`   ✓ Created ${Object.keys(allState).length} state entries`);
console.log(`   ✓ State keys: ${Object.keys(allState).join(', ')}\n`);

// 2. Test SnapshotClient
console.log('2️⃣  Testing SnapshotClient...');

// Create test chapter files
mkdirSync('books/test/v1/manuscript/chapters', { recursive: true });
writeFileSync('books/test/v1/manuscript/chapters/01-intro.md', '# Introduction\n\nThis is a test chapter for verification.');
writeFileSync('books/test/v1/manuscript/chapters/02-mechanics.md', '# Mechanics\n\nCore game mechanics go here.');

// Create snapshots
const snapshot1 = await db.snapshots.createChapterSnapshot('books/test/v1/manuscript/chapters/01-intro.md', 'claude');
const snapshot2 = await db.snapshots.createChapterSnapshot('books/test/v1/manuscript/chapters/02-mechanics.md', 'claude');

console.log(`   ✓ Created snapshot ${snapshot1} for chapter 01`);
console.log(`   ✓ Created snapshot ${snapshot2} for chapter 02`);

// Mark as committed
db.snapshots.markAsCommitted('verification-commit-abc123');
console.log(`   ✓ Marked snapshots as committed\n`);

// 3. Test ArtifactClient
console.log('3️⃣  Testing ArtifactClient...');

mkdirSync('data/test-artifacts', { recursive: true });
const artifact1 = db.artifacts.create('data/test-artifacts/sample.json', '{"test": "data"}', 'generated_content');
const artifact2 = db.artifacts.create('data/test-artifacts/analysis.txt', 'Analysis results here', 'analysis');

console.log(`   ✓ Created artifact ${artifact1} (generated_content)`);
console.log(`   ✓ Created artifact ${artifact2} (analysis)\n`);

// 4. Query and display data
console.log('4️⃣  Database Summary:');

const history1 = db.snapshots.getChapterHistory('books/test/v1/manuscript/chapters/01-intro.md');
const history2 = db.snapshots.getChapterHistory('books/test/v1/manuscript/chapters/02-mechanics.md');

console.log(`   • Total snapshots: ${history1.length + history2.length}`);
console.log(`   • Chapter 01 versions: ${history1.length}`);
console.log(`   • Chapter 02 versions: ${history2.length}`);
console.log(`   • State entries: ${Object.keys(allState).length}`);
console.log(`   • Data artifacts: 2\n`);

// 5. Display database file info
console.log('5️⃣  Database File:');
const fs = await import('fs');
const stats = fs.statSync('data/project.db');
console.log(`   • Location: data/project.db`);
console.log(`   • Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   • Created: ${stats.birthtime.toISOString()}\n`);

console.log('✅ Database verification complete!');
console.log('\n💡 You can now inspect the database at: data/project.db');
console.log('   Use SQLite tools or query via the TypeScript API\n');

process.exit(0);
