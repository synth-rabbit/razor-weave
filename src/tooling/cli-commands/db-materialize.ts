// src/tooling/cli-commands/db-materialize.ts
import { CommandBuilder } from '../cli/command-builder.js';
import { Materializer } from '../events/materializer.js';

new CommandBuilder('db:materialize')
  .description('Materializes events into database tables')
  .option('events', { type: 'string', description: 'Events directory', default: 'data/events' })
  .option('db', { type: 'string', description: 'Database path', default: 'data/project.db' })
  .run((ctx) => {
    const eventsDir = ctx.args.events!;
    const dbPath = ctx.args.db!;

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

    // Register checkpoint table
    materializer.registerTable('session_checkpoints', 'id');

    materializer.materialize();

    return {
      title: 'DB MATERIALIZE',
      content: [
        `Events directory: ${eventsDir}`,
        `Database path: ${dbPath}`,
      ],
      status: [
        { label: 'Database materialized successfully', success: true },
        { label: `Output: ${dbPath}`, success: true },
      ],
    };
  });
