/**
 * Execute reviewer prompt for persona gen-1763913096245-qjdnidk3m
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Explorer/Long-term GM
 * - Archetype: Explorer
 * - Experience: Long-term GM
 * - Fiction-First: Curious, Wary of Abstraction
 * - GM Philosophy: GMless Advocate
 * - Cognitive Style: Pattern-Driven
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096245-qjdnidk3m';
const personaName = 'Explorer/Long-term GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who has GMed for many years and who deeply values exploration - both of game worlds and of game systems themselves - I found myself genuinely excited by Razorweave's approach. The Chapter 26 "Alternative Play" section speaks directly to my GMless heart. The rotating facilitator model, the shared authority principles, and the explicit procedures for distributing narrative control show that the designers understand what GMless play actually needs to function.

What I appreciate most as an Explorer is how the system reveals its patterns gradually. The 4d6 + Attribute vs DC creates a probability landscape I can intuit after a few sessions. The DC ladder from 12 to 22 gives me anchor points. The margin-based outcome tiers (Critical Success, Full Success, Partial Success, Failure, Critical Failure) create a pattern I can predict and plan around. This is exactly the kind of structured emergence I crave.

However - and here my wariness of abstraction kicks in - some sections feel overly conceptual without enough concrete procedural guidance. The Tags and Conditions system is beautiful in theory, but I wanted more explicit patterns for WHEN to apply them and HOW they interact. The Clocks mechanism is likewise elegant, but the rules for advancing Clocks in GMless play could use more specificity. When exactly does a Clock tick in shared authority? Who decides?

The fiction-first philosophy resonates with me as someone who's curious about how systems shape play, but the book occasionally slips into abstraction when I'd prefer concrete procedures. For example, the "Intent and Approach" framework is mentioned repeatedly, but the connection between stated intent and mechanical outcome could be spelled out more systematically.

From my pattern-driven perspective, I notice the book establishes clear frameworks early (Chapters 1-5) that pay off in later chapters. The structure is navigable, the glossary is comprehensive, and the cross-references work well. I can see the design patterns emerging: Tags modify fiction, Conditions track character state, Clocks drive dramatic tension. These patterns make the system learnable.

The GMless procedures in Chapter 26 are the highlight for me. The rotating facilitator guidance, the oracle suggestions for solo play, and the explicit note about tracking Clocks in shared authority games all address real problems I've encountered. The VPC (Virtual Player Character) system for solo play is particularly clever - it lets solo players explore with companions while maintaining narrative coherence.

One pattern I notice is that the GM-facing chapters (21-25) are more procedurally dense than the GMless chapter. Chapter 26 could benefit from the same level of detail that Chapter 21 "Running Sessions" provides. If this system truly wants to support shared authority play equally, the GMless procedures deserve equal weight.

Overall, this is a system I would run GMless tomorrow. The core mechanics are elegant, the philosophy is sound, and enough patterns are established that a group can fill in the gaps collaboratively. I just wish those gaps were smaller.`,
  issue_annotations: [
    {
      section: "Chapter 26 - Alternative Play",
      issue: "GMless procedures are less detailed than GM-facing chapters",
      impact: "Groups attempting shared authority play may need to improvise procedures that should be explicit, potentially leading to table conflicts or stalled sessions",
      location: "GMless Procedures and Rotating Facilitator subsections"
    },
    {
      section: "Chapter 9 and 18 - Tags, Conditions, and Clocks",
      issue: "Timing and application patterns for Tags and Conditions are not always explicit",
      impact: "Pattern-seeking players may struggle to predict when Tags apply or how Conditions interact, reducing the system's learnability",
      location: "Tag and Condition application guidance throughout"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The Intent and Approach framework lacks systematic procedural steps",
      impact: "Players curious about the system may find it hard to trace the exact path from stated intent to mechanical resolution, making the framework feel abstract rather than actionable",
      location: "Intent and Approach in the Text, Resolution Procedure"
    },
    {
      section: "Chapter 26 - Solo Play with VPC Companions",
      issue: "Oracle guidance is suggestive rather than systematic",
      impact: "Explorers who want to try solo play may need to import oracle systems from other games or design their own, which creates a barrier to entry",
      location: "Using Oracles and Prompts subsection"
    },
    {
      section: "Chapter 25 - Factions, Fronts, and World Pressure",
      issue: "Clock advancement triggers in GMless contexts are unclear",
      impact: "In shared authority play, groups may disagree about when and how Clocks advance, potentially breaking the tension-tracking mechanism that makes Clocks valuable",
      location: "Fronts and Clocks interactions"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a thoughtfully designed system that rewards exploration. The core 4d6 + Attribute mechanics are elegant and predictable once you learn the patterns. The DC ladder, outcome tiers, and margin-based resolution create a probability space that experienced players can intuit.

For GMless advocates like myself, Chapter 26 is essential and mostly delivers. The rotating facilitator model, shared authority principles, and VPC companion system for solo play show genuine investment in alternative play styles. However, the GMless procedures could use the same depth of coverage that the GM-facing chapters receive. If Razorweave truly wants to be the system that supports all play modes equally, the Alternative Play chapter should be one of the longest in the book, not one of the shorter ones.

The fiction-first philosophy is stated clearly and reinforced throughout, though my wariness of abstraction means I'd prefer more explicit procedures in some areas. The Tags, Conditions, and Clocks system has beautiful emergent properties, but the rules for when and how to apply them could be more systematic.

As a pattern-driven reader, I appreciate that the book's structure rewards careful study. The early chapters establish frameworks that pay off later. The glossary and index are comprehensive. Cross-references are helpful. The design patterns (Tags modify fiction, Conditions track state, Clocks drive tension) become visible with attention.

Rating: 8/10 - An excellent system for exploration-minded groups, especially those interested in GMless or shared authority play. The core mechanics are solid, the philosophy is sound, and the gaps are fillable by experienced groups. More procedural depth in GMless play would make this a definitive recommendation.`
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

- **Archetype:** Explorer
- **Experience:** Long-term GM
- **Fiction-First Stance:** Curious, Wary of Abstraction
- **GM Philosophy:** GMless Advocate
- **Cognitive Style:** Pattern-Driven

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
