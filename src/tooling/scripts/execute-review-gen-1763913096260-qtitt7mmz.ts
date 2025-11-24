/**
 * Execute reviewer prompt for persona gen-1763913096260-qtitt7mmz
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Power Gamer)
 * - Archetype: Power Gamer
 * - Experience: Experienced (3-10 years)
 * - Disposition: Curious
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Prepared Sandbox
 * - Risk Tolerance: Cautious
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
const personaId = 'gen-1763913096260-qtitt7mmz';
const personaName = 'Power Gamer - Cautious Explorer';

// Review data based on thorough analysis from the persona's perspective
// Key traits informing this review:
// - Power Gamer archetype: wants to optimize, find synergies, and master systems
// - Experienced (3-10 years): familiar with RPG conventions, can spot design patterns
// - Curious: open to new ideas, willing to explore unfamiliar mechanics
// - Narrative Purist: prefers story-driven play over heavy crunch
// - Prepared Sandbox: likes having structure but freedom within it
// - Cautious: appreciates clear consequences and risk management tools

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As a power gamer who has spent years optimizing characters across different systems, approaching Razorweave with my curious but cautious mindset was an interesting experience. The fiction-first philosophy initially felt foreign to my optimizer instincts, but my narrative purist leanings helped me appreciate what the system is trying to accomplish.

The 4d6 resolution with Advantage/Disadvantage is elegant and immediately graspable. Coming from d20 systems, the bell curve distribution feels more predictable, which appeals to my cautious nature. I can roughly estimate my chances before committing to risky actions, which is essential for the kind of prepared sandbox play I enjoy.

What excites me most is the Tag and Condition system. As someone who loves finding synergies, I immediately see the potential here. Stacking favorable Tags, positioning for Advantage, and managing Conditions feels like a meaningful optimization layer that respects narrative without sacrificing tactical depth. The example in Chapter 9 about the warehouse fight (Cramped, Fragile Cover, Slick) showed exactly how Tags create emergent tactical situations.

However, my power gamer side wants more concrete benchmarks. The Attribute spread of 2/1/1/0 is the only option presented, and I immediately wonder: what happens with alternative arrays? Could a 3/1/0/0 specialist exist? The book mentions a "soft cap" around +3 for Attributes but never explicitly defines alternative starting configurations. For a prepared sandbox GM, I'd want clear guidelines on whether custom arrays are balanced.

The Skills and Proficiencies system is both liberating and frustrating. I love that custom Skills are encouraged - this lets me build exactly the character I envision. But without a bounded list, I can't easily assess relative power levels. My cautious side worries about table variance: one GM might accept "Master of All Combat" while another insists on granular distinctions. Chapter 14 provides guidance but not firm boundaries.

The advancement system (Chapter 19) satisfies my long-term optimization goals. The menu-based approach means I can plan character trajectories multiple advancements ahead. Session-based vs. milestone triggers give my prepared sandbox GM options to pace growth appropriately.

For my cautious playstyle, the Clock system is exceptional. Visual threat trackers mean I always know how close we are to disaster. This transforms abstract danger into concrete, manageable pressure. I particularly appreciated the dual-clock examples (Evacuation vs. Flood Waters) that create meaningful racing scenarios.

The GM sections (Chapters 21-25) impressed me with their structured flexibility. Fronts and Factions provide the prepared sandbox infrastructure I crave, while Tags and Clocks let the world respond organically to player actions. This is exactly the combination of preparation and emergence that creates satisfying campaigns.

One significant gap for power gamers: combat scaling. Chapter 10 introduces Resolve Clocks instead of hit points, which is narratively elegant but mechanically opaque. How many segments should a "challenging" encounter provide? The book gives scattered examples (6-segment for "dangerous VPCs") but no systematic threat-building framework. For a prepared sandbox GM, this means substantial homework translating encounter difficulty into Clocks.

Overall, Razorweave offers a satisfying middle ground. It rewards system mastery through Tag manipulation, positioning, and Clock management rather than pure number optimization. My curious side is eager to explore these emergent possibilities; my cautious side appreciates the predictable resolution curve and visible threat trackers. The main tension is between narrative flexibility and the power gamer's desire for clear optimization targets.`,
  issue_annotations: [
    {
      section: "Chapter 6: Character Creation - Step Three",
      issue: "Single Attribute array (2/1/1/0) with no variant options",
      impact: "Power gamers seeking specialized builds have no RAW-supported alternatives. This limits character differentiation at creation and forces all characters into the same statistical shape, regardless of concept extremity.",
      location: "Step Three: Assign Attributes - only default spread provided, alternatives must be house-ruled"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "No systematic framework for Resolve Clock scaling by threat tier",
      impact: "GMs must reverse-engineer appropriate Clock segments from scattered examples. Power gamers cannot reliably assess encounter difficulty, and prepared sandbox GMs lack tools for consistent challenge calibration.",
      location: "Section 'Resolve Instead of Hit Points' - examples given but no scaling table or formula"
    },
    {
      section: "Chapter 14-15: Skills System",
      issue: "Open skill list lacks power-level guidelines",
      impact: "Without clear scope boundaries, tables may experience significant variance in custom Skill breadth. A cautious player cannot easily assess whether their proposed Skill is appropriately scoped compared to examples.",
      location: "Chapter 14 overview and Chapter 15 examples - guidance provided but no explicit power-level tiers"
    },
    {
      section: "Chapter 7: Characters and Attributes",
      issue: "Attribute cap mentioned but not formalized",
      impact: "The 'soft cap' of +3 for Attributes is mentioned in passing but never codified. Long-term optimization planning requires clearer advancement ceilings to set expectations.",
      location: "Section 'Attribute Advancement' references a soft cap but lacks explicit rule"
    },
    {
      section: "Chapter 20: Optional and Variant Rules",
      issue: "Heroic Baseline variant provides edge Condition but lacks specifics",
      impact: "The variant mentions characters starting with an edge Condition like 'Inspired' or 'Bolstered' but doesn't specify mechanical parameters (how many uses, what triggers refresh). Cautious players need clarity before adopting optional rules.",
      location: "Pacing and Difficulty Variants table - Heroic Baseline entry"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook represents a thoughtful bridge between narrative-first design and tactical engagement. For my specific profile - a curious power gamer with narrative purist tendencies who prefers prepared sandboxes and cautious play - the system delivers approximately 75% of what I seek.

Core Strengths:
- The Tag/Condition system creates emergent tactical depth that rewards system mastery without requiring spreadsheet optimization
- Predictable 4d6 bell curve supports informed risk assessment, crucial for cautious play
- Clock mechanics provide visible threat management that transforms abstract danger into concrete decisions
- GM tools (Fronts, Factions, Clocks) support prepared sandbox infrastructure excellently
- Menu-based advancement enables long-term character planning

Areas Requiring Table Negotiation:
- Attribute arrays: Power gamers seeking specialized builds will need house rules
- Skill scoping: Open lists require strong GM guidance to maintain balance
- Combat scaling: GMs must develop personal frameworks for threat calibration
- Advancement caps: Long-term campaigns need explicit ceiling discussions

Recommendation for Similar Profiles:
This system rewards tactical thinking through positioning, Tag manipulation, and Clock management rather than numerical optimization. Power gamers comfortable shifting from "bigger numbers" to "better positioning" will find satisfying depth here. The cautious player benefits from visible threat trackers and predictable resolution math. Prepared sandbox GMs gain excellent infrastructure tools but should expect to develop supplementary encounter-building guidelines.

The book succeeds as a coherent, well-organized system that knows its design goals. My curiosity is satisfied by its novel approaches; my caution is addressed by its transparency about probability and consequence. The main gap is the power gamer's desire for more explicit mechanical boundaries, which the book intentionally trades for narrative flexibility.

Best suited for tables that want tactical engagement without combat-focused crunch, and for GMs who appreciate structured frameworks that leave room for improvisation.`
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
- **Experience:** Experienced (3-10 years)
- **Disposition:** Curious
- **Narrative/Mechanics:** Narrative Purist
- **GM Philosophy:** Prepared Sandbox
- **Risk Tolerance:** Cautious

## Structured Ratings

| Category | Rating |
|----------|--------|
| Clarity & Readability | ${reviewData.ratings.clarity_readability}/10 |
| Rules Accuracy | ${reviewData.ratings.rules_accuracy}/10 |
| Persona Fit | ${reviewData.ratings.persona_fit}/10 |
| Practical Usability | ${reviewData.ratings.practical_usability}/10 |

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

---
*Generated by Razorweave Review System*
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
