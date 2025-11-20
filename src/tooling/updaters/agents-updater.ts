import { readFile, writeFile, readdir } from 'fs/promises';
import { log } from '../logging/logger.js';

export async function updateAgentsMd(): Promise<boolean> {
  log.info('📝 Updating AGENTS.md...');

  try {
    // Read current AGENTS.md
    const content = await readFile('AGENTS.md', 'utf-8');

    // Get agent directories
    const agentsPath = 'src/agents';
    const agentDirs = await getDirectories(agentsPath);

    // Generate updated agent roles section
    const updatedRoles = await generateAgentRoles(agentDirs);

    // Find and replace Agent Roles section
    const agentRolesStart = content.indexOf('## Agent Roles');
    if (agentRolesStart === -1) {
      log.warn('⚠️  Could not find "## Agent Roles" section');
      return false;
    }

    // Find next ## heading or end of file
    const nextSectionMatch = content
      .substring(agentRolesStart + 15)
      .match(/\n## /);
    const agentRolesEnd = nextSectionMatch
      ? agentRolesStart + 15 + nextSectionMatch.index!
      : content.length;

    const beforeSection = content.substring(0, agentRolesStart);
    const afterSection = content.substring(agentRolesEnd);
    const updatedContent = beforeSection + updatedRoles + afterSection;

    // Only write if changed
    if (content !== updatedContent) {
      await writeFile('AGENTS.md', updatedContent);
      log.info('✅ Updated AGENTS.md');
      return true;
    }

    log.info('ℹ️  AGENTS.md already up to date');
    return false;
  } catch (error) {
    log.error(`❌ Failed to update AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function getDirectories(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function generateAgentRoles(agentDirs: string[]): Promise<string> {
  let output = '## Agent Roles\n\n';

  for (const dir of agentDirs.sort()) {
    const agentName = titleCase(dir);
    const agentPath = `src/agents/${dir}`;

    output += `### ${agentName} Agents (\`${agentPath}/\`)\n`;
    output += `${getAgentDescription(dir)}\n\n`;

    // Check for README or files
    try {
      const files = await readdir(agentPath);
      const tsFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
      if (tsFiles.length > 0) {
        output += `**Implementation files:**\n`;
        tsFiles.forEach(f => {
          output += `- \`${f}\`\n`;
        });
        output += '\n';
      }
    } catch {
      // Directory might not exist yet
    }
  }

  return output;
}

function titleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getAgentDescription(dir: string): string {
  const descriptions: Record<string, string> = {
    content: 'Generate or revise manuscript content for books and settings.',
    review: 'Conduct persona-based reviews of content.',
    playtest: 'Simulate or analyze play sessions.',
    pdf: 'Generate and design PDF outputs.',
    release: 'Handle publication and website updates.',
  };
  return descriptions[dir] || 'Agent implementation.';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAgentsMd().catch((err) => log.error(err));
}
