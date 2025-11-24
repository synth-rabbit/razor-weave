/**
 * Execute reviewer prompt for persona gen-1763913096212-rbhtrfavf
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 957785
 * - Archetype: Killer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Neutral
 * - GM Philosophy: GMless Advocate
 * - Genre Flexibility: Genre-Agnostic Enthusiast
 * - Cognitive Style: Cautious
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096212-rbhtrfavf';
const personaName = 'Generated Persona 957785';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As a Killer who embraces both GM and player perspectives, I approach this rulebook with pragmatic intensity. I'm skeptical of flowery fiction-first claims, but I care deeply about whether mechanics actually deliver fun competition and meaningful challenges. Razorweave passes that test more often than not.

Let me be direct: this rulebook respects my time. The progression from philosophy (Chapters 1-5) through mechanics (Chapters 6-11) to execution (Chapters 21-26) is clean. You're not wasting pages on fluff. That alone earns my respect.

The modified chapters—particularly 6 (Character Creation), 8 (Actions, Checks, and Outcomes), 9 (Tags, Conditions, and Clocks), and 10 (Combat Basics)—show real craft. The worked examples in Chapter 6 aren't hand-holding; they're modeling decision-making. The DC table structure in Chapter 8 is immediately usable at the table. The Quick References scattered throughout give you what you need without forcing you to hunt through narrative text.

What works for me as a Killer: The system acknowledges challenge as a core pleasure. Chapter 8's "Setting DCs" section doesn't shy away from the fact that difficulty matters. The Tags and Conditions mechanics in Chapter 9 create meaningful constraints without becoming bookkeeping hell—that's harder to balance than it looks. The combat chapter properly treats Resolve instead of hit points as a mechanical choice with tactical implications, not just flavor.

The GMless Cooperative Play section intrigues me. I'm skeptical about whether it truly works without a GM, but I appreciate the system's acknowledgment that different groups want different things. The fact that you built mechanics that can flex to accommodate multiple play modes suggests you've thought about the underlying architecture, not just bolted features onto a traditional GM-centric design.

Where my caution shows: Chapter 5 (Ways to Play) feels aspirational on solo play. I could run it, but I suspect I'd be improvising significant amounts. The interaction between Clocks and multiple conditions in social scenes (Chapter 11) could get tangled if a table isn't disciplined about tracking. The "fiction first" rhetoric sometimes conflicts with the actual mechanical density—you're asking players to manage Tags, Conditions, Clocks, Edge/Burden, and skill selections all simultaneously.

The Character Creation chapter is solid but dense. The nine-step process will slow down some groups, though the worked examples (Kira Valdros and Delian Osk) are genuinely helpful for understanding how to make choices. These aren't just character sheets; they're decision walkthroughs showing how concept connects to mechanics. That's good design.

What impresses me most: The book doesn't try to hide its mechanical complexity. It presents the system honestly. You get the sense that someone has actually run these rules at a table and made decisions based on what works, not what sounds poetic. The footnotes and asides addressing practical concerns show a GM who understands that players will break your system in ways you don't anticipate.

My verdict: This is a rulebook for tables that want meaningful decisions with real consequences. It will appeal to groups that enjoy some mechanical depth and competitive play, but who also want that mechanics to serve story. Killers like me will run this system because it respects our intelligence and our love of optimization without sacrificing narrative flexibility. Just don't expect it to do the work for you—you still need GMs who understand pacing and players who engage with the fiction.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "DC setting guidance relies heavily on GM judgment; table-to-table variance in difficulty could be significant",
      impact: "A challenge rated 'Dangerous' at one table might feel trivial at another; requires consistent GM philosophy for balanced play",
      location: "Setting DCs section, particularly the guidance on mapping fictional stakes to numeric values"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "The distinction between Scene Tags (environmental) and Character Tags (applied conditionally) requires clear table agreement",
      impact: "Confusion about tag application during fast play could slow combat and social scenes; needs explicit session zero coverage",
      location: "How Tags Affect Checks and Condition Quick Reference sections"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The interaction between Positioning Tags, environmental effects, and Conditions creates compounding complexity in multi-combatant fights",
      impact: "GMs may struggle to manage combat pacing when tracking multiple antagonists with different tag combinations; could bog down tactical play",
      location: "Positioning and Environment section combined with Conditions in Combat"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step process is thorough but may overwhelm new players if done in a single session",
      impact: "Character creation could consume a full session before anyone rolls dice; may reduce enthusiasm for first session play",
      location: "The Nine-Step Creation Checklist from Steps 1-9"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Solo Play mechanics are mentioned but lack concrete system support compared to group play",
      impact: "A solo player would need to adapt many core procedures; feels like an afterthought rather than fully realized play mode",
      location: "Solo Play subsection"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is designed for tables that want serious play without sacrificing narrative. As a Killer, I appreciate the mechanical rigor. The system doesn't promise to do the storytelling work for you—it promises tools that support competition, challenge, and meaningful choices. The modified chapters show clear improvement: worked examples that actually teach decision-making, DC tables that are immediately useful, quick references that save you from hunting through prose.

The book succeeds because it's honest about what it is. You get a moderately complex system that rewards player skill and tactical thinking, built on a fiction-first foundation that actually works in practice (mostly). For hybrid GM/Players like me who want both story and stakes, this hits the target. I'd run this system for a campaign and expect it to deliver challenging, narrative-driven play. The caveat: it requires engaged tables. If your group wants mechanics to disappear, this isn't it. If your group wants to feel the weight of their choices, this delivers. Killer tables will thrive here. Narrative-first tables may find the complexity intrusive, and story-focused players might feel the mechanics demanding real estate that could go to description. But for balanced play that respects both mechanical mastery and fictional immersion? Recommended.`
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
- **Experience:** Hybrid GM/Player
- **Playstyle:** Skeptical, Cautious, GMless Advocate

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
