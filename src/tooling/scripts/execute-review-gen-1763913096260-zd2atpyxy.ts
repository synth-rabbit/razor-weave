/**
 * Execute reviewer prompt for persona gen-1763913096260-zd2atpyxy
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona - Storyteller
 * - Archetype: Storyteller (narrative-focused player, enjoys character arcs and dramatic moments)
 * - Experience: Experienced (3-10 years in TTRPGs)
 * - Evangelism: Evangelical (actively recommends games to others)
 * - Narrative/Mechanics: Prefers Narrative Tools (story over crunch)
 * - GM Philosophy: Prepared Sandbox (prepares content but follows player direction)
 * - Cognitive Style: Intuitive (trusts instincts, prefers holistic understanding)
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
const personaId = 'gen-1763913096260-zd2atpyxy';
const personaName = 'Storyteller - Experienced Evangelical';

// Review data based on thorough analysis from the persona's perspective
// Key traits informing this review:
// - Storyteller archetype: focused on narrative arcs, character development, dramatic moments
// - Experienced (3-10 years): knows what works, can compare to other systems
// - Evangelical: actively shares games they love, looking for reasons to recommend
// - Prefers Narrative Tools: wants mechanics that enhance story, not dominate it
// - Prepared Sandbox GM: prepares frameworks but follows emergent narrative
// - Intuitive: trusts feel over formulas, absorbs rules holistically

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who lives for those magical moments when a story takes an unexpected turn and everyone at the table leans in, I found this rulebook speaking directly to my sensibilities. The fiction-first philosophy is exactly what I want to evangelize to my gaming groups.

The book opens strong. Chapter 1's declaration that "The story comes first. Mechanics support the story when the outcome of an action is uncertain and meaningful" is the exact framing I need when introducing hesitant players to narrative games. I can already imagine reading that passage aloud at session zero.

What truly resonates is how Tags, Conditions, and Clocks work together to create narrative texture without requiring constant number-crunching. When I read about a fight described through Tags like "Dim Light," "Elevated," and "Fragile Cover," I immediately visualized how I'd describe that scene to my players. The system gives me handles for atmospheric storytelling without dictating specific outcomes.

The Resolve Clock system replacing traditional hit points is brilliant for my style. The description that "characters are taken out when the story supports it, not at an arbitrary number" is exactly the design philosophy I champion. A 6-segment clock for a dangerous VPC feels like pacing guidance, not an HP bar to whittle down.

As a prepared sandbox GM, I deeply appreciate Chapter 9's treatment of Clocks as "visual trackers of danger, opportunity, or change." When I prepare sessions, I build frameworks and let players drive direction. Clocks give me a visible, shared tool for pacing without railroading. The dual-clock investigation example (finding a saboteur vs. relay shutdown) is exactly how I want to structure mysteries.

The example character Rella provides a model I can point new players toward. The way her concept emerges naturally from background ("former telegraph engineer searching for meaning in strange message patterns") into mechanical choices demonstrates how fiction drives character building, not the reverse.

However, as an intuitive reader, I found some sections more procedural than I'd prefer. The nine-step character creation process is thorough but feels like it could be condensed for players who absorb concepts holistically. I would have appreciated a "quick start" sidebar for experienced narrative gamers.

The GMless cooperative play section caught my attention, but its brevity in Chapter 5 frustrated me. As someone evangelical about narrative games, shared authority is a key feature I'd promote. The chapter mentions procedures but defers details to Chapter 26. For a persuasion-oriented conversation with skeptical players, I need those procedures upfront.

Where this book excels: the consistent voice throughout. The tone respects readers' intelligence while remaining accessible. The examples consistently demonstrate the fiction-first loop in action. The GM Guidance boxes feel collaborative rather than prescriptive - they suggest conversation starters rather than hard rules.

I will absolutely recommend this system. The clarity around intent and approach, the elegant Resolve system, the narrative richness of Tags and Clocks - these are the features that make tables sing. My only reservation is whether players who've never experienced fiction-first gaming will make the conceptual leap. The book assumes some familiarity with narrative gaming conventions.`,
  issue_annotations: [
    {
      section: "Chapter 5: Ways to Play the Game",
      issue: "GMless cooperative play overview lacks procedural substance",
      impact: "Evangelical GMs cannot immediately demonstrate shared authority mechanics when recruiting new players; must reference Chapter 26 mid-pitch, breaking conversational flow",
      location: "Section 'GMless Cooperative Play' - single paragraph mentioning 'procedures that rotate authority' without examples"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Nine-step creation flow may overwhelm intuitive learners",
      impact: "Players who prefer holistic absorption over step-by-step procedures might disengage before reaching the example character; experienced narrative gamers may find the structure unnecessarily rigid",
      location: "Section 'The Creation Flow' - numbered list of nine steps before any fiction begins"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Excellent Resolve Clock philosophy, but threat calibration guidance scattered",
      impact: "Prepared sandbox GMs need consolidated threat-building reference; currently must hunt through examples to understand segment scaling for different threat levels",
      location: "Section 'Resolve Instead of Hit Points' - philosophy explained well, but segment sizing guidance only appears in examples"
    },
    {
      section: "Cross-Chapter",
      issue: "Assumes baseline familiarity with fiction-first gaming",
      impact: "Players completely new to narrative RPGs may struggle to internalize the fiction-first loop without additional onboarding material; limits evangelical reach to gaming-adjacent audiences",
      location: "Throughout - phrases like 'fiction first' and 'intent and approach' introduced but not deeply scaffolded for total newcomers"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a love letter to narrative gaming that I will enthusiastically recommend to my circles. The system captures what I value most: mechanical frameworks that serve story rather than constrain it.

Strengths for my playstyle:
- Fiction-first philosophy explicitly stated and consistently demonstrated
- Tags and Clocks provide rich narrative handles without number bloat
- Resolve system invites dramatic pacing over attrition math
- Prepared sandbox GMs get excellent tools for responsive play
- Examples throughout show the play loop in action, not just abstract rules

Gaps I noticed:
- GMless procedures deferred when they'd strengthen evangelical pitch
- Character creation structure might frustrate intuitive absorbers
- Assumes some prior narrative gaming experience

For my groups - experienced players open to narrative tools - this is an easy 9/10. For total newcomers to fiction-first gaming, I'd want supplementary onboarding content or a dedicated introductory adventure that walks through the paradigm shift.

The book knows its audience and serves them well. I suspect I'll be running a Razorweave one-shot within the month and using it to recruit converts to the narrative gaming faith.`
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

- **Archetype:** Storyteller
- **Experience:** Experienced (3-10 years)
- **Evangelism:** Evangelical
- **Playstyle:** Prefers Narrative Tools, Intuitive
- **GM Philosophy:** Prepared Sandbox

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
