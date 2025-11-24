/**
 * Execute reviewer prompt for persona gen-1763913096246-ktcddei0u
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 246-ktcddei0u
 * - Archetype: Tactician
 * - Experience: Veteran (10-20 years)
 * - Fiction-First: Skeptical, Needs Concrete Numbers
 * - GM Philosophy: Prepared Sandbox
 * - Cognitive Style: Analytical
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
const personaId = 'gen-1763913096246-ktcddei0u';
const personaName = 'Generated Persona 246-ktcddei0u';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `After two decades of running tactical games across multiple systems, I approached Razorweave with professional skepticism. Systems that lead with "fiction first" often hide mechanical ambiguity behind flowery prose. My job as a GM is to make rulings that feel consistent and fair, which requires predictable frameworks. So let me break down what I found.

The core resolution system is mathematically sound. The 4d6 distribution (range 4-24, mean ~14) against the DC ladder (12/14/16/18/20/22) creates reasonable probability curves. When you add Attribute modifiers (+0 to +2 at character creation), a character with a relevant Skill attempting a DC 14 task has roughly a 70-80% chance of at least partial success. That math holds up to scrutiny. The margin-based outcome tiers (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse, Critical Failure at -7 or all 1s) provide predictable escalation that I can plan around.

What I appreciate is the Advantage/Disadvantage system with its concrete implementation: roll 5d6 or 6d6 and keep best/worst 4. This is measurably different from flat modifiers and creates genuine swing without breaking bounded accuracy. The cap at plus or minus 2 prevents stack abuse, which shows the designers understood tactical players would optimize.

However, my primary concern is the gap between philosophy and procedure. The book repeatedly emphasizes "fiction first" and "rules as tools," but for a prepared sandbox GM, I need deterministic frameworks for world simulation. When I prepare a scenario, I need to know: if the players attempt X in context Y, what happens? The answer cannot always be "whatever feels right narratively."

The DC ladder is a good start, but the guidance on setting DCs is too soft. "Use lower DCs when characters have strong fictional positioning" is not actionable. I need a decision tree: base DC for action type, modifiers for specific circumstances. Chapter 8 provides the skeleton but not the muscle.

The Clock system is excellent for what it does. Six-segment and four-segment Clocks create visible pressure and allow me to telegraph consequences without railroad mechanics. The dual-Clock investigation example (Expose the Official vs. Cover-Up) demonstrates exactly how I would structure a prepared scenario with branching outcomes. This is tactical game design.

Combat works better than I expected. The Resolve Clock system replacing hit points is elegant for narrative purposes, but I want concrete guidance on sizing Clocks for different threat tiers. The book mentions 2-3 segments for quick threats and more for major foes, but no systematic framework exists. After twenty years of encounter balancing, I can eyeball this, but newer GMs will struggle.

The Tag and Condition systems provide the mechanical vocabulary I need. Environmental Tags like Dim Light, Slick, Cramped, Elevated have clear mechanical implications (Advantage/Disadvantage or DC modification). This is where the system shines for tactical preparation. I can design locations with specific Tags and know exactly how they will influence play.

The Skills and Proficiencies chapters give me the most usable material. The detailed Skill entries with scope, default actions, sample DCs, synergies, and counters provide exactly the framework I need to make consistent rulings. The example Skills (Athletic Movement DC 12-14 routine, 16-20 risky; Stealth DC 12-14 casual, 16-18 Alert guards) give me benchmarks I can extrapolate from.

My biggest frustration is with the fiction-first philosophy conflicting with prepared play. The book says "you do not start with a rule and try to force the fiction to match it." But as a sandbox GM, I DO start with rules. I build a world with consistent physics, factions with mechanical standing, and locations with defined Tags. When players enter that sandbox, the rules should simulate the world's response. This philosophical tension is never resolved.

The faction standing system mentioned in GM chapters deserves more mechanical depth. How does standing translate to concrete DC modifiers or access? The book gestures toward this but never commits to numbers.

Turn order in combat offering three options (conversational, popcorn, initiative) is appropriately flexible, but I would have appreciated probability analysis of how different orders affect tactical play. Popcorn initiative creates very different dynamics than rigid turn order.

For my prepared sandbox approach, I would need to house-rule several things: a systematic DC modifier table, Clock sizing guidelines for encounter balance, and faction mechanics with concrete numbers. The foundation is solid enough to build on, but the book does not give me those tools directly.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "DC setting guidance relies too heavily on subjective assessment rather than systematic frameworks",
      impact: "GMs who prepare scenarios in advance cannot reliably predict or balance encounters without house-ruling a modifier system",
      location: "Setting DCs section - 'Use lower DCs when characters have strong fictional positioning' lacks concrete criteria"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock sizing lacks systematic guidelines for threat tiers and encounter balance",
      impact: "While the Clock system is elegant, prepared GMs cannot consistently size encounters without extensive playtesting or house rules",
      location: "Resolve Instead of Hit Points section mentions '2-3 segments for quick threats' but provides no comprehensive framework"
    },
    {
      section: "Chapter 4 - Core Principles of Play",
      issue: "Fiction-first philosophy creates tension with prepared sandbox play without acknowledging or resolving the conflict",
      impact: "GMs who build systematic world simulations must reconcile 'rules follow fiction' with 'world exists before characters interact with it'",
      location: "Fiction First, Mechanics Second section and throughout the principles chapter"
    },
    {
      section: "Chapter 25 - Factions, Fronts, World Pressure",
      issue: "Faction standing mechanics need concrete numerical frameworks for GM preparation",
      impact: "Without defined standing-to-modifier conversions, faction interactions become inconsistent between sessions",
      location: "Faction standing ladder discussion lacks mechanical specificity"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "Tag mechanical effects are described qualitatively when quantitative guidelines would serve prepared play better",
      impact: "GMs must house-rule specific Advantage/Disadvantage or DC modifier mappings for consistent rulings",
      location: "Common Tag Categories section describes effects in general terms rather than defining standard modifications"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook presents a mechanically sound foundation with genuine tactical depth hidden beneath its fiction-first rhetoric. After careful analysis, I see a system that CAN support rigorous prepared play, but does not explicitly embrace or facilitate that approach.

The mathematics work. The 4d6 resolution against bounded DCs creates predictable probability distributions. The Advantage/Disadvantage implementation is elegant and resistant to abuse. The Tag and Condition vocabulary provides consistent mechanical language for environmental and character states. The Clock system offers visible progress tracking that supports both player agency and GM planning.

What the book lacks is systematic decision support for GMs who prepare complex scenarios. The philosophical commitment to "fiction first" creates unnecessary friction with sandbox approaches where the world's rules exist before player actions. A prepared GM needs deterministic frameworks: if condition A is true, then DC modifier is X. The book provides examples but not systems.

I would rate this as a solid B-tier system for tactical play, requiring moderate house-ruling to achieve consistent sandbox operation. The foundation is strong enough that those house rules will not break the math. New GMs or those uncomfortable with improvised rulings should approach with caution. Veterans who enjoy building systematic frameworks will find adequate bones to flesh out.

For my table, I would use this system after developing: (1) a comprehensive DC modifier table, (2) Clock sizing guidelines mapped to threat tiers, (3) faction standing mechanics with concrete numbers, and (4) a location preparation template with standardized Tag definitions. The book provides the vocabulary; I would need to write the grammar.

Recommended with reservations for tactical/analytical GMs who prefer prepared sandbox play. The system has merit, but requires effort to operationalize for systematic world simulation.`
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

- **Archetype:** Tactician
- **Experience:** Veteran (10-20 years)
- **Fiction-First Stance:** Skeptical, Needs Concrete Numbers
- **GM Philosophy:** Prepared Sandbox
- **Cognitive Style:** Analytical

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
