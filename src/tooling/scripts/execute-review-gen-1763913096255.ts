/**
 * Execute reviewer prompt for persona gen-1763913096255-8452gb8ju
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 455412
 * - Archetype: Power Gamer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Neutral
 * - GM Philosophy: Railroad Conductor
 * - Genre Flexibility: Genre-Specific Purist
 * - Cognitive Style: Systems Integrator
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
const personaId = 'gen-1763913096255-8452gb8ju';
const personaName = 'Generated Persona 455412';

// Review data based on thorough analysis from the Power Gamer persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As a Power Gamer with deep experience both running and playing TTRPGs, I approach every rulebook with one question: where are the optimization opportunities, and does the system reward mastery? The Razorweave Core Rulebook presents an interesting challenge - it's clearly designed with a fiction-first philosophy that I'm skeptical of, but there are mechanical bones here worth examining.

The 4d6 dice pool system with its Advantage/Disadvantage mechanic (rolling 5-6 dice and keeping best/worst 4) is mathematically elegant. I appreciate the explicit DC ladder (12/14/16/18/20/22) - this tells me exactly what I need to hit. The margin-based outcome tiers (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse, Critical Failure at -7 or all 1s) give me clear targets to build around.

However, as a systems integrator, I find the character optimization space disappointingly shallow. The four-attribute spread (Might, Agility, Reason, Presence) with a 10-point buy system doesn't leave much room for creative builds. You can't really "break" this system because it's intentionally flat. Skills grant Advantage or bonuses, Proficiencies provide narrative permission - but where's the combo potential? Where are the synergies I can exploit?

The Tag and Condition system is where things get interesting mechanically. Tags like Elevated (Advantage on ranged attacks), Dim Light (Advantage to stealth), and Cover interact with positioning in ways that reward tactical thinking. But the game seems to want me to discover these in play rather than pre-calculate optimal positions. That's frustrating - I want to KNOW going in that standing on high ground with Cover while my target is in Dim Light gives me stacking benefits.

Combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) are clearly defined, which I appreciate. The initiative-free approach with "declare actions, resolve simultaneously or by fictional positioning" introduces more GM fiat than I'm comfortable with. As someone who prefers to railroad toward optimal outcomes, I dislike systems where the GM can reorder initiative based on narrative considerations.

The Clock system (4/6/8 segment trackers) is serviceable for tracking extended challenges, but the book is vague about exactly how much progress specific actions grant. "One tick for success, two for Critical Success" is fine, but some Clocks apparently have variable tick rates based on action quality? This ambiguity is poison for optimization.

The Skills reference (Chapter 15) and Proficiencies reference (Chapter 17) are comprehensive, but I notice a disturbing lack of numeric progression. You either have a skill/proficiency or you don't - there's no "ranks" or "levels" to these abilities that would let me build toward increasingly powerful combinations over a campaign arc. The advancement system (Chapter 19) is similarly restrained, favoring narrative milestones over XP accumulation.

From a Genre-Specific Purist perspective, this system seems designed to be setting-agnostic, which means it's not optimized for any particular power fantasy. I'd need to see setting-specific supplements to know if there are genre-appropriate optimization paths.

The GM section (Chapters 21-26) is transparent about design philosophy, which I appreciate even if I disagree with it. The VPC (Villain/Powerful Character) rules give adversaries special abilities, but the stat blocks feel narrative rather than tactical.

Bottom line: Razorweave is competently designed but actively resists the kind of deep system mastery I crave. The mechanical clarity is there, but the optimization ceiling is low. If you want a game where fiction "matters more" than your build, this delivers. If you want to feel like your character creation choices and tactical decisions compound into overwhelming advantage, look elsewhere.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "The 10-point attribute buy with four stats creates a flat power curve with limited differentiation between builds",
      impact: "No clear 'best' builds or meaningful trade-offs means character optimization provides minimal mechanical advantage",
      location: "Attribute Assignment and Point Buy System"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Initiative-less combat resolution based on 'fictional positioning' introduces excessive GM discretion",
      impact: "Optimal turn order cannot be reliably calculated or manipulated by players; rewards GM favor over tactical superiority",
      location: "Turn Order and Action Resolution sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock tick rates are inconsistently defined; some tick on success, others have variable rates",
      impact: "Cannot pre-calculate optimal Clock progression strategies; resource expenditure efficiency is unknowable",
      location: "Ticking Clocks section and Progress Clock vs Pressure Clock definitions"
    },
    {
      section: "Chapter 14/15 - Skills System",
      issue: "Binary skill possession (have it or don't) with no ranks or levels eliminates vertical progression",
      impact: "No mechanical growth path for specialization; a skill at character creation equals that skill at campaign end",
      location: "Skills System Overview and Skills Reference by Attribute"
    },
    {
      section: "Chapter 19 - Advancement and Long Term Growth",
      issue: "Milestone-based advancement with no explicit XP values removes quantifiable progress metrics",
      impact: "Cannot calculate optimal session efficiency for character advancement; progression feels arbitrary rather than earned",
      location: "Milestone Advancement and Growth Opportunities sections"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Lack of explicit damage values, hit points, or wound thresholds makes combat lethality unpredictable",
      impact: "Cannot calculate survivability or threat assessment; risk/reward calculations depend on GM interpretation of Conditions",
      location: "Damage and Consequences, Combat Outcomes sections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a well-organized, clearly written system that deliberately constrains the optimization space I thrive in. For Power Gamers, this is a fundamental misalignment. The mechanics are sound - the 4d6 resolution, DC ladder, and outcome tiers all work - but they're deployed in service of a fiction-first philosophy that actively resists min-maxing. The flat character progression (binary skills, milestone advancement, no stat inflation over time) means session 1 characters aren't meaningfully weaker than session 50 characters in raw mechanical terms. The Tag/Condition system offers some tactical depth, but GM control over initiative and Clock ticking undermines systematic optimization. This is a game for people who want "fair" characters and "emergent" stories. If you need to dominate the game through superior system mastery, Razorweave will frustrate you. Rating: Mechanically competent but philosophically opposed to power gaming.`
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

- **Archetype:** Power Gamer
- **Experience:** Hybrid GM/Player
- **Playstyle:** Skeptical, Systems Integrator

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
