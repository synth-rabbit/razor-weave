import { writeFile } from 'fs/promises';

const PROMPT_TEMPLATE = `# Razorweave Project

## Quick Reference

This project contains all materials for creating, editing, and publishing the Razorweave TTRPG system and setting books.

### Start Here

- **For Humans**: See [README.md](README.md) for project overview and getting started
- **For Agents**: See [AGENTS.md](AGENTS.md) for agent instructions and workflows
- **Find Files**: See [INDEX.md](INDEX.md) for navigation and file locations
- **Current Status**: See [PLAN.md](PLAN.md) for project state and milestones

### Documentation

All detailed documentation is located in \`docs/\`:

- **Project Architecture**: [docs/plans/DIRECTORY_STRUCTURE.md](docs/plans/DIRECTORY_STRUCTURE.md)
- **Workflows**: [docs/workflows/END_TO_END_PIPELINE.md](docs/workflows/END_TO_END_PIPELINE.md)
- **Agentic Processes**: [docs/agents/AGENTIC_PROCESSES.md](docs/agents/AGENTIC_PROCESSES.md)
- **Style Guides**: [docs/style_guides/](docs/style_guides/)
- **Plans**: [docs/plans/](docs/plans/)

## Context

## Instructions

`;

export async function resetPromptMd(): Promise<boolean> {
  console.log('📝 Resetting PROMPT.md...');
  await writeFile('PROMPT.md', PROMPT_TEMPLATE);
  console.log('✅ Reset PROMPT.md to template');
  return true;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetPromptMd().catch(console.error);
}
