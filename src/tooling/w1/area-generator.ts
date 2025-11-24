// src/tooling/w1/area-generator.ts
import type { ImprovementArea, AreaType, AnalysisForAreaGeneration } from './strategy-types.js';

/**
 * Options for area generation
 */
export interface AreaGenerationOptions {
  /** Maximum number of areas to generate (default: 6) */
  maxAreas?: number;
  /** Minimum severity to include (default: 0) */
  minSeverity?: number;
  /** Preferred grouping strategy */
  preferredStrategy?: AreaType;
  /** Maximum cycles per area (default: 3) */
  maxCyclesPerArea?: number;
}

/**
 * Generated area before being added to a strategic plan
 */
export type GeneratedArea = Omit<
  ImprovementArea,
  'status' | 'current_cycle' | 'baseline_score' | 'current_score' | 'delta_achieved' | 'chapters_modified' | 'baseline_metrics' | 'current_metrics' | 'delta'
>;

/**
 * Generate improvement areas from review analysis.
 *
 * Grouping strategies:
 * 1. issue_category - Group related issues together (all clarity issues)
 * 2. chapter_cluster - Group chapters that work together (combat chapters)
 * 3. persona_pain_point - Target specific persona struggles
 */
export function generateAreasFromAnalysis(
  analysis: AnalysisForAreaGeneration,
  options: AreaGenerationOptions = {}
): GeneratedArea[] {
  const {
    maxAreas = 6,
    minSeverity = 0,
    preferredStrategy,
    maxCyclesPerArea = 3,
  } = options;

  // Filter by minimum severity
  const filteredRankings = analysis.priority_rankings.filter(
    r => r.severity >= minSeverity
  );

  if (filteredRankings.length === 0) {
    return [];
  }

  // Generate areas using preferred or best-fit strategy
  let areas: GeneratedArea[];

  if (preferredStrategy === 'issue_category') {
    areas = groupByIssueCategory(filteredRankings, analysis, maxCyclesPerArea);
  } else if (preferredStrategy === 'chapter_cluster') {
    areas = groupByChapterCluster(filteredRankings, analysis, maxCyclesPerArea);
  } else if (preferredStrategy === 'persona_pain_point' && analysis.persona_breakdowns) {
    areas = groupByPersonaPainPoint(analysis.persona_breakdowns, filteredRankings, maxCyclesPerArea);
  } else {
    // Auto-select strategy based on data
    areas = autoSelectStrategy(analysis, filteredRankings, maxCyclesPerArea);
  }

  // Limit to max areas and sort by priority
  return areas
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxAreas);
}

/**
 * Group issues by category (clarity, accuracy, usability, etc.)
 */
function groupByIssueCategory(
  rankings: AnalysisForAreaGeneration['priority_rankings'],
  analysis: AnalysisForAreaGeneration,
  maxCycles: number
): GeneratedArea[] {
  // Group rankings by category
  const categoryMap = new Map<string, typeof rankings>();

  for (const ranking of rankings) {
    const existing = categoryMap.get(ranking.category) ?? [];
    existing.push(ranking);
    categoryMap.set(ranking.category, existing);
  }

  const areas: GeneratedArea[] = [];
  let priority = 1;

  for (const [category, categoryRankings] of Array.from(categoryMap.entries())) {
    // Collect all affected chapters and issues
    const chapters = new Set<string>();
    const issues = new Set<string>();

    for (const ranking of categoryRankings) {
      if (ranking.affected_chapters) {
        ranking.affected_chapters.forEach(c => chapters.add(c));
      }
      // Create issue IDs from category
      issues.add(`${category.toUpperCase().replace(/\s+/g, '-')}-${issues.size + 1}`);
    }

    // Calculate aggregate severity
    const avgSeverity = categoryRankings.reduce((sum, r) => sum + r.severity, 0) / categoryRankings.length;

    // Map category to dimension
    const dimension = mapCategoryToDimension(category);

    areas.push({
      area_id: `area-${category.toLowerCase().replace(/\s+/g, '-')}`,
      name: formatCategoryName(category),
      type: 'issue_category',
      description: categoryRankings[0]?.description,
      target_chapters: Array.from(chapters),
      target_issues: Array.from(issues),
      target_dimension: dimension,
      priority: priority++,
      max_cycles: maxCycles,
      delta_target: calculateDeltaTarget(avgSeverity),
    });
  }

  return areas;
}

