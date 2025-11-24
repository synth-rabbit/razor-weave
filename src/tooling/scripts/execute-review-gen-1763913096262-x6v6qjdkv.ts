/**
 * Execute reviewer prompt for persona gen-1763913096262-x6v6qjdkv
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona - Killer/Hybrid GM/Player
 * - Archetype: Killer
 * - Role: Hybrid GM/Player
 * - Style: Skeptical, Needs Concrete Numbers, Collaborative Storyteller, Simplicity Seeker
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
const personaId = 'gen-1763913096262-x6v6qjdkv';
const personaName = 'Killer/Hybrid GM/Player';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As a Killer-archetype player who switches between GM and player roles, I need systems that give me concrete tactical frameworks while still enabling collaborative storytelling. I approach rulebooks with skepticism until I see the actual numbers. The Razorweave Core Rulebook is a mixed bag for my playstyle.

Let me start with what works: The DC ladder is explicit and usable. DC 12 Easy, DC 14 Routine, DC 16 Tough, DC 18 Hard, DC 20 Heroic, DC 22 Legendary - these are concrete benchmarks I can work with. The outcome tier system (Critical Success at +5 margin, Full Success at 0+, Partial Success at -1 to -2, Failure at -3 or worse, Critical Failure at -7 or all 1s) gives me predictable resolution math. I can calculate odds and make informed tactical decisions.

The Advantage/Disadvantage system is elegant in its simplicity: +1 Advantage rolls 5d6 keep best 4, +2 rolls 6d6 keep best 4, with the inverse for Disadvantage. The cap at +/- 2 prevents runaway stacking, which I appreciate from a balance perspective.

However, my primary frustration is the Resolve Clock system replacing hit points. The book claims this keeps combat "fiction first," but from a tactical standpoint, "a 6-segment Resolve Clock" doesn't tell me what I need to know. How many segments does a Full Success Strike tick? The example suggests 2 for Full Success and 1 for Partial - but this isn't codified as a rule, it's presented as an example. When I'm GMing, I need to know: is 2 ticks standard? What about Critical Success - does that tick 3? The book is frustratingly vague here.

The combat action economy is clear enough: Strike, Maneuver, Set Up, Defend/Withdraw. But again, the concrete effects are loosely defined. Set Up "grants Advantage" - okay, but for how long? One action? The whole scene? The book keeps saying "work with your GM to determine" which is not an answer for someone who needs concrete numbers to feel secure in their tactical choices.

As a collaborative storyteller, I genuinely appreciate the fiction-first philosophy and the emphasis on intent and approach driving mechanical choices. The pairing of intent (what you want) with approach (how you do it) to determine which Attribute and Skill applies is smart design. It keeps players engaged with the narrative while still providing mechanical hooks.

The Tag and Condition system is conceptually strong. Environmental Tags like Dim Light, Slick, Cramped affecting positioning, and character Conditions like Exhausted, Bleeding, Frightened imposing Disadvantage - this creates tactical texture without overwhelming complexity. But again, I want more specific guidance. Does Dim Light impose -1 or -2 Disadvantage? The answer seems to be "it depends" which leaves me as GM making arbitrary calls during play.

The Clock system for extended conflicts is genuinely useful - paired Progress and Pressure Clocks create natural tension. I can see using "Evacuation Complete (6 segments)" vs "Flood Waters Rise (4 segments)" as a pacing tool. This is the kind of concrete structure I can work with.

What frustrates me most as a simplicity seeker is the proliferation of overlapping systems. Skills, Proficiencies, Tags, Conditions, Clocks, Advantage/Disadvantage, DC modifiers - there are multiple levers to pull for any given situation. The book says this creates flexibility, but from my perspective, it creates decision paralysis. When a player attempts an action in Dim Light while Exhausted and having a relevant Proficiency against an NPC with a Tag, I have to adjudicate: Is this Advantage vs Disadvantage canceling out? Does the Proficiency provide additional Advantage? Does the NPC Tag increase the DC or impose additional Disadvantage? The answer is always "use your judgment" which is not satisfying.

The character creation system is thorough but front-loaded. Nine steps feels excessive for what could be streamlined. The Attribute spread (2, 1, 1, 0) is simple enough, but by the time I'm choosing Skills, Proficiencies, Background, Relationships, Goals, Drives, and Personal Threads, I'm mentally exhausted before I've rolled a single die.

For my Killer archetype specifically, I want to know: how do I optimize? What's the mathematically best way to build for combat effectiveness? The system deliberately obscures this by making everything situational. That's probably intentional design, but it doesn't serve my playstyle.`,
  issue_annotations: [
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock tick rates are presented as examples rather than codified rules, leaving GMs to improvise damage scales",
      impact: "Tactical players cannot reliably predict or plan around combat effectiveness; may lead to inconsistent lethality across sessions",
      location: "Resolve Instead of Hit Points section, Example - Enemy Resolve"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "Advantage/Disadvantage sources from Tags, Conditions, and Proficiencies can stack ambiguously",
      impact: "GMs must make on-the-fly rulings about modifier interactions that players cannot anticipate, reducing tactical agency",
      location: "Advantage, Disadvantage, Tags, and Conditions section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Individual Tags lack specific mechanical definitions (e.g., Dim Light = -1 Disadvantage vs contextual GM call)",
      impact: "Consistency varies between GMs and sessions; players cannot reliably factor environmental conditions into tactical planning",
      location: "Common Tag Categories, What Tags Do"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Set Up action duration is undefined - whether Advantage persists for one action, one turn, or entire combat is unclear",
      impact: "Players cannot evaluate Set Up as a tactical investment compared to direct Strike action",
      location: "Action-Setup subsection"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step creation process front-loads significant decision-making before players understand the system",
      impact: "New players may make suboptimal choices they later regret; experienced tactical players lack optimization guidance",
      location: "The Creation Flow section"
    },
    {
      section: "Chapter 14 - Skills System Overview",
      issue: "Open-ended Skill lists with no mechanical differentiation between Skills creates false choice anxiety",
      impact: "Tactical players seeking optimal builds have no basis for comparison; narrative players may feel overwhelmed by options",
      location: "Choosing Skills at Character Creation"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a competently written, philosophically coherent system that will frustrate tactical players while potentially delighting pure narrative enthusiasts. For my Killer/Hybrid playstyle, the system provides insufficient concrete mechanical guidance.

The core 4d6 resolution with explicit DC ladder and outcome tiers is solid mathematics. The Advantage/Disadvantage system is elegantly bounded. But the superstructure built on top - Tags, Conditions, Clocks, Skills, Proficiencies - creates a fuzzy overlay that removes the tactical certainty I need.

If I'm GMing this system, I'll need to create my own reference sheets specifying exact mechanical effects for common Tags and standardized Clock tick rates. If I'm playing, I'll constantly be asking my GM "how many segments does this tick?" and "does this grant Advantage?" - questions the rulebook deliberately leaves open.

The collaborative storytelling elements are genuinely good. Intent and approach driving mechanics, partial success as a core story beat, and Clocks creating tension - these are well-designed narrative tools. But the book wants to be both fiction-first AND mechanically robust, and it achieves neither fully.

Rating Summary:
- Clarity: 7/10 - Well-organized, good examples, but deliberate vagueness on key mechanical questions
- Rules Accuracy: 6/10 - Core resolution is tight, but peripheral systems lack precision
- Persona Fit: 5/10 - Poor match for tactical/optimization playstyles; better for pure narrative focus
- Usability: 6/10 - Playable but requires significant GM adjudication and house-ruling

I would run or play this system with heavy modifications, creating the concrete reference materials the book declines to provide. The philosophical foundation is sound, but the execution prioritizes flexibility over the reliability tactical players require.`
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
- **Role:** Hybrid GM/Player
- **Style:** Skeptical, Needs Concrete Numbers, Collaborative Storyteller, Simplicity Seeker

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
