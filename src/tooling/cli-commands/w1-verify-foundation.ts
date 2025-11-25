/**
 * W1 Foundation Verification Script
 *
 * Verifies that all Prework infrastructure is operational before W1 execution begins.
 * Tests:
 * - Workflow Infrastructure (WorkflowRepository, WorkflowStateMachine)
 * - Review System (CampaignClient, Persona database)
 * - Artifact Registry (ArtifactRegistry)
 *
 * Usage:
 *   pnpm w1:verify-foundation
 */

import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

import { WorkflowRepository } from '../workflows/repository.js';
import { WorkflowStateMachine } from '../workflows/state-machine.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { PersonaClient } from '@razorweave/database';
import { createTables } from '@razorweave/database';
import { runMigrations } from '@razorweave/database';

// ============================================================================
// Constants
// ============================================================================

const BOX_WIDTH = 59;
const DOUBLE_LINE = '='.repeat(BOX_WIDTH);
const SINGLE_LINE = '-'.repeat(BOX_WIDTH);

// ============================================================================
// Helpers
// ============================================================================

function getProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

function success(message: string): void {
  console.log(`  ✓ ${message}`);
}

function fail(message: string): void {
  console.log(`  ✗ ${message}`);
}

// ============================================================================
// Verification Functions
// ============================================================================

interface VerificationResult {
  passed: boolean;
  details: string[];
}

async function verifyWorkflowInfrastructure(
  db: Database.Database
): Promise<VerificationResult> {
  const details: string[] = [];
  let passed = true;

  // Test WorkflowRepository
  try {
    const repo = new WorkflowRepository(db);
    const runs = repo.list();
    success(`WorkflowRepository.list() works (${runs.length} runs found)`);
    details.push(`WorkflowRepository operational - ${runs.length} existing runs`);
  } catch (error) {
    fail(`WorkflowRepository.list() failed: ${error}`);
    details.push(`WorkflowRepository FAILED: ${error}`);
    passed = false;
  }

  // Test WorkflowStateMachine
  try {
    const machine = new WorkflowStateMachine('pending');
    const canTransition = machine.canTransitionTo('running');
    if (canTransition) {
      machine.transition('running');
      const validTransitions = machine.getValidTransitions();
      success(
        `WorkflowStateMachine operational (transitions: ${validTransitions.join(', ')})`
      );
      details.push('WorkflowStateMachine - state transitions validated');
    } else {
      throw new Error('State machine did not allow pending -> running transition');
    }
  } catch (error) {
    fail(`WorkflowStateMachine failed: ${error}`);
    details.push(`WorkflowStateMachine FAILED: ${error}`);
    passed = false;
  }

  return { passed, details };
}

async function verifyReviewSystem(
  db: Database.Database
): Promise<VerificationResult> {
  const details: string[] = [];
  let passed = true;

  // Test CampaignClient
  try {
    const campaignClient = new CampaignClient(db);
    const campaigns = campaignClient.listCampaigns({});
    success(`CampaignClient operational (${campaigns.length} campaigns found)`);
    details.push(`CampaignClient operational - ${campaigns.length} existing campaigns`);
  } catch (error) {
    fail(`CampaignClient failed: ${error}`);
    details.push(`CampaignClient FAILED: ${error}`);
    passed = false;
  }

  // Test PersonaClient
  try {
    const personaClient = new PersonaClient(db);
    const personas = personaClient.getAll();
    const coreCount = personas.filter((p) => p.type === 'core').length;
    const generatedCount = personas.filter((p) => p.type === 'generated').length;
    success(
      `Persona database accessible (${coreCount} core, ${generatedCount} generated)`
    );
    details.push(`Persona database - ${personas.length} total personas`);
  } catch (error) {
    fail(`Persona database failed: ${error}`);
    details.push(`Persona database FAILED: ${error}`);
    passed = false;
  }

  return { passed, details };
}

async function verifyArtifactRegistry(
  db: Database.Database
): Promise<VerificationResult> {
  const details: string[] = [];
  let passed = true;

  // Test ArtifactRegistry
  try {
    const registry = new ArtifactRegistry(db);

    // Test getByType (doesn't create data, just queries)
    const existingArtifacts = registry.getByType('chapter');
    success(
      `ArtifactRegistry operational (${existingArtifacts.length} chapter artifacts)`
    );
    details.push(`ArtifactRegistry operational`);
  } catch (error) {
    fail(`ArtifactRegistry failed: ${error}`);
    details.push(`ArtifactRegistry FAILED: ${error}`);
    passed = false;
  }

  // Test artifact query capability with different types
  try {
    const registry = new ArtifactRegistry(db);
    const pdfArtifacts = registry.getByType('pdf_draft');
    success(`Artifact query works (${pdfArtifacts.length} PDF artifacts found)`);
    details.push(`Artifact queries operational`);
  } catch (error) {
    fail(`Artifact query failed: ${error}`);
    details.push(`Artifact query FAILED: ${error}`);
    passed = false;
  }

  return { passed, details };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const projectRoot = getProjectRoot();
  const dbPath = resolve(projectRoot, 'data/project.db');

  // Initialize database
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  // Ensure tables exist
  createTables(db);

  // Run migrations
  try {
    runMigrations(dbPath);
  } catch {
    // Migrations might already be applied
  }

  console.log(DOUBLE_LINE);
  console.log('W1 FOUNDATION VERIFICATION');
  console.log(DOUBLE_LINE);
  console.log('');

  const results: { section: string; result: VerificationResult }[] = [];

  // Verify Workflow Infrastructure
  console.log('Workflow Infrastructure:');
  const workflowResult = await verifyWorkflowInfrastructure(db);
  results.push({ section: 'Workflow Infrastructure', result: workflowResult });
  console.log('');

  // Verify Review System
  console.log('Review System:');
  const reviewResult = await verifyReviewSystem(db);
  results.push({ section: 'Review System', result: reviewResult });
  console.log('');

  // Verify Artifact Registry
  console.log('Artifact Registry:');
  const artifactResult = await verifyArtifactRegistry(db);
  results.push({ section: 'Artifact Registry', result: artifactResult });
  console.log('');

  // Summary
  console.log(SINGLE_LINE);

  const allPassed = results.every((r) => r.result.passed);
  const passedCount = results.filter((r) => r.result.passed).length;
  const totalCount = results.length;

  if (allPassed) {
    console.log('RESULT: ALL CHECKS PASSED');
  } else {
    console.log(`RESULT: ${passedCount}/${totalCount} SECTIONS PASSED`);
    console.log('');
    console.log('Failed sections:');
    for (const { section, result } of results) {
      if (!result.passed) {
        console.log(`  - ${section}`);
        for (const detail of result.details) {
          if (detail.includes('FAILED')) {
            console.log(`      ${detail}`);
          }
        }
      }
    }
  }

  console.log(SINGLE_LINE);

  // Clean up
  db.close();

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