/**
 * Group related chapters together (e.g., combat chapters, character creation)
 */
function groupByChapterCluster(
  rankings: AnalysisForAreaGeneration['priority_rankings'],
  analysis: AnalysisForAreaGeneration,
  maxCycles: number
): GeneratedArea[] {
  // Collect all affected chapters with their issues
  const chapterIssues = new Map<string, Set<string>>();
  const chapterSeverity = new Map<string, number[]>();

  for (const ranking of rankings) {
    const chapters = ranking.affected_chapters ?? [];
    for (const chapter of chapters) {
      if (!chapterIssues.has(chapter)) {
        chapterIssues.set(chapter, new Set());
        chapterSeverity.set(chapter, []);
      }
      chapterIssues.get(chapter)!.add(ranking.category);
      chapterSeverity.get(chapter)!.push(ranking.severity);
    }
  }

  // Cluster related chapters based on shared issues
  const clusters = clusterChapters(chapterIssues);

  const areas: GeneratedArea[] = [];
  let priority = 1;

  for (const cluster of clusters) {
    const chapters = Array.from(cluster);
    const issues = new Set<string>();
    let totalSeverity = 0;
    let severityCount = 0;

    for (const chapter of chapters) {
      const chapterCategories = chapterIssues.get(chapter);
      if (chapterCategories) {
        chapterCategories.forEach(cat => issues.add(cat));
      }
      const severities = chapterSeverity.get(chapter) ?? [];
      totalSeverity += severities.reduce((a, b) => a + b, 0);
      severityCount += severities.length;
    }

    const avgSeverity = severityCount > 0 ? totalSeverity / severityCount : 0;

    // Determine primary dimension based on issues
    const issueArray = Array.from(issues);
    const dimension = issueArray.length > 0
      ? mapCategoryToDimension(issueArray[0])
      : 'overall_score';

    // Generate cluster name from chapter names
    const clusterName = generateClusterName(chapters);

    areas.push({
      area_id: `area-cluster-${priority}`,
      name: clusterName,
      type: 'chapter_cluster',
      target_chapters: chapters,
      target_issues: issueArray.map((cat, i) => `${cat.toUpperCase().replace(/\s+/g, '-')}-${i + 1}`),
      target_dimension: dimension,
      priority: priority++,
      max_cycles: maxCycles,
      delta_target: calculateDeltaTarget(avgSeverity),
    });
  }

  return areas;
}

/**
 * Group by persona pain points
 */
function groupByPersonaPainPoint(
  breakdowns: NonNullable<AnalysisForAreaGeneration['persona_breakdowns']>,
  rankings: AnalysisForAreaGeneration['priority_rankings'],
  maxCycles: number
): GeneratedArea[] {
  const areas: GeneratedArea[] = [];
  let priority = 1;

  for (const [personaId, breakdown] of Object.entries(breakdowns)) {
    if (breakdown.struggles.length === 0) continue;

    // Find rankings that affect this persona
    const relevantRankings = rankings.filter(r =>
      r.affected_personas?.includes(personaId)
    );

    const chapters = new Set<string>();
    const issues = new Set<string>();

    for (const ranking of relevantRankings) {
      if (ranking.affected_chapters) {
        ranking.affected_chapters.forEach(c => chapters.add(c));
      }
      issues.add(ranking.category);
    }

    // If no specific rankings, use all chapters with high severity
    if (chapters.size === 0) {
      for (const ranking of rankings.slice(0, 3)) {
        if (ranking.affected_chapters) {
          ranking.affected_chapters.forEach(c => chapters.add(c));
        }
        issues.add(ranking.category);
      }
    }

    const avgSeverity = relevantRankings.length > 0
      ? relevantRankings.reduce((sum, r) => sum + r.severity, 0) / relevantRankings.length
      : 5;

    areas.push({
      area_id: `area-persona-${personaId.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${formatPersonaName(personaId)} Pain Points`,
      type: 'persona_pain_point',
      description: breakdown.struggles.slice(0, 2).join('; '),
      target_chapters: Array.from(chapters),
      target_issues: Array.from(issues).map((cat, i) => `${cat.toUpperCase().replace(/\s+/g, '-')}-${i + 1}`),
      target_dimension: 'persona_fit',
      priority: priority++,
      max_cycles: maxCycles,
      delta_target: calculateDeltaTarget(avgSeverity),
    });
  }

  return areas;
}

/**
 * Auto-select the best grouping strategy based on the data
 */
