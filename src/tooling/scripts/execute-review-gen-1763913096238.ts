/**
 * Execute reviewer prompt for persona gen-1763913096238-o4c52vk1e
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 185611
 * - Archetype: Explorer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Curious
 * - Narrative/Mechanics: Wary of Abstraction
 * - GM Philosophy: GMless Advocate
 * - Genre Flexibility: Genre-Agnostic Enthusiast
 * - Cognitive Style: Simplicity Seeker
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
const personaId = 'gen-1763913096238-o4c52vk1e';
const personaName = 'Generated Persona 185611';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 5
  },
  narrative_feedback: `As someone who's played both sides of the GM screen and loves exploring new game worlds, I found the Razorweave Core Rulebook to be a compelling read with some significant friction points.

The fiction-first philosophy intrigues me - I'm genuinely curious about how "story first, mechanics second" works at the table. The book explains this approach clearly in Chapters 1-5, and I appreciate how every example shows intent and approach before reaching for dice. That's helpful for someone like me who's still wrapping my head around this style.

What really caught my attention was Chapter 5: Ways to Play. As someone who advocates for GMless cooperative play, I was excited to see it listed as a supported mode. However, the actual guidance is disappointingly thin - just a few paragraphs saying "the group shares narrative responsibility" and "the table uses procedures that rotate authority." Where are these procedures? I came here looking for concrete mechanics to run GMless sessions, and the book waves its hand toward concepts without providing the actual tools.

The 4d6 core mechanic with the outcome tiers (Critical Success through Critical Failure based on margin) is elegant and consistent. I like that - as a Simplicity Seeker, I want one resolution system that works everywhere, and this delivers. The Advantage/Disadvantage system capping at plus or minus 2 makes sense too.

But here's where my wariness of abstraction kicks in: the Tags and Conditions system feels underspecified. The book keeps saying "Tags typically grant Advantage or Disadvantage" but then hedges with "or raise/lower DCs" or "change position or effect." Which is it? I need clear rules I can apply at the table, not guidelines that require GM interpretation every time.

The genre-agnostic approach is fantastic for exploration. The examples span cozy towns, sci-fi stations, horror graveyards - this clearly works across settings. That flexibility appeals to my love of trying new things.

Character creation walks through each step methodically, which I appreciate. Rella the telegraph engineer is a concrete example to follow. But the "open lists" philosophy for Skills and Proficiencies worries me. "Work with your GM to define custom entries" means the system provides less structure than I'd prefer.`,
  issue_annotations: [
    {
      section: "Chapter 5: Ways to Play",
      issue: "GMless play mode is mentioned but lacks procedural support",
      impact: "Players interested in GMless play cannot actually run this mode with just the Core Rulebook - they need to invent or import procedures",
      location: "GMless Cooperative Play subsection"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "Inconsistent guidance on how Tags mechanically affect Checks",
      impact: "Requires case-by-case GM judgment for every Tag interaction, slowing play and creating potential inconsistency",
      location: "What Tags Do and Using Tags and Conditions with Checks subsections"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Skills and Proficiencies use open lists requiring GM collaboration",
      impact: "New players lack concrete options to choose from; experienced players may create imbalanced custom entries",
      location: "Before You Choose Skills and Proficiencies subsection"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Margin calculation produces narrow band for Partial Success (-1 to -2)",
      impact: "Most rolls will either succeed cleanly or fail outright; the interesting Partial Success tier may be underutilized",
      location: "Rolling 4d6 and Calculating Margin subsection"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook presents a coherent fiction-first RPG system with genuine strengths: consistent 4d6 resolution, clear outcome tiers, excellent genre flexibility, and a welcoming tone. However, my experience as a Hybrid GM/Player leaves me frustrated by the gap between the book's stated support for GMless play and the actual tools provided. My Simplicity Seeker cognitive style clashes with the system's preference for GM interpretation over explicit rules, particularly in how Tags affect Checks. For Explorers like me who want to discover new game worlds, the genre-agnostic design is excellent - but I wish the mechanics were more concrete and less dependent on table negotiation. This is a solid foundation that would benefit from supplementary material providing the procedural depth the core book promises but doesn't deliver.`
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
- **Experience:** Hybrid GM/Player
- **Playstyle:** Curious, Simplicity Seeker

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
