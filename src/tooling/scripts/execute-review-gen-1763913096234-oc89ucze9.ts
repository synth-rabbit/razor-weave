/**
 * Execute reviewer prompt for persona gen-1763913096234-oc89ucze9
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Power Gamer)
 * - Archetype: Power Gamer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Curious
 * - GM Philosophy: GMless Advocate
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096234-oc89ucze9';
const personaName = 'Power Gamer / Hybrid GM/Player';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As a Power Gamer with extensive experience on both sides of the GM screen, I approach this rulebook looking for optimization vectors, mechanical depth, and exploitable synergies. The Razorweave Core Rulebook presents an interesting challenge for someone like me: it's a system that deliberately resists min-maxing while still providing enough mechanical scaffolding to reward system mastery.

**The Dice Engine: 4d6 Analysis**

The 4d6 resolution system is mathematically elegant. Rolling 4d6 produces a bell curve centered around 14, with a standard deviation that makes modifiers meaningful but not overwhelming. The Attribute spread of 2/1/1/0 means the difference between your best and worst stat is only 2 points on a typical roll of 14-24 total. This compression means character competence varies less than in D&D-style systems, which as a Power Gamer I find both frustrating (less room for optimization) and interesting (forcing me to find advantages elsewhere).

The Advantage/Disadvantage system (roll 5d6 or 6d6, keep best/worst 4) is the primary mechanical lever. I immediately noticed that stacking Advantage sources is capped at +2, which prevents the runaway bonuses I'd typically engineer. However, the interaction between Tags, Conditions, and Proficiencies creates a complex web of potential combinations that rewards careful positioning and preparation.

**DC Ladder and Margin System**

The DC ladder (12/14/16/18/20/22) is clean and predictable. With a 4d6+2 roll (best Attribute), I can reliably hit DC 16 (Tough) tasks with decent odds. The margin-based outcome tiers (Critical at +5, Full at 0, Partial at -1 to -2, Failure at -3 or worse) create interesting decision points. As a Power Gamer, I appreciate that Critical Success exists as a distinct tier - it gives me something to build toward mechanically.

**GMless Advocacy Perspective**

As someone who champions GMless play, I was excited to see Chapter 5 acknowledge GMless Cooperative Play explicitly. However, the support feels thin. The book says players "use procedures that rotate authority" but doesn't provide those procedures. For GMless play to work, you need explicit mechanisms for scene framing, consequence arbitration, and challenge generation. The core resolution system could support GMless play, but the book doesn't give me the tools to actually run it. This is a significant gap for my play style.

**Optimization Vectors I Identified**

1. **Set Up Action Economy**: The Set Up action creates Advantage for subsequent Strikes. In combat, the optimal pattern seems to be: first character Sets Up, second character Strikes with Advantage. This two-person combo should be devastating against single high-value targets.

2. **Tag Manipulation**: Maneuvers can create or remove Tags. A character optimized for Maneuvers can reshape the battlefield dramatically, creating Exposed or stripping Solid Cover from enemies before the Strikers engage.

3. **Clock Manipulation**: Clocks track progress and threats. Understanding the clock economy lets you game the pacing - burning through a Progress Clock quickly while slowing enemy Threat Clocks through defensive play.

4. **Proficiency Stacking**: While Skills add directly to rolls, Proficiencies lower DCs or provide fictional advantages. A character with overlapping Proficiencies in a specific domain could trivialize challenges in their wheelhouse.

**Pattern-Driven Analysis**

I recognize several design patterns from other narrative games:
- The Tag/Condition system echoes Fate's Aspects but with more mechanical weight
- Clocks are clearly influenced by Blades in the Dark
- The Intent/Approach framework feels Powered by the Apocalypse-adjacent
- The 4d6 resolution resembles GURPS's 3d6 but with broader outcome tiers

These familiar patterns make the system learnable, but the synthesis feels somewhat conservative. I don't see a unique mechanical innovation that defines Razorweave's identity.

**Criticisms from a Power Gamer Perspective**

1. **Lack of Character Build Options**: The Attribute array is fixed (2/1/1/0), and Skills/Proficiencies are open-ended but GM-approved. There's no feat system, no class abilities, no power trees. This limits my ability to theory-craft optimal builds before session zero.

2. **Soft Mechanical Ceilings**: The Advantage cap at +2 and the compressed Attribute range mean I can't create the 20% better character that scratches my optimization itch. The system deliberately flattens power curves.

3. **GM-Dependent Difficulty**: DC setting is entirely GM discretion. Without clear guidance on what makes something DC 16 vs DC 18, I can't reliably assess challenge difficulty or plan approaches.

4. **Vague Proficiency Benefits**: Proficiencies "do not add numbers to Checks" but "influence difficulty, consequences, and access to information." This is too fuzzy for optimization. I need to know: does having the right Proficiency lower DC by 2? Grant Advantage? Both?

**What Works for Me**

The combat action economy (Strike, Maneuver, Set Up, Defend/Withdraw) is well-designed. There are clear tactical trade-offs, and the system rewards coordinated team play over individual alpha-strikes. The Resolve Clock replacing HP is excellent - it creates variable fight lengths and lets the fiction drive when someone is "out" rather than pure attrition.

I also appreciate that the system acknowledges power gaming is a valid play style without moralizing against it. The rules don't punish optimization; they simply don't provide the deep mechanical sandbox some of us crave.

**Bottom Line**

Razorweave is a competent fiction-first system that will frustrate dedicated Power Gamers while offering enough mechanical texture to remain engaging. The optimization game here is positional and collaborative rather than build-centric. If I play this, my power gaming will manifest as tactical coordination, Tag manipulation, and Clock management rather than character building. That's a valid design choice, but it's not where I shine.`,
  issue_annotations: [
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless play is acknowledged but not mechanically supported with actual procedures",
      impact: "Groups attempting GMless play will need to import procedures from other games or improvise heavily, undermining the book's claim to support this mode",
      location: "GMless Cooperative Play subsection"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "DC setting lacks objective criteria, relying entirely on GM judgment without calibration examples",
      impact: "Power Gamers cannot reliably assess task difficulty or plan optimal approaches; inconsistent DC setting between GMs breaks system mastery",
      location: "Setting DCs section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Fixed Attribute array (2/1/1/0) with no variants removes build diversity and optimization space",
      impact: "Power Gamers have no meaningful character creation decisions beyond concept; mechanical differentiation happens entirely through GM-approved Skills/Proficiencies",
      location: "Step Three: Assign Attributes"
    },
    {
      section: "Chapter 16 - Proficiencies System Overview",
      issue: "Proficiency mechanical effects are described qualitatively rather than quantitatively",
      impact: "Cannot calculate the actual benefit of Proficiencies for optimization purposes; creates uncertainty about character value",
      location: "What Proficiencies Do section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock segment counts for different threat tiers are not standardized",
      impact: "Cannot predict fight duration or resource expenditure; makes tactical planning harder without metagame knowledge",
      location: "Resolve Instead of Hit Points section"
    }
  ],
  overall_assessment: `Razorweave presents a well-crafted fiction-first system that consciously deemphasizes the mechanical optimization that Power Gamers typically seek. The 4d6 resolution engine is mathematically sound, the combat action economy creates genuine tactical decisions, and the Tag/Condition/Clock triad provides emergent complexity. However, the system deliberately compresses power curves, caps Advantage stacking, and leaves key mechanical levers (Proficiency effects, DC calibration) frustratingly vague.

For a Power Gamer like myself, the optimization game shifts from character building to tactical play - positioning, Tag manipulation, and coordinated action economy. This is valid design but not my preferred playground. The GMless support I advocate for is acknowledged but not mechanically delivered, which is a missed opportunity.

I would play this system, recognizing that my power gaming instincts will need to manifest at the table rather than during character creation. The system resists exploitation by design, which I respect even as it frustrates me. Recommended for Power Gamers willing to adapt their optimization style from builds to tactics, with the understanding that the mechanical ceiling is intentionally low.`
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
- **Fiction-First:** Curious
- **GM Philosophy:** GMless Advocate
- **Cognitive Style:** Pattern-Driven

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
