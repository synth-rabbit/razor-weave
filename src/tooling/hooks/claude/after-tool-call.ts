import { getDatabase } from '../../database/index.js';
import { log } from '../../logging/logger.js';

interface AfterToolCallResult {
  success: boolean;
  message?: string;
}

export async function afterToolCall(
  tool: string,
  args: unknown,
  result: unknown
): Promise<AfterToolCallResult> {
  const typedArgs = args as Record<string, unknown>;

  // 1. Log successful file writes for tracking
  if (tool === 'Write' && typeof typedArgs.file_path === 'string') {
    log.info(`✅ Created: ${typedArgs.file_path}`);
  }

  // 2. Log successful file edits
  if (tool === 'Edit' && typeof typedArgs.file_path === 'string') {
    log.info(`✏️  Updated: ${typedArgs.file_path}`);
  }

  // 3. Track test execution results
  if (tool === 'Bash' && typeof typedArgs.command === 'string') {
    const cmd = typedArgs.command;
    if (cmd.includes('test') || cmd.includes('vitest')) {
      const resultObj = result as { stdout?: string; stderr?: string };
      const output = resultObj.stdout || resultObj.stderr || '';

      if (output.includes('FAIL') || output.includes('failed')) {
        log.info('⚠️  Tests failed - review output above');
      } else if (output.includes('PASS') || output.includes('passed')) {
        log.info('✅ Tests passed');
      }
    }
  }

  // 4. Snapshot book/chapter changes
  if (tool === 'Write' || tool === 'Edit') {
    const filePath = typedArgs.file_path as string;

    if (filePath.startsWith('books/') && filePath.endsWith('.md')) {
      try {
        const db = getDatabase();
        await db.snapshots.createChapterSnapshot(filePath, 'claude');
        log.info(`📸 Snapshotted: ${filePath}`);
      } catch (error) {
        log.error(`Failed to snapshot ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (filePath.startsWith('data/') && !filePath.includes('project.db')) {
      try {
        const db = getDatabase();
        const { readFileSync } = await import('fs');
        const content = readFileSync(filePath, 'utf-8');
        db.artifacts.create(filePath, content, 'generated_content');
        log.info(`📦 Archived: ${filePath}`);
      } catch (error) {
        log.error(`Failed to archive ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return { success: true };
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/after_tool_call.ts
