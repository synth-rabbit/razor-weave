/**
 * Execute reviewer prompt for persona gen-1763913096249-f6wg7mamq
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 478604
 * - Archetype: Tactician
 * - Experience: Forever GM
 * - Fiction-First: Native
 * - Narrative/Mechanics: Neutral
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Genre-Specific Purist
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096249-f6wg7mamq';
const personaName = 'Generated Persona 478604';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `As a Tactician who's been running games for decades, I approach any rulebook with pattern recognition honed by thousands of hours at the table. The Razorweave Core Rulebook demonstrates sophisticated mechanical architecture that respects both the fiction and the underlying system structure.

What impresses me immediately is the systemic consistency. The 4d6 resolution mechanic cascades elegantly through every subsystem—Combat, Exploration, Social Play—without requiring special cases or exceptions. This is hallmark design. The Tags system functions as a semantic framework that lets GMs apply mechanical weight precisely where narrative moments demand it. As someone who thinks in patterns and structures, I appreciate that Tags solve a genuine problem: how do you make environmental factors matter without bogging down resolution?

The Clocks mechanic is particularly clever. Rather than abstract "pass/fail" outcomes, Clocks create graduated narrative states. This lets Scene Framers like myself prepare flexible pacing structures rather than binary outcomes. A clock can hit 6/8 and still leave meaningful choices on the table. That's mechanically sophisticated thinking.

However, my analytical eye catches some friction points. The distinction between Tags (persistent, scene-level) and Conditions (applied to characters) is clear in documentation, but the tactical flow during actual play could be tighter. When a character takes a "Wounded" Condition and the scene has environmental "Unstable Ground" Tags, GMs need rapid mental models to track interaction precedence. Does Unstable Ground force additional checks for Wounded characters? The rulebook implies it, but doesn't explicitly state priority resolution.

The Skills system feels comprehensive but slightly overspecialized. Seventy-two skills across six attributes is thorough, but my tactical thinking asks: are all these distinctions mechanically meaningful, or am I managing semantics instead of gameplay consequence? The difference between "Sleight of Hand" and "Pickpocketing" (both under Subterfuge) is narratively distinct but mechanically identical.

The character creation process is well-structured with its step-by-step progression, but I note that the nine steps assume players understand the vocabulary before session one. Attributes, Tags, Proficiency domains—these layers compound. For Forever GMs teaching newcomers, the onboarding curve is steeper than it appears.

What works brilliantly is the Faction system. Standing ladders create strategic depth that a Scene Framer can structure into long-form campaign arcs. The interplay between faction conflicts and scene framing gives me tools to escalate stakes naturally. The downtime system similarly supports multi-session tactical planning—I can craft advancement that matters across character and faction timescales.

The optional variant rules section demonstrates thoughtful system design. Genre-Specific Purist that I am, I appreciate that the book acknowledges "right way to play" without being dogmatic about it. The duet and solo play modes are genuinely useful for preparation thinking, even if my primary mode is traditional group play.

The GM guidance chapters (21-26) are the book's strongest asset. The scenario design process, running sessions framework, and NPC/VPC guidelines provide architectural scaffolding that lets me preplan with precision. The campaign structure recommendations acknowledge faction pressure, session pacing, and narrative escalation—this is designed by people who understand long-form play.

Minor friction: The extensive reference tables (clocks, tags, DC tiers) are organized logically but scattered across multiple chapters. A consolidated reference appendix would reduce table-time page-flipping during tactical encounters.

Overall, this rulebook is written for GMs like me who think systemically about game architecture. The mechanics reinforce narrative play through precise design rather than abstracting it away. It's not rules-light, but it's rules-efficient—every system element earns its mechanical weight.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The interaction between Tags, Conditions, and resolution modifiers could specify clearer precedence rules",
      impact: "During tactical moments, GMs must interpolate whether environmental Tags or character Conditions apply their effects first, potentially creating inconsistent adjudication",
      location: "Tag and Condition Application during Resolution, examples section"
    },
    {
      section: "Chapter 14-15 - Skills System",
      issue: "Seventy-two skills with semantic distinctions that don't carry mechanical weight (e.g., Sleight of Hand vs Pickpocketing both use d6+Subterfuge)",
      impact: "Players and GMs may over-focus on picking the 'correct' skill name rather than trusting their narrative judgment, adding cognitive overhead without mechanical payoff",
      location: "Subterfuge skills listing and combat application examples"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step process assumes familiarity with game vocabulary (Attributes, Proficiency domains, Condition mechanics) before players can complete creation",
      impact: "New players may struggle with prerequisite concepts, making session-zero substantially longer and requiring GM interpretation of design intent",
      location: "Steps One through Nine, terminology introduction"
    },
    {
      section: "Chapter 27 - Sheets and Play Aids",
      issue: "Reference tables are distributed across multiple chapters (clocks in Ch. 9, DC tiers in Ch. 8, tags in extended reference Ch. 18)",
      impact: "During play, GMs must flip between chapters to cross-reference mechanics, slowing tactical decision-making and breaking scene framing momentum",
      location: "Table organization and appendix structure"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Duet, GMless, solo, and asynchronous play modes are documented but lack explicit mechanical adjustments for pacing and resolution",
      impact: "GMs attempting these modes must infer system modifications, potentially creating inconsistency between modes and requiring house rules for clarity",
      location: "Duet Play, GMless Play, Solo Play subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exceptionally well-designed for GMs who think tactically about system architecture. As a Forever GM and Scene Framer, I find the mechanical patterns elegant and the structural support for campaign-long play sophisticated. The Tags/Conditions/Clocks triad creates a flexible framework that lets narrative moments carry mechanical weight without becoming burdensome.

The book's greatest strength is its recognition that scene framing requires precise tools: pacing mechanisms (Clocks), environmental meaning (Tags), character state tracking (Conditions), and escalation structures (Factions). Each mechanic solves a real problem at the table.

My reservations stem not from the design philosophy but from specificity gaps where implicit becomes explicit. The skills system prioritizes comprehensive coverage over mechanical distinction. The interaction between overlapping mechanics (Tags applied to a scene vs Conditions on characters) needs clearer priority rules for rapid adjudication. The distribution of reference tables across chapters adds unnecessary friction during tactical play.

For a Forever GM accustomed to running multiple systems simultaneously, this rulebook rewards careful study and table mastery. The mechanical architecture is sound. The issue is making that architecture intuitive during fast-paced scene framing, not whether it works. Genre-Specific Purist that I am, I recognize this system does what it claims: creates framework for genre-specific play with genuine mechanical depth.

Recommended strongly for experienced GMs building long-form campaigns. Less suitable for groups seeking rules-light play or expecting minimal prep burden. The rulebook repays investment with rich tactical and narrative possibilities.`
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
- **Experience:** Forever GM
- **Playstyle:** Native Fiction-First, Neutral Narrative/Mechanics, Scene Framer, Genre-Specific Purist
- **Cognitive Style:** Analytical, Pattern-Driven

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
