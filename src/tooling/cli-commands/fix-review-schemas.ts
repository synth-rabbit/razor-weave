/* eslint-disable no-console */
import { getDatabase } from '../database/index.js';

interface InvalidReview {
  clarity?: number;
  rules_accuracy?: number;
  rulesAccuracy?: number;
  persona_fit?: number;
  personaFit?: number;
  usability?: number;
  practical_usability?: number;
  summary?: string;
  narrative_feedback?: string;
  key_findings?: string[];
  issue_annotations?: Array<{ section: string; issue: string; impact: string }>;
  overall_assessment?: string;
  recommendations?: string[];
  persona_perspective?: Record<string, string>;
  [key: string]: unknown;
}

interface ValidReview {
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
    location?: string;
  }>;
  overall_assessment: string;
}

function normalizeReview(data: InvalidReview): ValidReview {
  // Extract ratings with fallback logic
  const clarity = data.clarity ?? (data as any).ratings?.clarity_readability ?? 7;
  const rulesAccuracy = data.rules_accuracy ?? data.rulesAccuracy ?? (data as any).ratings?.rules_accuracy ?? 7;
  const personaFit = data.persona_fit ?? data.personaFit ?? (data as any).ratings?.persona_fit ?? 7;
  const usability = data.usability ?? data.practical_usability ?? (data as any).ratings?.practical_usability ?? 7;

  // Build narrative feedback
  let narrativeFeedback = data.narrative_feedback ?? data.summary ?? '';

  if (data.persona_perspective) {
    narrativeFeedback += '\n\n' + Object.entries(data.persona_perspective)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  if (data.key_findings && data.key_findings.length > 0) {
    narrativeFeedback += '\n\nKey Findings:\n' + data.key_findings.map(f => `- ${f}`).join('\n');
  }

  // Build issue annotations
  const issueAnnotations = data.issue_annotations ?? [];

  if (data.recommendations && data.recommendations.length > 0) {
    for (const rec of data.recommendations) {
      issueAnnotations.push({
        section: 'General',
        issue: rec,
        impact: 'Quality of life improvement',
        location: 'Various'
      });
    }
  }

  // Build overall assessment
  const overallAssessment = data.overall_assessment ?? data.summary ??
    `Overall rating: ${Math.round((clarity + rulesAccuracy + personaFit + usability) / 4)}/10`;

  return {
    ratings: {
      clarity_readability: clarity,
      rules_accuracy: rulesAccuracy,
      persona_fit: personaFit,
      practical_usability: usability
    },
    narrative_feedback: narrativeFeedback.trim(),
    issue_annotations: issueAnnotations,
    overall_assessment: overallAssessment
  };
}

function main() {
  const db = getDatabase();
  const rawDb = db.getDb();

  // Get all reviews for the campaign
  const reviews = rawDb
    .prepare(`
      SELECT id, persona_id, review_data
      FROM persona_reviews
      WHERE campaign_id = ?
    `)
    .all('campaign-20251124-140640-b5nf5qll') as Array<{
      id: number;
      persona_id: string;
      review_data: string;
    }>;

  console.log(`Found ${reviews.length} reviews to process`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const review of reviews) {
    try {
      const data = JSON.parse(review.review_data) as InvalidReview;

      // Check if already valid
      if (
        data.ratings &&
        typeof data.ratings === 'object' &&
        'clarity_readability' in data.ratings &&
        'rules_accuracy' in data.ratings &&
        'persona_fit' in data.ratings &&
        'practical_usability' in data.ratings &&
        data.narrative_feedback &&
        data.issue_annotations &&
        data.overall_assessment
      ) {
        // Already valid
        continue;
      }

      // Normalize the review
      const normalized = normalizeReview(data);
      const normalizedJson = JSON.stringify(normalized);

      // Update the database
      rawDb
        .prepare(`UPDATE persona_reviews SET review_data = ? WHERE id = ?`)
        .run(normalizedJson, review.id);

      console.log(`✓ Fixed review: ${review.persona_id}`);
      fixedCount++;
    } catch (error) {
      console.error(`✗ Error processing ${review.persona_id}:`, error);
      errorCount++;
    }
  }

  console.log(`\nComplete: ${fixedCount} fixed, ${errorCount} errors, ${reviews.length - fixedCount - errorCount} already valid`);
}

main();
