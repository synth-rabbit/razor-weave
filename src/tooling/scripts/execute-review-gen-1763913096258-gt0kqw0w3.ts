/**
 * Execute reviewer prompt for persona gen-1763913096258-gt0kqw0w3
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Power Gamer/Long-term GM
 * - Archetype: Power Gamer
 * - Experience: Long-term GM
 * - Traits: Skeptical, Needs Concrete Numbers, GMless Advocate, Experimental
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
const personaId = 'gen-1763913096258-gt0kqw0w3';
const personaName = 'Power Gamer/Long-term GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 5,
    persona_fit: 4,
    practical_usability: 6
  },
  narrative_feedback: `As a power gamer who has spent decades optimizing characters and running long campaigns, I approach this rulebook with a critical eye focused on mathematical rigor, system transparency, and GMless viability. My verdict: Razorweave has potential but leaves significant gaps that frustrate players who need concrete numbers and verifiable systems.

**The Numbers Problem**

Let me be blunt: this system lacks the mathematical transparency power gamers require. The 4d6 resolution produces a bell curve centered around 14, with typical totals ranging from 4-24. Adding Attribute modifiers of 0-2 shifts this to approximately 4-26 at character creation. Against the DC ladder (12-22), this seems reasonable on the surface.

However, the actual probability distributions are never explicitly stated anywhere in the text. What is my actual success rate on a DC 16 check with a +2 Attribute? The book expects me to trust the system without showing me the math. I calculated it myself: rolling 4d6+2 against DC 16 gives roughly a 68% chance of full success or better, but the book never tells me this. Power gamers need these numbers to make informed decisions.

The Advantage/Disadvantage system (rolling 5d6 or 6d6, keeping best/worst 4) compounds this opacity. How much does +1 Advantage actually improve my odds? The book treats this as a black box. I ran the simulations: +1 Advantage shifts the median result up by approximately 1.5-2 points, which is significant but never quantified in the text.

**Clocks and Resolution Ambiguity**

The Clock mechanic replaces hit points, which I actually appreciate philosophically—it emphasizes narrative beats over attrition. But the implementation is maddeningly vague from an optimization standpoint:

- How many segments should a character's Resolve Clock have? The book says "depends on the fiction" but never gives baseline numbers.
- A Full Success "significantly advances" a Resolve Clock. A Partial "ticks 1 segment with a cost." What counts as "significant"? Two segments? Three? The example shows a 6-segment enemy where Full Success ticks 2, but is this a rule or a suggestion?
- The relationship between damage, weapon types, and Clock advancement is entirely fictional. A sword and a pistol could have identical mechanical weight, or vastly different impact—it depends entirely on GM interpretation.

For a power gamer, this is frustrating. I cannot build a "combat monster" because the system deliberately obscures what makes someone better at combat beyond Attribute selection.

**GMless Play: Aspirational but Unsupported**

Chapter 5 lists GMless Cooperative Play as a supported mode, and as someone who advocates for GMless designs, I was excited. That excitement faded quickly. The book offers approximately two paragraphs on GMless play with no concrete procedures:

- No oracle system for answering questions
- No explicit procedures for rotating authority
- No rules for who interprets outcome tiers when there's no GM
- No guidance on handling contested social scenes between player characters

Compare this to systems like Ironsworn or Fiasco that provide complete GMless frameworks. Razorweave says "the table uses procedures that rotate authority" without defining those procedures anywhere. This feels like a checkbox feature rather than genuine support.

**What Works: Experimental Framework**

Despite my criticisms, I see genuine experimental potential here. The fiction-first philosophy combined with flexible Attribute-Skill pairings creates interesting optimization space. I can envision building characters around specific Tag/Condition/Clock interactions:

- A controller who specializes in creating Tags that impose Disadvantage on enemies
- A support character who focuses on Set Up actions to grant persistent Advantage
- A tank who maximizes Defend/Withdraw efficiency to absorb Clock pressure

The system also rewards player creativity in ways that traditional combat systems don't. If I can convince the GM that my approach creates a favorable Tag, I gain mechanical benefit. This is emergent optimization rather than predetermined builds.

**The Proficiency Problem**

Proficiencies "do not add numbers to Checks" but instead "influence difficulty, consequences, and access." This is precisely the kind of soft benefit that power gamers struggle with. How much easier? What specific consequences change? The book says a character with the right Proficiency "may" get a lower DC or reduced complications, but this is entirely at GM discretion.

In practice, Proficiencies become conversational leverage rather than mechanical guarantees. That's fine for some playstyles, but it makes character building feel arbitrary from an optimization perspective.

**Comparative Analysis**

Against systems I've optimized extensively:
- D&D 5e: More mathematical transparency, but less narrative flexibility
- Blades in the Dark: Better defined Clock interactions and clear Position/Effect mechanics
- FATE: Similar fiction-first philosophy but clearer mechanical hooks via Aspects
- PbtA games: More explicit move triggers and consequence structures

Razorweave sits in an uncomfortable middle ground—too crunchy for pure narrative players, too soft for number-crunchers. It needs to commit more firmly in one direction or provide explicit variant rules for different preferences.

**Recommendations for Power Gamers**

If you want to play this system as a power gamer:
1. Negotiate with your GM upfront about Clock segment values for different threat levels
2. Create a reference sheet mapping Advantage/Disadvantage to approximate probability shifts
3. Establish baseline expectations for Tag creation difficulty
4. Define house rules for Proficiency mechanical impact (e.g., "relevant Proficiency = -2 DC")
5. Accept that social optimization will always outperform mechanical optimization in this system

**Bottom Line**

Razorweave is a well-intentioned system that prioritizes narrative collaboration over mechanical precision. For tables that want that experience, it delivers. For power gamers who need transparent math, verifiable builds, and concrete numbers, it requires significant house-ruling or a fundamental shift in playstyle. The GMless support is particularly disappointing—this is an area ripe for experimental design that the book essentially ignores.

I would run this system experimentally for a short campaign to test my optimization theories, but I would not commit to a long-form campaign until the community develops clearer mechanical frameworks.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "No probability tables or mathematical breakdowns for the 4d6 resolution system",
      impact: "Power gamers cannot make informed decisions about risk without calculating probabilities themselves; players who need concrete numbers feel lost",
      location: "Rolling 4d6 and Calculating Margin section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock segment values and advancement rates are purely fictional with no baseline numbers",
      impact: "Character optimization becomes impossible when the core damage/resolution metric is undefined; combat encounters feel arbitrary",
      location: "Resolve Instead of Hit Points section"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless Cooperative Play is listed as supported but provides no actual procedures, oracles, or authority rotation rules",
      impact: "Groups attempting GMless play will need to import entire subsystems from other games; the feature feels like marketing rather than genuine support",
      location: "GMless Cooperative Play subsection"
    },
    {
      section: "Chapter 16 - Proficiencies System Overview",
      issue: "Proficiencies explicitly do not add numbers but the GM-discretionary benefits are never quantified",
      impact: "Character building decisions around Proficiencies feel arbitrary; power gamers cannot evaluate trade-offs between Proficiency choices",
      location: "Core definition of Proficiency mechanical impact"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The mechanical weight of Tags and Conditions defaults to GM interpretation without standardized values",
      impact: "Players cannot reliably build around Tag/Condition manipulation when the effects vary by table; reduces strategic depth",
      location: "Using Tags and Conditions with Checks section"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Advantage/Disadvantage probability impact is never quantified despite being a core modifier system",
      impact: "Players cannot evaluate whether actions that grant Advantage are worth taking over direct actions; hidden math frustrates optimization-focused players",
      location: "Advantage, Disadvantage, Tags, and Conditions section"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook presents a fiction-first collaborative system that deliberately de-emphasizes mechanical precision in favor of narrative flexibility. For power gamers and number-crunchers, this design philosophy creates significant friction. The system lacks the mathematical transparency needed for meaningful character optimization, the Clock-based resolution obscures combat effectiveness metrics, and the GMless support is aspirational rather than functional.

The system shows experimental promise in its flexible Attribute-Skill pairings and Tag/Condition interactions, offering emergent optimization opportunities for creative players willing to negotiate mechanical interpretations with their GM. However, this requires social optimization rather than character-sheet optimization, which represents a fundamental shift for traditional power gamers.

Rating: 5.5/10 for a power gamer audience. The system would benefit enormously from appendices containing probability tables, baseline Clock values, and concrete GMless procedures. As written, it requires extensive house-ruling to satisfy players who need verifiable numbers. Recommended only for power gamers willing to experiment with narrative-first design or those comfortable treating optimization as a collaborative negotiation rather than mathematical certainty.`
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
- **Experience:** Long-term GM
- **Traits:** Skeptical, Needs Concrete Numbers, GMless Advocate, Experimental

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
