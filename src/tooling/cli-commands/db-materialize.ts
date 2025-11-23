// src/tooling/cli-commands/db-materialize.ts
import { Materializer } from '../events/materializer';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    events: { type: 'string', default: 'data/events' },
    db: { type: 'string', default: 'data/project.db' },
  },
});

const eventsDir = values.events!;
const dbPath = values.db!;

console.log('═══════════════════════════════════════════════════════════');
console.log('DB MATERIALIZE');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Events directory: ${eventsDir}`);
console.log(`Database path: ${dbPath}`);
console.log('');

const materializer = new Materializer(eventsDir, dbPath);

// Register all boardroom tables
materializer.registerTable('boardroom_sessions', 'id');
materializer.registerTable('vp_plans', 'id');
materializer.registerTable('phases', 'id');
materializer.registerTable('milestones', 'id');
materializer.registerTable('engineering_tasks', 'id');
materializer.registerTable('ceo_feedback', 'id');
materializer.registerTable('brainstorm_opinions', 'id');
materializer.registerTable('vp_consultations', 'id');

// Register VP Ops tables
materializer.registerTable('execution_batches', 'id');
materializer.registerTable('operational_risks', 'id');
materializer.registerTable('boardroom_minutes', 'id');

try {
  materializer.materialize();
  console.log('───────────────────────────────────────────────────────────');
  console.log('STATUS');
  console.log('───────────────────────────────────────────────────────────');
  console.log('✓ Database materialized successfully');
  console.log(`✓ Output: ${dbPath}`);
} catch (error) {
  console.error('✗ Materialization failed:', error);
  process.exit(1);
}
