#!/usr/bin/env tsx
// scripts/verify-database.ts
import { getDatabase } from '../database/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { log } from '../logging/logger.js';

log.info('🔍 Verifying database setup...\n');

// Initialize database
const db = getDatabase();

// 1. Test StateClient
log.info('1️⃣  Testing StateClient...');
db.state.set('verification_test', { status: 'success', timestamp: new Date().toISOString() });
db.state.set('project_version', '1.0.0');
db.state.set('last_verification', new Date().toISOString());

const allState = db.state.getAll();
log.info(`   ✓ Created ${Object.keys(allState).length} state entries`);
log.info(`   ✓ State keys: ${Object.keys(allState).join(', ')}\n`);

// 2. Test SnapshotClient
log.info('2️⃣  Testing SnapshotClient...');

// Create test chapter files
mkdirSync('books/test/v1/manuscript/chapters', { recursive: true });
writeFileSync('books/test/v1/manuscript/chapters/01-intro.md', '# Introduction\n\nThis is a test chapter for verification.');
writeFileSync('books/test/v1/manuscript/chapters/02-mechanics.md', '# Mechanics\n\nCore game mechanics go here.');

// Create snapshots
const snapshot1 = await db.snapshots.createChapterSnapshot('books/test/v1/manuscript/chapters/01-intro.md', 'claude');
const snapshot2 = await db.snapshots.createChapterSnapshot('books/test/v1/manuscript/chapters/02-mechanics.md', 'claude');

log.info(`   ✓ Created snapshot ${snapshot1} for chapter 01`);
log.info(`   ✓ Created snapshot ${snapshot2} for chapter 02`);

// Mark as committed
db.snapshots.markAsCommitted('verification-commit-abc123');
log.info(`   ✓ Marked snapshots as committed\n`);

// 3. Test ArtifactClient
log.info('3️⃣  Testing ArtifactClient...');

mkdirSync('data/test-artifacts', { recursive: true });
const artifact1 = db.artifacts.create('data/test-artifacts/sample.json', '{"test": "data"}', 'generated_content');
const artifact2 = db.artifacts.create('data/test-artifacts/analysis.txt', 'Analysis results here', 'analysis');

log.info(`   ✓ Created artifact ${artifact1} (generated_content)`);
log.info(`   ✓ Created artifact ${artifact2} (analysis)\n`);

// 4. Query and display data
log.info('4️⃣  Database Summary:');

const history1 = db.snapshots.getChapterHistory('books/test/v1/manuscript/chapters/01-intro.md');
const history2 = db.snapshots.getChapterHistory('books/test/v1/manuscript/chapters/02-mechanics.md');

log.info(`   • Total snapshots: ${history1.length + history2.length}`);
log.info(`   • Chapter 01 versions: ${history1.length}`);
log.info(`   • Chapter 02 versions: ${history2.length}`);
log.info(`   • State entries: ${Object.keys(allState).length}`);
log.info(`   • Data artifacts: 2\n`);

// 5. Display database file info
log.info('5️⃣  Database File:');
const fs = await import('fs');
const stats = fs.statSync('data/project.db');
log.info(`   • Location: data/project.db`);
log.info(`   • Size: ${(stats.size / 1024).toFixed(2)} KB`);
log.info(`   • Created: ${stats.birthtime.toISOString()}\n`);

log.info('✅ Database verification complete!');
log.info('\n💡 You can now inspect the database at: data/project.db');
log.info('   Use SQLite tools or query via the TypeScript API\n');

process.exit(0);
