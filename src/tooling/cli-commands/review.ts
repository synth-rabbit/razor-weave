/* eslint-disable no-console */
import { getDatabase } from '@razorweave/database';
import { log } from '../logging/logger.js';
import {
  CampaignClient,
  ReviewOrchestrator,
  writeAnalysisMarkdown,
  AnalysisDataSchema,
  collectReviews,
  getCollectionStatus,
  type CampaignStatus,
  type ContentType,
  type FocusCategory,
  type AddReviewersParams,
} from '../reviews/index.js';
import { unlinkSync, existsSync } from 'fs';

export interface ReviewBookOptions {
  personas?: string;
  plus?: number;
  generated?: number;
  focus?: string;
}

export interface ListCampaignsFilters {
  status?: CampaignStatus;
  contentType?: ContentType;
}

/**
 * Common logic for executing a review campaign
 */
function executeReviewCampaign(
  contentPath: string,
  contentType: 'book' | 'chapter',
  options?: ReviewBookOptions
): void {
  log.info(`\nReviewing ${contentType}: ${contentPath}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);
  const orchestrator = new ReviewOrchestrator(rawDb, campaignClient);

  // Validate mutual exclusivity
  if (options?.plus !== undefined && options?.generated !== undefined) {
    log.error('Error: --plus and --generated are mutually exclusive');
    process.exit(1);
  }

  // Parse persona selection
  let personaSelectionStrategy: 'all_core' | 'manual' = 'all_core';
  let personaIds: string[] | undefined;

  if (options?.personas && options.personas !== 'all_core') {
    personaSelectionStrategy = 'manual';
    personaIds = options.personas.split(',').map((id) => id.trim());
  }

  // Validate focus if provided
  const validFocuses = ['general', 'gm-content', 'combat', 'narrative', 'character-creation', 'quickstart'];
  if (options?.focus && !validFocuses.includes(options.focus)) {
    log.error(`Error: Invalid focus '${options.focus}'. Valid options: ${validFocuses.join(', ')}`);
    process.exit(1);
  }

  // Initialize campaign with sampling options
  log.info('Creating review campaign...');
  const campaignId = orchestrator.initializeCampaign({
    campaignName: `${contentPath} Review - ${new Date().toISOString()}`,
    contentType,
    contentPath,
    personaSelectionStrategy,
    personaIds,
    plusCount: options?.plus,
    generatedCount: options?.generated,
    focus: options?.focus as FocusCategory | undefined,
  });

  // Generate prompt files and show next steps
  orchestrator.executeReviews(campaignId);
}

/**
 * Command: review book <path>
 * Reviews an HTML book using selected personas
 */
export function reviewBook(
  bookPath: string,
  options?: ReviewBookOptions
): void {
  executeReviewCampaign(bookPath, 'book', options);
}

/**
 * Command: review chapter <path>
 * Reviews a markdown chapter using selected personas
 */
export function reviewChapter(
  chapterPath: string,
  options?: ReviewBookOptions
): void {
  executeReviewCampaign(chapterPath, 'chapter', options);
}

/**
 * Command: review list
 * Lists all review campaigns
 */
export function listCampaigns(filters?: ListCampaignsFilters): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaigns = campaignClient.listCampaigns(filters || {});

  log.info(`\nFound ${campaigns.length} campaigns:\n`);

  for (const campaign of campaigns) {
    log.info(`[${campaign.status}] ${campaign.campaign_name}`);
    log.info(`  ID: ${campaign.id}`);
    log.info(`  Type: ${campaign.content_type}`);
    log.info(`  Created: ${campaign.created_at}`);
    log.info('');
  }
}

/**
 * Command: review view <campaign-id>
 * Views campaign details
 */
export function viewCampaign(
  campaignId: string,
  options?: { format?: 'text' | 'json' }
): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaign = campaignClient.getCampaign(campaignId);

  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    return;
  }

  if (options?.format === 'json') {
    log.info(JSON.stringify(campaign, null, 2));
    return;
  }

  log.info(`\nCampaign: ${campaign.campaign_name}\n`);
  log.info(`Status: ${campaign.status}`);
  log.info(`Type: ${campaign.content_type}`);
  log.info(`Content ID: ${campaign.content_id}`);
  const personaIds = JSON.parse(campaign.persona_ids) as string[];
  log.info(`Personas: ${personaIds.join(', ')}`);
  log.info(`Created: ${campaign.created_at}`);
  if (campaign.completed_at) {
    log.info(`Completed: ${campaign.completed_at}`);
  }

  // Show reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  log.info(`\nReviews: ${reviews.length}\n`);

  for (const review of reviews) {
    log.info(`  [${review.status}] ${review.persona_id}`);
  }

  // Show analysis if exists
  const analysis = campaignClient.getCampaignAnalysis(campaignId);
  if (analysis) {
    log.info(`\nAnalysis: ${analysis.markdown_path}`);
  }
}

/**
 * Command: review status <campaign-id>
 * Shows campaign status with review progress and next steps
 */
export function statusCampaign(campaignId: string): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    process.exit(1);
  }

  const reviews = campaignClient.getCampaignReviews(campaignId);
  const analysis = campaignClient.getCampaignAnalysis(campaignId);

  // Parse persona IDs to determine expected count
  const personaIds = JSON.parse(campaign.persona_ids || '[]') as string[];
  const expectedReviews = personaIds.length;
  const completedReviews = reviews.length;

  log.info(`\nCampaign: ${campaignId}`);
  log.info(`Status: ${campaign.status}`);
  log.info(`Expected reviews: ${expectedReviews}`);
  log.info(`Completed reviews: ${completedReviews}`);

  // Show missing reviews if any
  if (completedReviews < expectedReviews) {
    const completedPersonaIds = reviews.map((r) => r.persona_id);
    const missingPersonaIds = personaIds.filter((id) => !completedPersonaIds.includes(id));
    log.info(`Missing reviews: ${missingPersonaIds.join(', ')}`);
  } else {
    log.info('Missing reviews: (none)');
  }

  // Provide next step instructions
  if (campaign.status === 'in_progress' && completedReviews === expectedReviews) {
    log.info('\n✅ All reviews complete! Ready for analysis.\n');
    log.info('Next: Tell Claude Code to run analysis\n');
    log.info('────────────────────────────────────────────────────────');
    log.info(`Read analyzer prompt from data/reviews/prompts/${campaignId}/analyzer.txt`);
    log.info(`and execute analyzer agent`);
    log.info('────────────────────────────────────────────────────────\n');
  } else if (campaign.status === 'analyzing' && analysis) {
    log.info('\n✅ Analysis complete!\n');
    log.info(`📁 Outputs:`);
    log.info(`  Reviews: data/reviews/raw/${campaignId}/`);
    log.info(`  Analysis: data/reviews/analysis/${campaignId}.md\n`);
  } else if (campaign.status === 'completed') {
    log.info('\n✅ Campaign completed!\n');
    log.info(`📁 Outputs:`);
    log.info(`  Reviews: ${completedReviews} reviews`);
    log.info(`  Analysis: ${analysis ? 'Generated' : 'Not found'}\n`);
  } else {
    log.info('\nWaiting for reviews to complete...\n');
  }
}

interface PersonaProfile {
  id: string;
  name: string;
  archetype: string;
  experience_level: string;
}

interface ParsedReviewData {
  ratings: {
    clarity_readability: number;
    rules_accuracy: number;
    persona_fit: number;
    practical_usability: number;
  };
  narrative_feedback: string;
  issue_annotations: Array<{
    section: string;
    issue: string;
    impact: string;
  }>;
}

/**
 * Command: review analyze <campaign-id>
 * Analyzes all reviews for a campaign and generates aggregated insights
 */
export function analyzeCampaign(campaignId: string): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  // Get campaign
  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    process.exit(1);
  }

  // Check if analysis already exists
  const existingAnalysis = campaignClient.getCampaignAnalysis(campaignId);
  if (existingAnalysis) {
    log.info(`Analysis already exists for campaign ${campaignId}`);
    log.info(`Markdown: ${existingAnalysis.markdown_path}`);
    return;
  }

  // Get all reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  if (reviews.length === 0) {
    log.error(`No reviews found for campaign ${campaignId}`);
    process.exit(1);
  }

  log.info(`\nAnalyzing ${reviews.length} reviews for campaign: ${campaignId}\n`);

  // Get persona profiles
  const personaIds = reviews.map((r) => r.persona_id);
  const placeholders = personaIds.map(() => '?').join(',');
  const personas = rawDb
    .prepare(`SELECT id, name, archetype, experience_level FROM personas WHERE id IN (${placeholders})`)
    .all(...personaIds) as PersonaProfile[];

  const personaMap = new Map(personas.map((p) => [p.id, p]));

  // Parse all review data
  const parsedReviews = reviews.map((r) => ({
    personaId: r.persona_id,
    data: JSON.parse(r.review_data) as ParsedReviewData,
  }));

  // Calculate dimension averages
  const clarityScores = parsedReviews.map((r) => r.data.ratings.clarity_readability);
  const accuracyScores = parsedReviews.map((r) => r.data.ratings.rules_accuracy);
  const fitScores = parsedReviews.map((r) => r.data.ratings.persona_fit);
  const usabilityScores = parsedReviews.map((r) => r.data.ratings.practical_usability);

  const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

  // Collect all issues and count frequency
  const issuesByCategory = new Map<string, { count: number; personas: string[]; descriptions: string[] }>();

  for (const review of parsedReviews) {
    for (const issue of review.data.issue_annotations) {
      const category = issue.section;
      const existing = issuesByCategory.get(category) || { count: 0, personas: [], descriptions: [] };
      existing.count++;
      existing.personas.push(review.personaId);
      if (!existing.descriptions.includes(issue.issue)) {
        existing.descriptions.push(issue.issue);
      }
      issuesByCategory.set(category, existing);
    }
  }

  // Sort issues by frequency for priority rankings
  const priorityRankings = Array.from(issuesByCategory.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([category, data], idx) => ({
      category,
      severity: Math.max(1, Math.min(10, 10 - idx)), // Higher frequency = higher severity
      frequency: data.count,
      affected_personas: [...new Set(data.personas)],
      description: data.descriptions.slice(0, 3).join('; '),
    }));

  // Group personas by archetype for breakdowns
  const archetypeGroups = new Map<string, { strengths: string[]; struggles: string[] }>();

  for (const review of parsedReviews) {
    const persona = personaMap.get(review.personaId);
    if (!persona) continue;

    const archetype = persona.archetype;
    const group = archetypeGroups.get(archetype) || { strengths: [], struggles: [] };

    // High scores indicate strengths, low scores indicate struggles
    const avgScore =
      (review.data.ratings.clarity_readability +
        review.data.ratings.rules_accuracy +
        review.data.ratings.persona_fit +
        review.data.ratings.practical_usability) /
      4;

    if (avgScore >= 7) {
      group.strengths.push(`${persona.name}: Strong overall fit`);
    } else if (avgScore < 6) {
      group.struggles.push(`${persona.name}: ${review.data.issue_annotations[0]?.issue || 'Low overall fit'}`);
    }

    archetypeGroups.set(archetype, group);
  }

  // Build persona_breakdowns object
  const personaBreakdowns: Record<string, { strengths: string[]; struggles: string[] }> = {};
  for (const [archetype, data] of archetypeGroups) {
    personaBreakdowns[archetype] = {
      strengths: data.strengths.length > 0 ? data.strengths.slice(0, 5) : ['Generally positive reception'],
      struggles: data.struggles.length > 0 ? data.struggles.slice(0, 5) : ['No major issues identified'],
    };
  }

  // Extract common themes from feedback
  const extractThemes = (reviews: typeof parsedReviews, dimension: keyof ParsedReviewData['ratings']) => {
    const themes: string[] = [];
    const highScorers = reviews.filter((r) => r.data.ratings[dimension] >= 7);
    const lowScorers = reviews.filter((r) => r.data.ratings[dimension] < 6);

    if (highScorers.length > lowScorers.length) {
      themes.push('Generally well-received');
    } else if (lowScorers.length > highScorers.length) {
      themes.push('Needs improvement');
    } else {
      themes.push('Mixed reception');
    }

    return themes;
  };

  // Build analysis data
  const analysisData = {
    executive_summary: `Analysis of ${reviews.length} persona reviews for campaign ${campaignId}. Average scores: Clarity ${avg(clarityScores)}/10, Rules Accuracy ${avg(accuracyScores)}/10, Persona Fit ${avg(fitScores)}/10, Usability ${avg(usabilityScores)}/10. Top issue categories: ${priorityRankings
      .slice(0, 3)
      .map((p) => p.category)
      .join(', ')}.`,
    priority_rankings: priorityRankings,
    dimension_summaries: {
      clarity_readability: {
        average: avg(clarityScores),
        themes: extractThemes(parsedReviews, 'clarity_readability'),
      },
      rules_accuracy: {
        average: avg(accuracyScores),
        themes: extractThemes(parsedReviews, 'rules_accuracy'),
      },
      persona_fit: {
        average: avg(fitScores),
        themes: extractThemes(parsedReviews, 'persona_fit'),
      },
      practical_usability: {
        average: avg(usabilityScores),
        themes: extractThemes(parsedReviews, 'practical_usability'),
      },
    },
    persona_breakdowns: personaBreakdowns,
  };

  // Validate against schema
  const validated = AnalysisDataSchema.parse(analysisData);

  // Save to database
  const markdownPath = `data/reviews/analysis/${campaignId}.md`;
  campaignClient.createCampaignAnalysis({
    campaignId,
    analysisData: validated,
    markdownPath,
  });

  // Write markdown
  writeAnalysisMarkdown({
    campaignId,
    campaignName: campaign.campaign_name,
    contentType: campaign.content_type as 'book' | 'chapter',
    contentTitle: campaign.content_id,
    personaCount: reviews.length,
    analysisData: validated,
    createdAt: new Date().toISOString(),
    outputPath: markdownPath,
  });

  // Update campaign status
  campaignClient.updateStatus(campaignId, 'completed');

  log.info('Analysis complete!\n');
  log.info(`Dimension Averages:`);
  log.info(`  Clarity & Readability: ${avg(clarityScores)}/10`);
  log.info(`  Rules Accuracy: ${avg(accuracyScores)}/10`);
  log.info(`  Persona Fit: ${avg(fitScores)}/10`);
  log.info(`  Practical Usability: ${avg(usabilityScores)}/10`);
  log.info(`\nTop Issues (${priorityRankings.length}):`);
  for (const ranking of priorityRankings.slice(0, 5)) {
    log.info(`  - ${ranking.category} (${ranking.frequency} mentions)`);
  }
  log.info(`\nOutputs:`);
  log.info(`  Database: campaign_analyses table`);
  log.info(`  Markdown: ${markdownPath}`);
}

export interface AddReviewersOptions {
  core?: boolean;
  plus?: number;
  personas?: string;
  focus?: string;
}

/**
 * Command: review add-reviewers <campaign-id>
 * Adds reviewers to an existing campaign and generates prompts for them
 */
export function addReviewers(
  campaignId: string,
  options?: AddReviewersOptions
): void {
  log.info(`\nAdding reviewers to campaign: ${campaignId}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);
  const orchestrator = new ReviewOrchestrator(rawDb, campaignClient);

  // Validate focus if provided
  const validFocuses = ['general', 'gm-content', 'combat', 'narrative', 'character-creation', 'quickstart'];
  if (options?.focus && !validFocuses.includes(options.focus)) {
    log.error(`Error: Invalid focus '${options.focus}'. Valid options: ${validFocuses.join(', ')}`);
    process.exit(1);
  }

  // Build params
  const params: AddReviewersParams = {
    core: options?.core,
    plus: options?.plus,
    focus: options?.focus as FocusCategory | undefined,
  };

  // Parse persona IDs if provided
  if (options?.personas) {
    params.personaIds = options.personas.split(',').map(id => id.trim());
  }

  // Validate at least one option provided
  if (!params.core && !params.plus && (!params.personaIds || params.personaIds.length === 0)) {
    log.error('Error: Must specify at least one of --core, --plus=N, or --personas=...');
    process.exit(1);
  }

  try {
    const result = orchestrator.addReviewers(campaignId, params);

    if (result.addedCount === 0) {
      log.info('\nNo new reviewers added (all specified personas already in campaign)');
    }
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Command: review collect <campaign-id>
 * Collects review JSON files written by agents and persists to database
 */
export function collectCampaignReviews(campaignId: string): void {
  log.info(`\nCollecting reviews for campaign: ${campaignId}\n`);

  const db = getDatabase();
  const rawDb = db.getDb();

  // First show status
  const status = getCollectionStatus(rawDb, campaignId);
  log.info(`Expected reviewers: ${status.expected.length}`);
  log.info(`Already collected: ${status.collected.length}`);
  log.info(`JSON files found: ${status.hasJsonFiles.length}`);
  log.info(`Pending: ${status.pending.length}`);

  if (status.hasJsonFiles.length === 0) {
    log.info('\nNo JSON files to collect. Run reviewer agents first.');
    return;
  }

  // Collect reviews
  const result = collectReviews(rawDb, campaignId);

  log.info(`\n✅ Collection complete!`);
  log.info(`  Collected: ${result.collected}`);
  log.info(`  Skipped (already in DB): ${result.skipped}`);
  if (result.errors.length > 0) {
    log.warn(`  Errors: ${result.errors.length}`);
    for (const error of result.errors) {
      log.error(`    - ${error}`);
    }
  }

  // Check if all reviews are now collected
  const newStatus = getCollectionStatus(rawDb, campaignId);
  if (newStatus.pending.length === 0) {
    log.info('\n✅ All reviews collected! Ready for analysis.');
    log.info(`\nNext: pnpm review:analyze ${campaignId}`);
  } else {
    log.info(`\n⏳ Still waiting for ${newStatus.pending.length} reviews:`);
    for (const personaId of newStatus.pending.slice(0, 10)) {
      log.info(`  - ${personaId}`);
    }
    if (newStatus.pending.length > 10) {
      log.info(`  ... and ${newStatus.pending.length - 10} more`);
    }
  }
}

/**
 * Command: review reanalyze <campaign-id>
 * Reruns analysis for a campaign, overwriting any existing analysis
 */
export function reanalyzeCampaign(campaignId: string): void {
  const db = getDatabase();
  const rawDb = db.getDb();
  const campaignClient = new CampaignClient(rawDb);

  // Get campaign
  const campaign = campaignClient.getCampaign(campaignId);
  if (!campaign) {
    log.error(`Campaign not found: ${campaignId}`);
    process.exit(1);
  }

  // Check if analysis exists and delete it
  const existingAnalysis = campaignClient.getCampaignAnalysis(campaignId);
  if (existingAnalysis) {
    log.info(`\nDeleting existing analysis for campaign ${campaignId}...`);

    // Delete the markdown file if it exists
    if (existsSync(existingAnalysis.markdown_path)) {
      unlinkSync(existingAnalysis.markdown_path);
      log.info(`  Deleted: ${existingAnalysis.markdown_path}`);
    }

    // Delete the database record
    campaignClient.deleteAnalysis(campaignId);
    log.info(`  Deleted database record`);
  }

  // Get all reviews
  const reviews = campaignClient.getCampaignReviews(campaignId);
  if (reviews.length === 0) {
    log.error(`No reviews found for campaign ${campaignId}`);
    process.exit(1);
  }

  log.info(`\nReanalyzing ${reviews.length} reviews for campaign: ${campaignId}\n`);

  // Get persona profiles
  const personaIds = reviews.map((r) => r.persona_id);
  const placeholders = personaIds.map(() => '?').join(',');
  const personas = rawDb
    .prepare(`SELECT id, name, archetype, experience_level FROM personas WHERE id IN (${placeholders})`)
    .all(...personaIds) as PersonaProfile[];

  const personaMap = new Map(personas.map((p) => [p.id, p]));

  // Parse all review data
  const parsedReviews = reviews.map((r) => ({
    personaId: r.persona_id,
    data: JSON.parse(r.review_data) as ParsedReviewData,
  }));

  // Calculate dimension averages
  const clarityScores = parsedReviews.map((r) => r.data.ratings.clarity_readability);
  const accuracyScores = parsedReviews.map((r) => r.data.ratings.rules_accuracy);
  const fitScores = parsedReviews.map((r) => r.data.ratings.persona_fit);
  const usabilityScores = parsedReviews.map((r) => r.data.ratings.practical_usability);

  const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

  // Collect all issues and count frequency
  const issuesByCategory = new Map<string, { count: number; personas: string[]; descriptions: string[] }>();

  for (const review of parsedReviews) {
    for (const issue of review.data.issue_annotations) {
      const category = issue.section;
      const existing = issuesByCategory.get(category) || { count: 0, personas: [], descriptions: [] };
      existing.count++;
      existing.personas.push(review.personaId);
      if (!existing.descriptions.includes(issue.issue)) {
        existing.descriptions.push(issue.issue);
      }
      issuesByCategory.set(category, existing);
    }
  }

  // Sort issues by frequency for priority rankings
  const priorityRankings = Array.from(issuesByCategory.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([category, data], idx) => ({
      category,
      severity: Math.max(1, Math.min(10, 10 - idx)),
      frequency: data.count,
      affected_personas: [...new Set(data.personas)],
      description: data.descriptions.slice(0, 3).join('; '),
    }));

  // Group personas by archetype for breakdowns
  const archetypeGroups = new Map<string, { strengths: string[]; struggles: string[] }>();

  for (const review of parsedReviews) {
    const persona = personaMap.get(review.personaId);
    if (!persona) continue;

    const archetype = persona.archetype;
    const group = archetypeGroups.get(archetype) || { strengths: [], struggles: [] };

    const avgScore =
      (review.data.ratings.clarity_readability +
        review.data.ratings.rules_accuracy +
        review.data.ratings.persona_fit +
        review.data.ratings.practical_usability) /
      4;

    if (avgScore >= 7) {
      group.strengths.push(`${persona.name}: Strong overall fit`);
    } else if (avgScore < 6) {
      group.struggles.push(`${persona.name}: ${review.data.issue_annotations[0]?.issue || 'Low overall fit'}`);
    }

    archetypeGroups.set(archetype, group);
  }

  // Build persona_breakdowns object
  const personaBreakdowns: Record<string, { strengths: string[]; struggles: string[] }> = {};
  for (const [archetype, data] of archetypeGroups) {
    personaBreakdowns[archetype] = {
      strengths: data.strengths.length > 0 ? data.strengths.slice(0, 5) : ['Generally positive reception'],
      struggles: data.struggles.length > 0 ? data.struggles.slice(0, 5) : ['No major issues identified'],
    };
  }

  // Extract common themes from feedback
  const extractThemes = (reviews: typeof parsedReviews, dimension: keyof ParsedReviewData['ratings']) => {
    const themes: string[] = [];
    const highScorers = reviews.filter((r) => r.data.ratings[dimension] >= 7);
    const lowScorers = reviews.filter((r) => r.data.ratings[dimension] < 6);

    if (highScorers.length > lowScorers.length) {
      themes.push('Generally well-received');
    } else if (lowScorers.length > highScorers.length) {
      themes.push('Needs improvement');
    } else {
      themes.push('Mixed reception');
    }

    return themes;
  };

  // Build analysis data
  const analysisData = {
    executive_summary: `Reanalysis of ${reviews.length} persona reviews for campaign ${campaignId}. Average scores: Clarity ${avg(clarityScores)}/10, Rules Accuracy ${avg(accuracyScores)}/10, Persona Fit ${avg(fitScores)}/10, Usability ${avg(usabilityScores)}/10. Top issue categories: ${priorityRankings
      .slice(0, 3)
      .map((p) => p.category)
      .join(', ')}.`,
    priority_rankings: priorityRankings,
    dimension_summaries: {
      clarity_readability: {
        average: avg(clarityScores),
        themes: extractThemes(parsedReviews, 'clarity_readability'),
      },
      rules_accuracy: {
        average: avg(accuracyScores),
        themes: extractThemes(parsedReviews, 'rules_accuracy'),
      },
      persona_fit: {
        average: avg(fitScores),
        themes: extractThemes(parsedReviews, 'persona_fit'),
      },
      practical_usability: {
        average: avg(usabilityScores),
        themes: extractThemes(parsedReviews, 'practical_usability'),
      },
    },
    persona_breakdowns: personaBreakdowns,
  };

  // Validate against schema
  const validated = AnalysisDataSchema.parse(analysisData);

  // Save to database
  const markdownPath = `data/reviews/analysis/${campaignId}.md`;
  campaignClient.createCampaignAnalysis({
    campaignId,
    analysisData: validated,
    markdownPath,
  });

  // Write markdown
  writeAnalysisMarkdown({
    campaignId,
    campaignName: campaign.campaign_name,
    contentType: campaign.content_type as 'book' | 'chapter',
    contentTitle: campaign.content_id,
    personaCount: reviews.length,
    analysisData: validated,
    createdAt: new Date().toISOString(),
    outputPath: markdownPath,
  });

  // Update campaign status
  campaignClient.updateStatus(campaignId, 'completed');

  log.info('Reanalysis complete!\n');
  log.info(`Dimension Averages:`);
  log.info(`  Clarity & Readability: ${avg(clarityScores)}/10`);
  log.info(`  Rules Accuracy: ${avg(accuracyScores)}/10`);
  log.info(`  Persona Fit: ${avg(fitScores)}/10`);
  log.info(`  Practical Usability: ${avg(usabilityScores)}/10`);
  log.info(`\nTop Issues (${priorityRankings.length}):`);
  for (const ranking of priorityRankings.slice(0, 5)) {
    log.info(`  - ${ranking.category} (${ranking.frequency} mentions)`);
  }
  log.info(`\nOutputs:`);
  log.info(`  Database: campaign_analyses table`);
  log.info(`  Markdown: ${markdownPath}`);
}