function autoSelectStrategy(
  analysis: AnalysisForAreaGeneration,
  rankings: AnalysisForAreaGeneration['priority_rankings'],
  maxCycles: number
): GeneratedArea[] {
  // Count unique categories, chapters, and personas
  const categories = new Set(rankings.map(r => r.category));
  const chapters = new Set(rankings.flatMap(r => r.affected_chapters ?? []));
  const personas = analysis.persona_breakdowns ? Object.keys(analysis.persona_breakdowns) : [];

  // If we have good persona breakdowns with struggles, use that
  if (personas.length >= 3 && analysis.persona_breakdowns) {
    const personasWithStruggles = Object.values(analysis.persona_breakdowns)
      .filter(b => b.struggles.length > 0);
    if (personasWithStruggles.length >= 3) {
      return groupByPersonaPainPoint(analysis.persona_breakdowns, rankings, maxCycles);
    }
  }

  // If we have distinct chapter clusters, use chapter clustering
  if (chapters.size >= 4 && categories.size < chapters.size / 2) {
    return groupByChapterCluster(rankings, analysis, maxCycles);
  }

  // Default to issue category grouping
  return groupByIssueCategory(rankings, analysis, maxCycles);
}

/**
 * Cluster chapters based on shared issues
 */
function clusterChapters(chapterIssues: Map<string, Set<string>>): Set<string>[] {
  const chapters = Array.from(chapterIssues.keys());
  const clusters: Set<string>[] = [];
  const assigned = new Set<string>();

  for (const chapter of chapters) {
    if (assigned.has(chapter)) continue;

    const cluster = new Set<string>([chapter]);
    assigned.add(chapter);

    const chapterCategories = chapterIssues.get(chapter)!;

    // Find related chapters with overlapping issues
    for (const other of chapters) {
      if (assigned.has(other)) continue;

      const otherCategories = chapterIssues.get(other)!;
      const overlap = Array.from(chapterCategories).filter(c => otherCategories.has(c));

      // If significant overlap, add to cluster
      if (overlap.length > 0 && overlap.length >= Math.min(chapterCategories.size, otherCategories.size) / 2) {
        cluster.add(other);
        assigned.add(other);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Map issue category to review dimension
 */
function mapCategoryToDimension(
  category: string
): 'clarity_readability' | 'rules_accuracy' | 'persona_fit' | 'practical_usability' | 'overall_score' {
  const lower = category.toLowerCase();

  if (lower.includes('clarity') || lower.includes('readable') || lower.includes('confus')) {
    return 'clarity_readability';
  }
  if (lower.includes('accuracy') || lower.includes('correct') || lower.includes('error') || lower.includes('contradict')) {
    return 'rules_accuracy';
  }
  if (lower.includes('persona') || lower.includes('audience') || lower.includes('beginner') || lower.includes('veteran')) {
    return 'persona_fit';
  }
  if (lower.includes('usab') || lower.includes('practic') || lower.includes('example') || lower.includes('reference')) {
    return 'practical_usability';
  }

  return 'overall_score';
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .split(/[_-\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format persona ID for display
 */
function formatPersonaName(personaId: string): string {
  return personaId
    .replace(/[_-]/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate a human-readable cluster name from chapter names
 */
function generateClusterName(chapters: string[]): string {
  if (chapters.length === 0) return 'General Improvements';
  if (chapters.length === 1) return extractChapterTopic(chapters[0]);

  // Try to find common theme
  const topics = chapters.map(extractChapterTopic);

  // If all topics are similar, use that
  const uniqueTopics = Array.from(new Set(topics));
  if (uniqueTopics.length === 1) {
    return uniqueTopics[0];
  }

  // Otherwise, combine first two
  if (topics.length <= 2) {
    return topics.join(' & ');
  }

  return `${topics[0]} & Related`;
}

/**
 * Extract a topic name from a chapter filename
 */
function extractChapterTopic(filename: string): string {
  // Remove common prefixes like "08-" and extensions like ".md"
  const cleaned = filename
    .replace(/^\d+[-_]?/, '')
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ');

  return formatCategoryName(cleaned);
}

/**
 * Calculate delta target based on severity
 * Higher severity = higher expected delta (more room for improvement)
 */
function calculateDeltaTarget(severity: number): number {
  if (severity >= 8) return 1.5;
  if (severity >= 6) return 1.0;
  if (severity >= 4) return 0.7;
  return 0.5;
}
