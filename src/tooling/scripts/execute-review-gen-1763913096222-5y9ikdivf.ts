/**
 * Execute reviewer prompt for persona gen-1763913096222-5y9ikdivf
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 59063
 * - Archetype: Explorer
 * - Experience: Veteran (10-20 years)
 * - Fiction-First: Native
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Non-GM
 * - Genre Flexibility: Enjoys Flexibility
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096222-5y9ikdivf';
const personaName = 'Generated Persona 59063';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 8
  },
  narrative_feedback: `As a veteran explorer with nearly two decades of gaming under my belt, I approach rulebooks with a blend of cautious optimism and hard-earned skepticism. The Razorweave Core Rulebook is a refreshingly well-crafted system that respects both the narrative flow and the mechanical necessities of actual play.

What immediately strikes me is the book's clarity of purpose. From the opening chapters, there is no confusion about what Razorweave is trying to accomplish: a fiction-first framework that trusts players to engage with story while providing mechanical scaffolding when the outcome matters. This honest positioning is rare and appreciated.

The organization is exemplary. Chapters 1-5 build philosophical foundation before diving into crunch, which is exactly how rulebooks should be structured. The progression respects the reader's learning curve. As someone who has played dozens of systems, I value when a book acknowledges that players do not need to memorize mechanics before their first session—the Quick-Start options prove this philosophy is genuine.

Character creation (Chapter 6) is notably thoughtful. The nine-step process with worked examples strikes a balance I rarely see. The optional 10-minute character path is not window dressing—it actually works. I tested it mentally against my own first-session experiences, and new players would genuinely feel competent with those minimums. The identity elements section (Step 2) is particularly good; it acknowledges that mechanics serve narrative, not the reverse.

The core resolution system (Chapter 8) is where this rulebook truly shines. The When to Roll section elegantly captures what takes other games chapters to explain: Checks are tools for uncertainty, not gatekeeping. The intent/approach distinction helps GMs set appropriate DCs. The standard DC ladder is concrete enough to be immediately usable, abstract enough to adapt. In my experience, this is the sweet spot many systems miss. I have watched GMs struggle with featureless DC systems for years; this one will not have that problem.

Tags, Conditions, and Clocks (Chapter 9) requires careful attention from cautious players like myself. The distinction between Tags (scene elements) and Conditions (character states) is logical, though I admit I would want to see this in actual play before fully trusting the distinction will not blur under pressure. The Clock system for progress tracking is intuitive—it echoes indie games I have enjoyed but with more mechanical clarity. This chapter does what good design does: creates a shared language without requiring constant rule lookups.

Combat (Chapter 10) deserves specific praise. The action types (Strike, Maneuver, Set Up, Defend/Withdraw) are clear and enable meaningful tactical choice without bogging down in a dozen subsystems. Positioning is handled through Tags rather than grid coordinates, which keeps the narrative flow intact while preserving tactical options. As a player who values story pacing, I appreciate this restraint. The combat examples would benefit from being slightly longer to showcase the full loop, but what is there is serviceable.

The GM support chapters (21-26) reflect genuine understanding of actual campaign management. The faction standing ladder (Hostile to Honored) is gameable without being artificial. The downtime overview strikes a balance between structure and flexibility. The scenario design guidance acknowledges multiple play modes—group, duet, GMless, solo, asynchronous—without pretending they are all equally supported by the base mechanics.

Where I urge caution: The Tags/Conditions/Clocks system, while elegant, creates a few cognitive touchpoints. During actual play, particularly in the first sessions, GMs and players will need to internalize when Tags apply versus when Conditions take precedence. This is not a fatal flaw—the system is clear—but it is a consideration for tables with newer members or those coming from different system cultures. My cautious nature suggests some groups will benefit from summary cards or a quick-reference during the first few sessions.

The advancement system (Chapter 19) takes a refreshingly flexible stance on long-term growth. Offering multiple paths to character advancement (mechanical improvement, narrative discovery, mechanical customization) respects different table cultures. I particularly appreciate that advancement does not mandate power creep; characters can change meaningfully without becoming progressively more powerful.

The alternative play modes (Chapter 26) are mentioned thoughtfully but clearly secondary to the core group experience. This honest scoping is better than pretending a system that was designed for group play will equally support GMless play without house rules. Integrity of scope matters.

Overall assessment: This is a competent, thoughtful rulebook written by people who understand table experience. The fiction-first philosophy is genuine but grounded in mechanical reality. As a veteran explorer who values narrative integrity and reliable mechanical scaffolding, I would run this system and expect it to serve interesting stories well. The cautious part of me suggests groups should read at least Chapters 1-10 before their first session, but that is true of most games. Recommended enthusiastically for experienced groups and cautiously for newer tables—provide support during the first few sessions with summary materials, and this system will flow beautifully.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step process is thorough but could overwhelm first-time players despite the 10-minute option",
      impact: "Session zero might extend longer than anticipated; newer players may feel decision paralysis despite the streamlined path existing",
      location: "Steps 1-9 Overview and execution guidance"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The Edge/Burden stacking rules (capped at ±2) are correct but could use a worked example showing multiple sources combining",
      impact: "GMs may occasionally miscalculate modifiers when three or four conditions converge; clarification would reduce table friction",
      location: "Edge, Burden, Tags, and Conditions section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The theoretical distinction between Tags (scene elements) and Conditions (character states) is clear but may blur during fast-paced play",
      impact: "Groups will benefit from summary cards or quick-reference sheets; without these, first sessions may see occasional confusion about applicability",
      location: "Core Concepts section defining Tags vs Conditions"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat examples show partial loops rather than complete encounter sequence",
      impact: "GMs may need to extrapolate how multiple rounds flow together; a worked example of 2-3 full rounds would improve confidence",
      location: "Example Encounters and action sequence demonstrations"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless and solo play modes are described but lack dedicated mechanical support or expanded guidance",
      impact: "Groups attempting these modes will improvise significant house rules; this is honest scoping but worth noting for players expecting equal support",
      location: "GMless Cooperative Play and Solo Play subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a genuinely well-crafted game that honors both narrative integrity and mechanical reliability. Written with clear understanding of actual table experience, it delivers on its fiction-first promise without sacrificing usability. For veteran explorers who have tried dozens of systems and appreciate both good storytelling and mechanical scaffolding, this is exactly the kind of middle-ground system that serves long-term campaign play beautifully. The cautious explorer in me notes that some cognitive scaffolding (summary cards, quick-reference sheets) would help first sessions flow more smoothly, but the bones are solid. The system respects its own complexity and does not pretend to be lighter-weight than it is, which shows design maturity. Recommended enthusiastically for experienced gaming groups and thoughtfully for newer tables with GM support. This rulebook achieves the rare balance of being both mechanically sound and narratively respectful.`
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
- **Experience:** Veteran (10-20 years)
- **Playstyle:** Native to fiction-first, Narrative Purist, Cautious

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
