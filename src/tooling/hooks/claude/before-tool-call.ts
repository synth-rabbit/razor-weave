import { existsSync } from 'fs';
import { validatePlanNaming } from '../../validators/plan-naming-validator.js';
import { log } from '../../logging/logger.js';

interface BeforeToolCallResult {
  allow: boolean;
  message?: string;
}

export async function beforeToolCall(
  tool: string,
  args: unknown
): Promise<BeforeToolCallResult> {
  const typedArgs = args as Record<string, unknown>;

  // 1. Warn about critical file modifications
  if (tool === 'Edit' || tool === 'Write') {
    const criticalFiles = ['AGENTS.md', 'INDEX.md', 'PLAN.md', 'README.md'];
    const filePath = typedArgs.file_path as string;

    if (criticalFiles.includes(filePath)) {
      log.info(`⚠️  Modifying critical file: ${filePath}`);
      log.info('    (This file is auto-updated by post-commit hook)');
    }
  }

  // 2. Show relevant style guide for markdown files
  if (tool === 'Write' && typeof typedArgs.file_path === 'string' && typedArgs.file_path.endsWith('.md')) {
    const guide = getRelevantStyleGuide(typedArgs.file_path);
    if (guide) {
      log.info(`📚 Relevant style guide: ${guide}`);
    }
  }

  // 3. Validate plan naming
  if (tool === 'Write' && typeof typedArgs.file_path === 'string' && typedArgs.file_path.startsWith('docs/plans/')) {
    const result = validatePlanNaming(typedArgs.file_path);
    if (!result.valid) {
      log.error('❌ Invalid plan filename');
      log.error(result.error);
      return {
        allow: false,
        message: 'Plan filename does not follow naming convention',
      };
    }
    log.info(`✅ Plan naming validated: ${result.format}`);
  }

  // 4. Check if TypeScript file should have test
  if (tool === 'Write' && typeof typedArgs.file_path === 'string' && typedArgs.file_path.endsWith('.ts') && !typedArgs.file_path.endsWith('.test.ts')) {
    const testPath = typedArgs.file_path.replace('.ts', '.test.ts');
    if (!existsSync(testPath)) {
      log.info(`💡 Consider creating test: ${testPath}`);
    }
  }

  return { allow: true };
}

function getRelevantStyleGuide(filePath: string): string | null {
  if (filePath.startsWith('docs/plans/')) {
    return 'docs/style_guides/docs/plan-format.md';
  }
  if (filePath.startsWith('docs/workflows/')) {
    return 'docs/style_guides/docs/README.md';
  }
  if (filePath.startsWith('books/') || filePath.includes('/manuscript/')) {
    return 'docs/style_guides/book/writing-style-guide.md';
  }
  if (filePath === 'README.md' || filePath.startsWith('src/')) {
    return 'docs/style_guides/docs/README.md';
  }
  return null;
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/before_tool_call.ts
