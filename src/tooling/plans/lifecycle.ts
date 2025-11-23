// src/tooling/plans/lifecycle.ts
// Plan lifecycle management - frontmatter parsing, status updates, archival

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join, basename } from 'node:path';
import Database from 'better-sqlite3';

export type PlanStatus = 'draft' | 'active' | 'complete' | 'archived';

export interface PlanFrontmatter {
  status: PlanStatus;
  created?: string;
  updated?: string;
  session_id?: string;
  approved?: string;
  workflow?: string;
}

export interface PlanInfo {
  path: string;
  filename: string;
  frontmatter: PlanFrontmatter | null;
  title: string;
}

/**
 * Parse frontmatter from a markdown file
 */
export function parseFrontmatter(content: string): { frontmatter: PlanFrontmatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yamlContent = match[1];
  const body = match[2];

  // Simple YAML parsing for our limited use case
  const frontmatter: PlanFrontmatter = { status: 'draft' };
  for (const line of yamlContent.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      if (key === 'status') frontmatter.status = value.toLowerCase() as PlanStatus;
      else if (key === 'created') frontmatter.created = value;
      else if (key === 'updated') frontmatter.updated = value;
      else if (key === 'session_id') frontmatter.session_id = value;
      else if (key === 'approved') frontmatter.approved = value;
      else if (key === 'workflow') frontmatter.workflow = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Update frontmatter in a markdown file
 */
export function updateFrontmatter(filepath: string, updates: Partial<PlanFrontmatter>): void {
  const content = readFileSync(filepath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  const newFrontmatter = {
    ...(frontmatter || { status: 'draft' }),
    ...updates,
    updated: new Date().toISOString().split('T')[0]
  };

  const yamlLines = Object.entries(newFrontmatter)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`);

  const newContent = `---\n${yamlLines.join('\n')}\n---\n${body}`;
  writeFileSync(filepath, newContent);
}

/**
 * Extract title from markdown content (first # heading)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * List all plans in a directory
 */
export function listPlans(plansDir: string): PlanInfo[] {
  const plans: PlanInfo[] = [];

  if (!existsSync(plansDir)) {
    return plans;
  }

  const files = readdirSync(plansDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filepath = join(plansDir, file);
    const content = readFileSync(filepath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const title = extractTitle(body);

    plans.push({
      path: filepath,
      filename: file,
      frontmatter,
      title
    });
  }

  return plans;
}

/**
 * Archive completed plans older than specified days
 */
export function archiveCompletedPlans(plansDir: string, archiveDir: string, daysOld = 7): string[] {
  const archived: string[] = [];
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }

  const plans = listPlans(plansDir);

  for (const plan of plans) {
    if (plan.frontmatter?.status === 'complete') {
      const updated = plan.frontmatter.updated ? new Date(plan.frontmatter.updated).getTime() : 0;
      if (updated < cutoff) {
        const destPath = join(archiveDir, plan.filename);
        // Update status to archived
        updateFrontmatter(plan.path, { status: 'archived' });
        renameSync(plan.path, destPath);
        archived.push(plan.filename);
      }
    }
  }

  return archived;
}

/**
 * Generate a plan index markdown file
 */
export function generatePlanIndex(plansDir: string): string {
  const lines: string[] = [
    '# Plan Index',
    '',
    `*Auto-generated on ${new Date().toISOString().split('T')[0]}*`,
    ''
  ];

  // Active plans
  const activePlans = listPlans(plansDir).filter(p => p.frontmatter?.status === 'active');
  if (activePlans.length > 0) {
    lines.push('## Active Plans', '');
    for (const plan of activePlans) {
      lines.push(`- [${plan.title}](${plan.filename})`);
    }
    lines.push('');
  }

  // Draft plans
  const draftPlans = listPlans(plansDir).filter(p => !p.frontmatter || p.frontmatter.status === 'draft');
  if (draftPlans.length > 0) {
    lines.push('## Draft Plans', '');
    for (const plan of draftPlans) {
      lines.push(`- [${plan.title}](${plan.filename})`);
    }
    lines.push('');
  }

  // Proposals
  const proposalsDir = join(plansDir, 'proposals');
  if (existsSync(proposalsDir)) {
    const proposals = listPlans(proposalsDir);
    if (proposals.length > 0) {
      lines.push('## Proposals', '');
      for (const plan of proposals) {
        const status = plan.frontmatter?.status || 'draft';
        lines.push(`- [${plan.title}](proposals/${plan.filename}) (${status.toUpperCase()})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Sync plan status to database
 */
export function syncPlanToDatabase(db: Database.Database, planPath: string): void {
  const content = readFileSync(planPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const title = extractTitle(body);
  const filename = basename(planPath);

  const id = `plan_${filename.replace(/\.md$/, '').replace(/[^a-z0-9]/gi, '_')}`;

  db.prepare(`
    INSERT INTO plans (id, file_path, title, status, session_id, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      title = excluded.title,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    id,
    planPath,
    title,
    frontmatter?.status || 'draft',
    frontmatter?.session_id || null
  );
}

/**
 * Mark a plan as complete (typically called by boardroom:approve)
 */
export function markPlanComplete(planPath: string, sessionId?: string): void {
  updateFrontmatter(planPath, {
    status: 'complete',
    approved: new Date().toISOString().split('T')[0],
    session_id: sessionId
  });
}
