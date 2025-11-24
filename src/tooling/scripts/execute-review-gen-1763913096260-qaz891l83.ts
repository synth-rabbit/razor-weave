/**
 * Execute reviewer prompt for persona gen-1763913096260-qaz891l83
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 377055
 * - Archetype: Killer
 * - Experience: Long-term GM
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: GMless Advocate
 * - Genre Flexibility: Enjoys Flexibility
 * - Cognitive Style: Concrete Thinker
 */
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const startTime = Date.now();

// Open database directly
const dbPath = join(process.cwd(), 'data', 'project.db');
const db = new Database(dbPath);

// Campaign and persona identifiers
const campaignId = 'campaign-20251123-192801-j6p4e486';
const personaId = 'gen-1763913096260-qaz891l83';
const personaName = 'Generated Persona 377055';

// Review data based on thorough analysis from the persona's perspective
// Key traits informing this review:
// - Killer archetype: focused on competition, challenge, and winning
// - Long-term GM: deep understanding of running games from both sides
// - Converting to fiction-first: adapting to the narrative style
// - Narrative Purist: prefers story over crunch
// - GMless Advocate: supports shared narrative authority
// - Enjoys Flexibility: likes adaptable, genre-agnostic systems
// - Concrete Thinker: needs tangible examples and clear handles

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As someone who has been running games for years and gravitating toward GMless play, I approached this rulebook with a specific lens. The fiction-first philosophy immediately resonated with my evolving style, though I found myself wanting more concrete structure for competitive moments.

The book does an excellent job laying out its core philosophy. The "Table Is a Creative Team" principle aligns perfectly with my advocacy for shared narrative authority. The clear breakdown of intent and approach in Chapter 8 provides the kind of tangible framework I need to internalize new concepts.

However, as a Killer archetype, I noticed the combat system feels deliberately de-emphasized. The Resolve Clock system replacing hit points is elegant for narrative flow, but I wanted clearer benchmarks for challenge. When I run competitive encounters, I need concrete difficulty guidelines - how many segments should a "dangerous" opponent have? The book says 6 for a "dangerous VPC" in one example but lacks systematic threat scaling.

The GMless play section (Chapter 5) mentions the mode but defers details to later chapters. For someone actively running GMless games, I wanted more immediate guidance on rotating narrative authority, not just an acknowledgment that it exists.

What works brilliantly: the Tags and Conditions system. As a concrete thinker, seeing labels like "Exhausted," "Dim Light," and "Exposed" gives me the tangible handles I need. The example boxes throughout are genuinely helpful - the warehouse fight example in Chapter 9 shows exactly how Tags shape tactical play.

The flexibility across genres appeals to me. I run campaigns in multiple settings, and the system's agnostic approach means I can port these rules without major surgery. The custom Skills and Proficiencies guidance in Chapter 14 particularly impressed me.

Overall, this is a well-crafted system that will serve narrative-focused tables admirably. For my specific blend of competitive instincts and GMless advocacy, some edges feel soft, but the foundation is solid.`,
  issue_annotations: [
    {
      section: "Chapter 5: Ways to Play the Game",
      issue: "GMless cooperative play section lacks implementation details",
      impact: "GMs and players interested in shared authority must wait until Chapter 26 for substantive guidance, creating friction for early adopters of this mode",
      location: "Section 'GMless Cooperative Play' - approximately 3 paragraphs that defer to later content"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Resolve Clock scaling guidelines are example-driven rather than systematic",
      impact: "GMs must infer appropriate threat levels from scattered examples rather than consulting a clear reference table, slowing prep for competitive encounters",
      location: "Section 'Resolve Instead of Hit Points' - single example mentions '6-segment' but no scaling ladder provided"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "DC ladder lacks genre-specific calibration examples",
      impact: "While DC 12-22 is provided, concrete examples only appear for generic situations. Cozy, horror, and sci-fi campaigns would benefit from calibrated examples showing what 'Heroic' means in each context",
      location: "Section 'Setting DCs' - DC ladder presented without genre-differentiated guidance"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Attribute spread options limited to single default array",
      impact: "Players seeking more competitive or specialized builds have no alternative spreads to choose from, reducing character differentiation at creation",
      location: "Step Three: Assign Attributes - only 2/1/1/0 spread offered"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook presents a thoughtful, well-organized fiction-first system that successfully bridges narrative play and mechanical structure. For my profile - a long-term GM transitioning toward GMless and narrative-pure approaches while retaining competitive sensibilities - the book delivers approximately 70% of what I need.

Strengths: Excellent tag and condition vocabulary, flexible genre support, strong examples throughout, and a coherent philosophy from page one. The book knows what it wants to be and executes that vision consistently.

Gaps: Competitive challenge calibration, GMless implementation details in early chapters, and alternative character creation options for players who want more differentiation.

Recommendation: Suitable for tables prioritizing collaborative storytelling with light tactical elements. GMs with Killer tendencies should be prepared to develop supplementary threat-scaling guidelines. GMless advocates will find philosophical support but may need to house-rule procedural details until reaching the later chapters.`
};

// Calculate execution time
const agentExecutionTime = Date.now() - startTime;

// Write review to database
try {
  const insertStmt = db.prepare(`
    INSERT INTO persona_reviews (
      campaign_id, persona_id, review_data,
      agent_execution_time, status
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    campaignId,
    personaId,
    JSON.stringify(reviewData),
    agentExecutionTime,
    'completed'
  );

  console.log(`Review saved to database with ID: ${result.lastInsertRowid}`);
} catch (error) {
  console.error('Error saving review to database:', error);
}

// Generate markdown content
const markdown = `# Review: ${personaName} - Book Review

Campaign: ${campaignId} | Date: ${new Date().toISOString()}

## Persona Profile

- **Archetype:** Killer
- **Experience:** Long-term GM
- **Playstyle:** Converting, Concrete Thinker

## Structured Ratings

- **Clarity & Readability:** ${reviewData.ratings.clarity_readability}/10
- **Rules Accuracy:** ${reviewData.ratings.rules_accuracy}/10
- **Persona Fit:** ${reviewData.ratings.persona_fit}/10
- **Practical Usability:** ${reviewData.ratings.practical_usability}/10

## Narrative Feedback

${reviewData.narrative_feedback}

## Issue Annotations

${reviewData.issue_annotations
  .map(
    (annotation, idx) => `### ${idx + 1}. ${annotation.section}

**Issue:** ${annotation.issue}

**Impact:** ${annotation.impact}

**Location:** ${annotation.location}
`
  )
  .join('\n')}

## Overall Assessment

${reviewData.overall_assessment}
`;

// Write markdown file
const outputPath = join(process.cwd(), 'data/reviews/raw', campaignId, `${personaId}.md`);
try {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Markdown review written to: ${outputPath}`);
} catch (error) {
  console.error('Error writing markdown file:', error);
}

// Output summary
console.log('\n=== REVIEW SUMMARY ===');
console.log(`Persona: ${personaName} (${personaId})`);
console.log(`Campaign: ${campaignId}`);
console.log(`\nRatings:`);
console.log(`  - Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  - Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  - Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  - Practical Usability: ${reviewData.ratings.practical_usability}/10`);
console.log(`\nIssues Identified: ${reviewData.issue_annotations.length}`);
console.log(`Execution Time: ${agentExecutionTime}ms`);

db.close();
