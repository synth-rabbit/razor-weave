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
    console.log(`✅ Created: ${typedArgs.file_path}`);
  }

  // 2. Log successful file edits
  if (tool === 'Edit' && typeof typedArgs.file_path === 'string') {
    console.log(`✏️  Updated: ${typedArgs.file_path}`);
  }

  // 3. Track test execution results
  if (tool === 'Bash' && typeof typedArgs.command === 'string') {
    const cmd = typedArgs.command;
    if (cmd.includes('test') || cmd.includes('vitest')) {
      const resultObj = result as { stdout?: string; stderr?: string };
      const output = resultObj.stdout || resultObj.stderr || '';

      if (output.includes('FAIL') || output.includes('failed')) {
        console.log('⚠️  Tests failed - review output above');
      } else if (output.includes('PASS') || output.includes('passed')) {
        console.log('✅ Tests passed');
      }
    }
  }

  return { success: true };
}

// Note: This hook is called by Claude Code, not directly
// Export for use in .claude/hooks/after_tool_call.ts
