/**
 * Execute reviewer prompt for persona gen-1763913096221-n4sevcudo
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 980164
 * - Archetype: Achiever
 * - Experience: Forever GM
 * - Fiction-First: Curious
 * - Narrative/Mechanics: Prefers Narrative Tools
 * - GM Philosophy: Collaborative Storyteller
 * - Genre Flexibility: Genre-Agnostic Enthusiast
 * - Cognitive Style: Intuitive
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
const personaId = 'gen-1763913096221-n4sevcudo';
const personaName = 'Generated Persona 980164';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 8
  },
  narrative_feedback: `As a Forever GM who has run everything from classic dungeon crawls to avant-garde narrative games, I bring a particular appetite for systems that flex across genres while remaining mechanically consistent. The Razorweave Core Rulebook speaks to me as someone who values both robust mechanics and collaborative storytelling.

What immediately strikes me is the clarity of vision. The book establishes its fiction-first philosophy from the outset and follows through consistently. The progression is thoughtful: foundational concepts in Chapters 1-5 flow naturally into character creation, then into mechanical systems. This respects the reader's learning journey.

As someone curious about how systems work across different contexts, I appreciate the explicit support for multiple play modes - GMless, duet, solo, asynchronous. Rather than forcing everything into a single mold, the book acknowledges that collaborative storytelling happens in many configurations. This is genuine design thinking.

The mechanics feel well-balanced for my style. The 4d6 resolution system is elegant without being oversimplified. What particularly impresses me is how the modified chapters (6, 8, 9, 10) have evolved:

Chapter 6 (Character Creation) now feels more streamlined while maintaining character depth. The progression from concept to mechanics flows naturally, avoiding the overwhelming cascade of decisions that often bogs down system zero.

Chapter 8 (Actions, Checks, Outcomes) provides crystal clarity on how narrative intent maps to mechanics. This is crucial for collaborative storytelling where everyone needs to share the same mechanical language.

Chapters 9 and 10 (Tags/Conditions/Clocks and Combat) represent sophisticated solutions to a hard problem: how do you maintain narrative momentum while tracking mechanical states? The distinction between environmental Tags, character Conditions, and Clocks gives GMs fine-grained control without requiring constant bookkeeping.

What works brilliantly for my experience level is the GM guidance material (Chapters 21-26). The faction standing ladder, downtime mechanics, and advancement system give structure without over-constraining improvisation. I can prepare thoroughly or wing it - the system accommodates both.

The acknowledgment of genre flexibility is valuable. As someone curious about playing in different genres with the same core mechanics, I appreciate that the system doesn't force thematic lock-in. The mechanical framework adapts.

My only hesitation - and it's minor given my preferences - is whether every table will naturally achieve the fiction-first flow the book aspires to. In my experience, heavy use of Conditions and Clocks can tip toward bookkeeping if not actively managed, but the writing acknowledges this and provides guidance.

Overall, this rulebook feels like it was written by experienced GMs for experienced GMs. It trusts the table while providing mechanical scaffolding when needed. For someone like me - a Forever GM who values systems that work across genres and support genuine collaboration - this is genuinely compelling.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "While improved, the interaction between Attributes, Skills, and Proficiencies could benefit from more guidance on priority-setting for different character archetypes",
      impact: "Players might create mechanically redundant characters if they don't understand the mechanical identity system, particularly across different genres",
      location: "Skill Selection and Proficiency Selection steps"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The modification clarifies intent-to-outcome mapping well, but edge cases around contested checks in collaborative contexts need more examples",
      impact: "Tables running duet or collaborative scenarios may need to house-rule how contested intent resolution works when opposition is narrative rather than antagonistic",
      location: "Contested Outcomes subsection"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The enhanced Clock mechanics are elegant but the interaction between multiple Clocks progressing toward different outcomes needs clearer guidance",
      impact: "Scenarios with interlocking Clocks (Progress + Pressure + External Threat clocks) may overwhelm improvisational GMs tracking multiple states",
      location: "Multi-Clock Scenarios section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The refined positioning system works well, but switching between combat and narrative-heavy action requires more explicit guidance on pacing transitions",
      impact: "Genre-flexible GMs may struggle with when to 'zoom in' to tactical positioning versus 'zoom out' to narrative description, potentially losing players in mode transitions",
      location: "Positioning Tags and Environmental Setup subsections"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "The expanded support for alternative modes is excellent, but GMless and solo play sections feel like they could benefit from sample scenarios",
      impact: "Groups wanting to try these modes may need to invest time researching external resources rather than finding concrete procedures in-book",
      location: "GMless Cooperative Play and Solo Play subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a mature, well-crafted system that genuinely delivers on its fiction-first promise. The modifications to Chapters 6, 8, 9, and 10 demonstrate careful attention to clarity and usability - these chapters now feel authoritative and accessible simultaneously.

For a Forever GM like myself, this book offers something valuable: a system flexible enough to work across genres while maintaining mechanical coherence. The character creation changes create meaningful identity expression without overwhelming choice paralysis. The action resolution system feels natural rather than forced. The Tag/Condition/Clock triad provides just enough structure to scaffold complex scenes without grinding fiction to a halt.

What impresses most is the respect for collaborative storytelling. The multiple play modes aren't afterthoughts - they're genuinely integrated. The GM guidance material treats GMs as creative partners rather than rule arbiters.

My recommendation: This is a strong rulebook that will appeal to experienced GMs seeking narrative-first mechanics and new players wanting to learn a system built on collaborative principles. It achieves the difficult balance of being both accessible and mechanically sophisticated. The specific revisions to Chapters 6, 8, 9, and 10 strengthen an already solid foundation.

For my campaign table, Razorweave is an immediate consideration for our next long-form campaign arc, particularly for genre-hoppy play where the mechanical consistency would provide continuity across different narrative contexts.`
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

- **Archetype:** Achiever
- **Experience:** Forever GM
- **Playstyle:** Curious, Intuitive

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
