/**
 * Execute reviewer prompt for persona gen-1763913096247-be4zelw61
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Archetype: Tactician
 * - Experience: Forever GM
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Prepared Sandbox
 * - Cognitive Style: Visual
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
const personaId = 'gen-1763913096247-be4zelw61';
const personaName = 'Tactician Forever GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As a Forever GM with decades at the table, I approach Razorweave from the perspective of someone who needs systems that work reliably session after session. My prepared sandbox style means I build out faction maps, location details, and potential conflict nodes ahead of time - then let players explore freely within that structure. I also think visually and need concrete numbers to hang my prep on.

The 4d6 resolution system with its DC ladder (12-14-16-18-20-22) is exactly what I need. The Routine/Challenging/Difficult/Formidable/Heroic/Legendary progression gives me clear benchmarks for setting challenges. When I'm prepping a scenario, I can quickly assign DCs without second-guessing myself. The outcome tier system (Critical Success at +5, Full Success at 0-4, Partial at -1 to -2, Failure at -3 to -6, Critical Failure at -7 or worse) creates predictable but varied results.

The Clock system deserves special praise. As a prepared sandbox GM, I can pre-seed faction Clocks, environmental pressure Clocks, and opportunity Clocks before a session, then let them tick based on player actions and time passing. The 4/6/8 segment templates give me visual tools to track campaign pressure. This is exactly how I want to manage world state.

However, I'm in the process of converting from more traditional tactical systems to fiction-first play. Some areas of this rulebook feel underdeveloped for someone who needs concrete numbers. Combat positioning uses range bands (Close/Near/Far/Distant) but doesn't give me exact measurements or movement rates. For a visual thinker who likes to sketch maps, this abstraction creates uncertainty. How many zones can a character traverse in one action? The rules are intentionally vague here.

The Skills and Proficiencies system is well-organized. I appreciate that Skills are grouped by Attribute (MIG, AGI, PRE, RSN) and that detailed entries include default DCs, synergies, and counters. The example blocks are excellent - showing exactly how Tags, Conditions, and Skills interact in actual play. This is the kind of concrete guidance I need.

The GM section (Chapters 21-26) provides substantial support for running campaigns. The faction standing ladder, Front mechanics, and NPC/VPC design tools all feed into my prep workflow. I can build out major factions with relationship maps, assign them Clocks representing their goals, and let player actions advance or hinder those agendas.

Where I struggle is the fiction-first philosophy itself. The book repeatedly says to let the story guide when mechanics engage, but as someone converting from more structured systems, I want clearer triggers. When exactly should I call for a Check? The book says "when the outcome is uncertain and meaningful" but that's subjective. I would prefer a decision tree or flowchart.

The character sheets and play aids in Chapter 27 are essential reference material. Having DC tiers, condition summaries, and clock templates in one place will save time at the table. I plan to print these as GM screen inserts.

Overall, Razorweave gives me the numerical framework I need while pushing me toward more narrative play. The tension between my tactical instincts and the fiction-first philosophy is productive - it's helping me evolve as a GM. But the book could do more to bridge that gap with concrete examples of the decision-making process.`,
  issue_annotations: [
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Range bands (Close/Near/Far/Distant) lack concrete distance measurements or movement action costs",
      impact: "Visual/tactical GMs cannot accurately map combat encounters or determine how many turns movement takes",
      location: "Range Bands quick reference table and combat movement rules"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "No decision flowchart or explicit trigger conditions for when to call for Checks",
      impact: "GMs converting from traditional systems lack clear procedural guidance on Check invocation",
      location: "When to Make Checks, Fiction First Structure sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock advancement rates are inconsistent - some examples tick on any relevant action, others on specific outcomes",
      impact: "Prepared sandbox GMs cannot reliably predict Clock pacing during prep",
      location: "Pressure Clocks, Progress Clocks, Clock Templates sections"
    },
    {
      section: "Chapter 15 - Skills Reference",
      issue: "Some Skills have detailed DC ranges while others give only general guidance (DC 12-14 vs 'as appropriate')",
      impact: "Inconsistent granularity makes it harder to prep encounters with reliable difficulty benchmarks",
      location: "Various Skill entries across MIG, AGI, PRE, RSN categories"
    },
    {
      section: "Chapter 24 - NPCs, VPCs, Enemies",
      issue: "VPC construction rules mention 'advanced mechanics' but don't provide stat block templates or power budgets",
      impact: "Forever GMs who prep boss encounters lack concrete building blocks for balanced VPC design",
      location: "VPC definition and design guidance sections"
    }
  ],
  overall_assessment: `Razorweave is a strong system for GMs who want structured prep tools within a fiction-first framework. The DC ladder, outcome tiers, and Clock mechanics provide the concrete numbers that tactically-minded GMs need, while the extensive Skill and Proficiency references offer reliable benchmarks for difficulty setting. The faction and Front systems support prepared sandbox play exceptionally well.

For Forever GMs converting from traditional tactical systems, the rulebook succeeds as a bridge but leaves some gaps. Combat positioning abstraction and the subjective nature of Check triggers will require house-ruling or practice to master. The visual aids and reference sheets are excellent and will see heavy use at my table.

I recommend Razorweave for experienced GMs who want to evolve toward more narrative play while maintaining the prep structure they rely on. Tables that need precise tactical grids or players who expect D&D-style action economy will need to adjust expectations. Overall rating: a well-designed system that respects both story and structure, with room for concrete guidance improvements.`
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

- **Archetype:** Tactician
- **Experience:** Forever GM
- **Fiction-First Stance:** Converting
- **Needs:** Concrete Numbers
- **GM Philosophy:** Prepared Sandbox
- **Cognitive Style:** Visual

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
