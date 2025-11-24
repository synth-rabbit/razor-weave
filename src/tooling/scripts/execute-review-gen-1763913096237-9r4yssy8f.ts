/**
 * Execute reviewer prompt for persona gen-1763913096237-9r4yssy8f
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Power Gamer / Early Intermediate
 * - Archetype: Power Gamer
 * - Experience: Early Intermediate (1-3 years)
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: World Simulator
 * - Cognitive Style: Experimental
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
const personaId = 'gen-1763913096237-9r4yssy8f';
const personaName = 'Power Gamer / Early Intermediate';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 6
  },
  narrative_feedback: `As someone who's been gaming for a couple years and usually looks to optimize my builds, I came to this rulebook with mixed expectations. I've been trying to embrace more fiction-first systems after some friends convinced me narrative games can still be crunchy and rewarding. Here's my honest take.

The good news: the 4d6 core mechanic is elegant and I can math it out. DC 12-22 ladder gives me concrete targets to aim for. I appreciate that Advantage/Disadvantage caps at +/-2 and that the margin system (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse) gives me actual numbers to work with. As a world-simulator GM, I can use these consistently.

The Attribute spread (2/1/1/0) during character creation is clean, and I like that Skills and Proficiencies are open-ended but GM-approved. This gives me room to experiment and find interesting combinations without the system saying "no" to creative builds.

However, here's where my power-gamer instincts start itching: the system is deliberately vague about what happens mechanically in many situations. How many segments should a Resolve Clock have for different threat tiers? The book says "2-3 for quick threats, more for major foes" but doesn't give me a concrete table. I want to know: if I'm facing a DC 18 enemy with 6 Resolve segments, and I have AGI 2 plus a relevant Skill, what's my expected number of rounds to take them down assuming I Strike each turn?

The Tags and Conditions system is conceptually great but feels incomplete for optimization purposes. I see that Tags grant Advantage/Disadvantage or modify DCs, but there's no reference table showing exactly which Tags do what. The book says "agree at the table" which is fine for narrative players, but I want to know the mechanical weight of "Dim Light" versus "Cramped" versus "Elevated" before I commit to a strategy.

The combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) are intuitive and I like that Set Up can create Advantage for allies. That's tactically interesting. But I notice the book doesn't specify exact amounts - does a successful Strike tick 2 segments on a Full Success? The example suggests this but it's buried in prose, not in a clear table.

As an experimental player, I appreciate that the system encourages creative approaches. The intent/approach structure means I can try unconventional solutions and the GM picks the appropriate Attribute. That's cool. But it also means outcomes depend heavily on GM interpretation, which can feel inconsistent session to session.

The faction standing ladder (Hostile to Honored) is gameable and I like it. The downtime system with Clocks for training and projects gives me long-term goals to work toward. These are concrete systems I can engage with strategically.

Overall, I'm cautiously optimistic. The bones are solid and the math works, but I wish there were more reference tables, concrete examples of mechanical weights, and clearer guidelines for the GM to ensure consistent rulings. I can work with this system, but I'll need to do some homebrew tracking to satisfy my optimization itch.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The margin system is well-defined but scattered across prose rather than consolidated in a quick-reference table",
      impact: "During play, I'll need to flip back to find the exact thresholds for Critical Success (+5), Partial Success (-1 to -2), etc. A boxed summary would help power gamers internalize the math faster",
      location: "Rolling 4d6 and Calculating Margin section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock segment guidelines are vague - '2-3 for quick threats, more for major foes' doesn't give concrete scaling",
      impact: "As a world-simulator GM, I need consistent threat calibration. Without a table showing recommended segments by enemy tier, I'll have to experiment and potentially create unbalanced encounters",
      location: "Resolve Instead of Hit Points section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Tags are described categorically but without standardized mechanical weights",
      impact: "The book says to 'agree at the table' what Tags do, but I want to optimize my positioning. Without knowing that Elevated grants +1 Advantage on ranged or that Cramped imposes Disadvantage on wide swings consistently, tactical planning becomes guesswork",
      location: "Common Tag Categories and What Tags Do sections"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Skills and Proficiencies are open-ended without example scope guidelines",
      impact: "I appreciate the flexibility, but as someone who likes to find strong combinations, I need clearer boundaries. What's too broad? What's too narrow? The book says GM approval but doesn't give concrete examples of rejected vs approved custom entries",
      location: "Before You Choose Skills and Proficiencies section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Strike action outcome effects are described in prose rather than standardized",
      impact: "The example shows Full Success ticking 2 segments, Partial ticking 1, but this isn't codified as a rule. I want to calculate expected damage per round for tactical planning, but the system resists quantification",
      location: "Action: Strike section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook presents a mechanically sound fiction-first system that will challenge power gamers to adapt their optimization mindset. The 4d6 resolution, DC ladder, and margin-based outcomes provide enough crunch to engage with tactically, but the system deliberately resists the kind of precise numerical optimization many power gamers crave.

For players like me who are converting to fiction-first approaches, this is both a feature and a frustration. The system rewards creative problem-solving and narrative positioning over pure stat optimization, which can be liberating once you embrace it. However, the lack of consolidated reference tables, standardized Tag effects, and concrete threat-scaling guidelines means you'll spend more time negotiating with your GM than calculating optimal strategies.

As a world-simulator GM, I find the tools adequate but wish for more calibration support. The faction system, Clocks, and downtime activities are excellent - these are gameable systems I can run consistently. Combat, however, needs some house-ruling to feel predictable enough for fair tactical play.

Recommended for power gamers willing to experiment and trust their GM, but expect an adjustment period. Bring a notebook to track your own observations about how Tags, Conditions, and Resolve scale in practice. The system has depth; you'll just have to discover it through play rather than spreadsheets.`
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
- **Experience:** Early Intermediate (1-3 years)
- **Playstyle:** Converting to Fiction-First, Needs Concrete Numbers
- **GM Philosophy:** World Simulator
- **Cognitive Style:** Experimental

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
