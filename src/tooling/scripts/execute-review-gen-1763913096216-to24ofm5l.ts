/**
 * Execute reviewer prompt for persona gen-1763913096216-to24ofm5l
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 124214
 * - Archetype: Killer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Comfortable with Abstraction
 * - GM Philosophy: GMless Advocate
 * - Genre Flexibility: Enjoys Flexibility
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096216-to24ofm5l';
const personaName = 'Generated Persona 124214';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 9
  },
  narrative_feedback: `As a Killer archetype with hybrid GM/Player experience, I approach this rulebook from the perspective of someone who values efficient mechanics and clear power expression. I'm pattern-driven and skeptical of fiction-first rhetoric that masks mechanical complexity, but I appreciate systems that deliver meaningful tactical choices and table efficiency.

The Razorweave rulebook impresses me immediately with its clarity. This is not a book that hides behind flowery language or narrative framing. Chapters 1-5 establish the philosophical foundation without excessive verbiage, and the progression flows logically from principles to mechanics. The focus on player intent and scene-based play aligns well with how I prefer to structure sessions—fast pacing, clear decision points, minimal mechanical overhead.

The 4d6 resolution system is elegant and efficient. The margin-based outcome framework (Success, Mix, Miss) maps cleanly to tactical consequences, which is exactly what a pattern-driven player needs. The DC tables in Chapter 8 are well-structured, and the worked examples showing how intent and approach affect checks demonstrate the system's flexibility without requiring rulebook reference mid-session.

What works brilliantly for my playstyle is the Combat chapter (Chapter 10). The action economy is clean: Strike, Maneuver, Set Up, Defend/Withdraw. The interaction between positioning Tags and tactical positioning creates a light abstraction layer that avoids grid-based overhead while maintaining tactical meaning. The Resolve system instead of hit points is refreshing—it keeps mechanical resolution focused on narrative outcomes rather than HP chipping.

The Tags, Conditions, and Clocks system (Chapter 9) is where I see the book's true strength. These are pattern-based tools that organize narrative state without requiring constant reference. The quick references are exactly what a hybrid player needs at the table. The condition system is particularly clever—applied to characters, affected by actions, cleared through narrative events. This scales beautifully from duet play to group campaigns.

The worked examples throughout are exceptional. Chapter 6's character creation examples (Kira Valdros, Delian Osk) are detailed enough to serve as templates without being prescriptive. Chapter 8's DC setting examples and combat scenarios are genuinely useful. I can pick up these examples and run them immediately, or use them as patterns for my own content.

However, I have concerns about the system's claimed flexibility. The book emphasizes support for GMless, solo, and asynchronous play, but the mechanics are fundamentally designed around GM facilitation. The Clocks, faction standing systems, and advancement rules assume a GM making narrative calls. This isn't a flaw—it's excellent design for traditional play—but the aspirational language about alternative modes feels hollow. Either commit to GMless support with dedicated mechanics, or acknowledge that the system optimizes for traditional play with optional tweaks.

The Skills and Proficiencies system is functional but feels somewhat disconnected from the core mechanics. The system works without referencing them constantly, which is good. But in Chapter 14-17, they feel like optional flavor rather than integrated parts of the core resolution engine. They should either matter more mechanically or be presented more explicitly as narrative tools.

Overall, this rulebook is exceptionally well-crafted for tables like mine—groups that want clear mechanics, meaningful tactical choice, and efficient session flow. The pattern-based approach to mechanics (Tags, Conditions, Clocks) gives me tools I can internalize and use without constant reference. The worked examples establish clear patterns. The combat and check systems deliver mechanical clarity without sacrificing narrative weight. This is a book I would run immediately, with confidence that I understand the system after a single read-through.

My skepticism about fiction-first philosophy is unchanged—I think the book does excellent work serving tactical, pattern-driven play, and I'd prefer if it acknowledged that more directly. But that's a quibble with framing, not with the mechanics themselves.`,
  issue_annotations: [
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Claims about GMless and solo play support are not mechanically substantiated",
      impact: "Groups attempting these modes will improvise significant house rules; creates false expectations about system flexibility",
      location: "GMless Cooperative Play and Solo Play subsections"
    },
    {
      section: "Chapter 14-17 - Skills and Proficiencies System",
      issue: "Skills and Proficiencies feel mechanically optional despite extensive reference material",
      impact: "Players investing in skill selection may feel these choices lack mechanical weight; reduces motivation for skill differentiation",
      location: "Throughout Skills and Proficiencies chapters; could be remedied with examples showing mechanical consequence"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The Condition section could benefit from more explicit guidance on when GMs introduce conditions vs. when players request them",
      impact: "May lead to table confusion about condition application authority and narrative triggering",
      location: "Introducing and Clearing Conditions section"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Edge and Burden mechanics interaction with Tags/Conditions could use a comprehensive worked example",
      impact: "Pattern-driven players may struggle to intuitively apply Edge/Burden in complex situations; requires mental stacking of modifiers",
      location: "Edge, Burden, Tags, and Conditions section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an exemplary design for tactical, pattern-driven play. As a Killer archetype with hybrid experience, I appreciate the mechanical clarity, the elegant action economy, and the pattern-based approach to managing narrative state through Tags, Conditions, and Clocks. The worked examples are exceptionally useful, and the system delivers efficient session flow without sacrificing narrative weight.

The book's greatest strength is its honesty about mechanics—they're not hidden behind fiction; they're integrated with fiction through clear procedures. The four-outcome framework (Success, Mix, Miss, and the tactical options at each level) maps beautifully to how I want to structure moments of tension at the table.

My reservation is about the aspirational language around system flexibility. This is a traditional GM-facilitated system, and it excels at that role. The claims about GMless and solo support are not mechanically justified. I'd run this system as written immediately for group play with a GM, and I'd do so with confidence that I understand it after one thorough read. For groups seeking light tactical mechanics with strong narrative integration, this is an excellent choice. For groups seeking truly flexible system that handles multiple play modes equally well, manage expectations—you'll need house rules.

This is a solid B+ rulebook for my playstyle, with potential to reach A+ with minor clarifications on Skills/Proficiencies mechanical weight and more honest framing of play mode support.`
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
- **Playstyle:** Skeptical, Pattern-Driven, GMless Advocate

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
