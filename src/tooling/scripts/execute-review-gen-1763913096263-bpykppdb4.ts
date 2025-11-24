/**
 * Execute reviewer prompt for persona gen-1763913096263-bpykppdb4
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona bpykppdb4
 * - Archetype: Killer (system mastery, optimization focused)
 * - Experience: Early Intermediate (1-3 years)
 * - Conversion Status: Converting (needs help transitioning to fiction-first)
 * - Mechanics Preference: Needs Concrete Numbers
 * - GM Philosophy: Prepared Sandbox
 * - Cognitive Style: Concrete Thinker
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
const personaId = 'gen-1763913096263-bpykppdb4';
const personaName = 'Generated Persona bpykppdb4';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As someone who has been playing TTRPGs for a couple of years and is used to more traditional systems with clear crunch, I approached this rulebook wanting to find the numbers. I want to know exactly what I roll, when I roll it, and what the outcomes mean in concrete mechanical terms. I am converting to fiction-first play, but I still need the system to give me something solid to hold onto.

The good news: this rulebook does provide concrete numbers where it matters most. The 4d6 resolution system is clearly explained. The DC ladder (DC 12 Easy through DC 22 Legendary) gives me exact targets to aim for. I know that a margin of +5 or better is a Critical Success, 0 or better is Full Success, -1 to -2 is Partial Success, and -3 or worse is Failure. That kind of explicit breakdown is exactly what I need.

The Advantage/Disadvantage system is also clearly quantified:
- +1 Advantage: Roll 5d6, keep best 4
- +2 Advantage: Roll 6d6, keep best 4
- -1 Disadvantage: Roll 5d6, keep worst 4
- -2 Disadvantage: Roll 6d6, keep worst 4

I can work with that. I can calculate probabilities, I can understand my odds, I can make tactical decisions.

The combat chapter delivers what I need as a Killer archetype. The four core actions (Strike, Maneuver, Set Up, Defend/Withdraw) give me a clear tactical framework. I understand that Strikes advance enemy Resolve Clocks, that Set Ups grant Advantage for future actions, and that positioning matters. The Resolve Clock system replacing hit points actually works well for me once I understood that a 6-segment clock means I need roughly 3-4 solid hits (Full Successes ticking 2 segments each).

However, the book has some friction points for someone like me:

1. **Fiction-first philosophy takes too long to get to the numbers.** The first several chapters are philosophy and principles. I understand why fiction-first matters, but I had to wade through a lot of "the story comes first" before I got to the concrete resolution mechanics in Chapter 8. For a concrete thinker converting from crunchier systems, I wanted the mechanics front-loaded.

2. **Skill and Proficiency boundaries are fuzzy.** The rulebook explicitly says Skills and Attributes can pair flexibly (Stealth with AGI for sneaking, Stealth with RSN for planning routes). That flexibility is philosophically nice but mechanically ambiguous. I want to know: if I build for AGI+Stealth, am I going to get value, or will the GM constantly tell me to use RSN instead? The system trusts the fiction, but I want clearer guidelines for when specific combinations apply.

3. **Clock segment counts are mentioned but not standardized.** The book mentions 4, 6, 8, 10, and 12 segment clocks without firm guidance on when to use each size. I see examples (6-segment for major investigations, 4-segment for threat clocks) but I want a clear table that says "use a 4-segment clock for X, 6-segment for Y, 8-segment for Z."

4. **Advancement costs are referenced but not fully detailed in Part I.** I found reference to XP-based, milestone-based, and session-based advancement models, but the actual XP costs for new Skills, Proficiencies, and Attribute improvements are deferred to Chapter 19. For character planning purposes, I need those numbers earlier. I want to know what my build path looks like before I start playing.

5. **The faction standing ladder is helpful (Hostile/Unfriendly/Neutral/Friendly/Honored) but lacks mechanical specificity.** What exactly does "Friendly" grant me in terms of DCs or Advantage? The book says "discounts, information, and small favors" but that is narrative, not mechanical.

What I appreciate most is that when the book does give numbers, they are clean and usable:
- DC ladder with 6 explicit tiers
- 5-tier outcome system with exact margin ranges
- Attribute ratings of +1 to +3 (implied from examples)
- Clear Advantage/Disadvantage rules
- Resolve Clocks with explicit segment counts

For someone used to games with detailed character builds and tactical combat, this system offers surprising depth once you dig into it. The combat actions have real tactical weight. Set Up actions genuinely matter for team coordination. The Tag and Condition systems create meaningful battlefield states without overwhelming tracking.

As a prepared sandbox GM (which is how I would run this), I can see how Clocks and Factions would work. The faction standing system gives me clear categories to track NPC relationships. The Clock system gives me visible progress meters for my players to interact with.

But I am still converting. I need the book to meet me halfway, and sometimes it asks me to trust the fiction more than my mechanical instincts are comfortable with. The flexibility that veterans celebrate feels like ambiguity to me right now.`,
  issue_annotations: [
    {
      section: "Chapters 1-5 - Foundations",
      issue: "Philosophy-heavy introduction delays access to concrete mechanics",
      impact: "Players converting from traditional systems may lose patience before reaching actionable rules in Chapter 8",
      location: "Chapters 1-5, approximately 20+ pages before core resolution"
    },
    {
      section: "Chapter 14-15 - Skills System",
      issue: "Flexible Skill+Attribute pairing lacks concrete guidance for common situations",
      impact: "Concrete thinkers may struggle to predict which combinations will apply, reducing ability to plan character builds",
      location: "Skills and Attributes section, Skill Reference chapter"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "Clock segment sizing (4, 6, 8, 10, 12) mentioned without a summary table or clear guidelines",
      impact: "GMs without experience may guess at clock sizes, leading to inconsistent pacing",
      location: "What Clocks Are section, Advancing Clocks section"
    },
    {
      section: "Chapter 12 - Downtime, Recovery, and Advancement Overview",
      issue: "XP costs and advancement numbers deferred to Chapter 19, requiring forward reference",
      impact: "Players wanting to plan character advancement paths during creation lack necessary information",
      location: "Advancement Overview section"
    },
    {
      section: "Chapter 12 - Relationships, Factions, and Standing",
      issue: "Faction standing ladder (Hostile to Honored) lacks explicit mechanical benefits per tier",
      impact: "System mastery players cannot optimize faction interactions without clearer mechanical effects",
      location: "Relationships, Factions, and Standing section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a well-designed fiction-first system that does provide concrete numbers where it counts most. The 4d6 resolution engine, DC ladder, outcome tiers, and Advantage/Disadvantage system give me the mechanical certainty I need to engage tactically. The combat system offers genuine tactical depth through the four core actions and the Resolve Clock framework.

My ratings reflect my specific perspective as a Killer archetype with early intermediate experience who is converting to fiction-first play:

- **Clarity (7/10):** The rules are clearly written when they appear, but the structure front-loads philosophy over mechanics. For someone looking for "what do I roll," the answer comes later than I would like.

- **Rules Accuracy (8/10):** The mechanics are internally consistent. The 4d6 system is well-calibrated, DCs are reasonable, and outcome tiers produce meaningful differentiation. No contradictions or ambiguities in the core resolution.

- **Persona Fit (6/10):** This is a fair-to-middling fit for my archetype. As a Killer who needs concrete numbers, I get enough to work with, but the system's flexible philosophy sometimes conflicts with my desire for optimization clarity. The "trust the fiction" approach works against systematic character building.

- **Practical Usability (7/10):** At the table, I can run this. The Tags and Conditions are easy to track. Clocks are visual and intuitive. Combat flows reasonably well once you internalize the four actions. Reference materials (sheets, glossary) support play. But I need the GM to bridge some gaps where the book says "decide together."

**Recommendation:** For players like me who are converting from crunchier systems, I recommend reading Chapters 6-10 first to get the mechanical foundation, then returning to Chapters 1-5 for context. The philosophy makes more sense after you understand what the mechanics are actually doing.

This is a good system that will work well for me once I finish converting my mindset. It just requires more translation effort than a purpose-built tactical game would. The designers clearly prioritized fiction-first veterans, and players like me need to meet it partway.`
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

- **Archetype:** Killer (system mastery, optimization focused)
- **Experience:** Early Intermediate (1-3 years)
- **Conversion Status:** Converting to fiction-first
- **Mechanics Preference:** Needs Concrete Numbers
- **GM Philosophy:** Prepared Sandbox
- **Cognitive Style:** Concrete Thinker

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
