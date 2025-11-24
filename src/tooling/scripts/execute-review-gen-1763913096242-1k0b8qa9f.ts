/**
 * Execute reviewer prompt for persona gen-1763913096242-1k0b8qa9f
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 341319
 * - Archetype: Tactician
 * - Experience: Early Intermediate (1-3 years)
 * - Fiction-First: Native
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Non-GM
 * - Genre Flexibility: Neutral
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096242-1k0b8qa9f';
const personaName = 'Generated Persona 341319';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As a player with a few years of RPG experience, I approach this rulebook as both a tactical participant and someone who wants to understand the system's underlying structure. The Razorweave Core Rulebook impressed me with its systematization and the clear numerical frameworks that make tactical choices possible.

What stands out immediately is how well the book integrates mechanics into narrative. Unlike some games where rules feel bolted on, this system makes fiction and mechanics work together. The 4d6 resolution system with degrees of success (Critical Success, Success, Partial Success, Failure) gives me concrete numbers to work with - I know exactly what I'm rolling for and what each outcome means. As a non-GM player, I particularly appreciate this clarity because it reduces ambiguity about what my character can accomplish.

The Skills and Proficiencies reference sections are exactly what I needed. Rather than abstract mechanics, I see specific mechanical effects tied to choices. The attribute-based skill organization makes sense: Prowess handles physical actions, Intellect handles knowledge, and so on. This systematic breakdown helps me understand character competency at a glance and plan what skills matter for my tactical approach.

The Tags and Conditions system is where this rulebook shines for someone with my cognitive style. The formal distinction between environmental Tags (applied to scenes) and Conditions (applied to characters) creates a clean mental model. Clocks provide a visible progress mechanic that I can see advancing - no ambiguity about whether we're making headway. When combined with the standardized Pressure mechanic, I can plan my character actions around visible system states.

Combat is particularly well-designed for tactical play. The action structure (Strike, Maneuver, Set Up, Defend/Withdraw) means I have concrete tactical choices each turn, and the positioning system with environmental Tags creates meaningful tactical positioning. I can see myself planning sequences of actions: Set Up an advantage, then Strike from a favorable position, or Maneuver to create breathing room. The system rewards thinking ahead.

The character advancement section provides clear mechanical rewards for play. I appreciate that advancement isn't arbitrary - it's tied to specific mechanical improvements (Skills, Proficiencies, new abilities). This makes it visible and rewarding. The Downtime system gives me specific mechanical activities to undertake between sessions, which feels satisfying as a player-focused character.

However, there are integration points that could use more concrete detail. While the book describes how to run different play modes (GMless, solo, asynchronous), it feels more aspirational than systematized. As someone who wants to understand how systems integrate, I'd want more explicit mechanical procedures for these modes. The faction system is well-structured, but I'd appreciate more concrete examples of how faction moves trigger and resolve mechanically.

The NPC and enemy creation sections feel lightweight compared to the player-facing mechanical detail. As someone trying to understand the full system, I notice GMs get more guidance about improvisation, while players get numerical frameworks. This asymmetry is fine for traditional GM-focused play, but limits understanding of the complete system.

The optional variant rules chapter is valuable, but I would have appreciated more integration guidance - which variants work together, which might conflict, and how they affect mechanical balance.

Overall, this rulebook successfully delivers what it promises: a fiction-first system with concrete mechanical backing. For a non-GM player like myself who thinks tactically and wants to understand system structure, it's excellent. The combination of narrative description with specific mechanical numbers, standardized procedures, and visible progress tracking creates a system I can plan around and improve at through play.`,
  issue_annotations: [
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless and Solo play modes described narratively but lack formalized mechanical procedures",
      impact: "Players attempting these modes will need to extrapolate procedures rather than follow explicit mechanical instruction, reducing system integrity",
      location: "GMless Cooperative Play and Solo Play subsections"
    },
    {
      section: "Chapter 24 - NPCs and VPCs and Enemies",
      issue: "NPC creation guidance emphasizes improvisation over mechanical structure, creating asymmetry with player character detail",
      impact: "As a systems integrator, I cannot fully understand the mechanical landscape when antagonist mechanics are less formally systematized than player mechanics",
      location: "NPC Creation Framework section"
    },
    {
      section: "Chapter 20 - Optional Variant Rules",
      issue: "Variant rules are presented individually without explicit compatibility matrix or mechanical interaction guidance",
      impact: "Tactical players wanting to understand option synergies must infer interactions rather than reference clear compatibility information",
      location: "Throughout variant rules descriptions"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The rules for extended checks and extended contests could benefit from more worked examples showing multiple rounds of resolution",
      impact: "Understanding how tension builds across multiple rounds requires inference; explicit numerical examples would clarify pacing",
      location: "Extended Checks and Extended Contests subsections"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Social mechanics rely heavily on Clocks and Conditions but lack explicit mechanical procedures for social influence that parallel combat's structured action types",
      impact: "Social encounters feel less mechanically concrete than combat, making it harder to plan social tactics with the same confidence as combat tactics",
      location: "Social Mechanics and Influence subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an exceptionally well-systematized game that succeeds in making fiction and mechanics work together. For players who think tactically and want concrete numerical frameworks to understand and plan around, this book delivers. The 4d6 resolution system with degrees of success, the formal Tags/Conditions/Clocks framework, and the structured Skills and Proficiencies systems all work together to create a game where mechanical choices feel meaningful and system states are visible.

The book excels at player-side mechanics and tactical structure. The clarity and readability are strong throughout the character-facing sections, and the mechanical accuracy is high. For my experience level (Early Intermediate) and cognitive style (Systems Integrator), this rulebook provides exactly the kind of structured yet narratively-grounded system I want to play.

The main limitations are asymmetries: GMless/Solo mechanics need formalization, NPC mechanics could use more systematic structure, and social mechanics could benefit from the same tactical clarity as combat. These don't prevent play - they just mean those domains require more GM improvisation.

For a non-GM player who wants to understand system mechanics deeply and make informed tactical choices during play, this is a strong recommendation. The system rewards the kind of systems-thinking I naturally apply to games, while the fiction-first framework ensures mechanical mastery doesn't overshadow the narrative experience.`
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
- **Experience:** Early Intermediate (1-3 years)
- **Playstyle:** Fiction-First Native, Systems Integrator

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
