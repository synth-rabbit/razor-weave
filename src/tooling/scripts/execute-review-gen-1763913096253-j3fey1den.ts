/**
 * Execute reviewer prompt for persona gen-1763913096253-j3fey1den
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona - Method Actor
 * - Archetype: Method Actor
 * - Experience: Long-term GM
 * - Fiction-First: Native
 * - Narrative/Mechanics: Wary of Abstraction
 * - GM Philosophy: Scene Framer
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096253-j3fey1den';
const personaName = 'Generated Persona - Method Actor';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `As a Method Actor GM with deep roots in fiction-first play and scene framing, this rulebook speaks my language in ways few systems manage. The Razorweave Core Rulebook feels like it was written by someone who understands that the best moments at the table emerge from inhabiting characters fully, not from optimizing mechanical outputs.

What strikes me immediately is the system's commitment to "fiction first" as an actual philosophy rather than marketing copy. The repeated emphasis on starting with the story, describing what characters do, and only then reaching for mechanics reflects how I've run games for years. Chapter 2's declaration that "you do not start with a rule and then try to force the fiction to match it" is a manifesto I can rally behind.

The character creation process in Chapter 6 earns high marks for its emphasis on concept, identity elements, and narrative grounding before any numbers appear. The nine-step flow from concept through Core Identity Elements to Goals, Drives, and Personal Threads reflects the kind of character development I value: building people first, sheets second. The example character Rella demonstrates this beautifully - she emerges as a person with history, relationships, and unresolved threads before her Attributes are ever assigned.

As a Scene Framer, I'm particularly drawn to Chapter 10's treatment of combat. The system's rejection of hit points in favor of Resolve Clocks and Conditions aligns perfectly with my approach. I don't want to track arbitrary numbers depleting; I want to narrate when a character becomes desperate, when they falter, when they finally break. The explicit acknowledgment that "a VPC might quit the field when they are cornered, not only at '0 HP'" captures exactly how I think about dramatic moments.

The Tags, Conditions, and Clocks framework (Chapter 9) provides the kind of structured improvisation tools I crave. Tags like "Dim Light," "Tense," or "Suspicious" give me vocabulary to communicate scene texture quickly. Conditions provide lasting fictional consequences that travel with characters. Clocks visualize tension and progress in ways that keep all players engaged with stakes.

However, as someone wary of mechanical abstraction, I have concerns about the cognitive load during actual play. The interplay between Tags, Conditions, Clocks, Advantage/Disadvantage, DCs, and the 4d6 resolution system creates many moving parts. While each element is elegant in isolation, I worry about tracking them all during fast-paced scenes. As a Systems Integrator, I can see how they connect, but I'm not certain every table will achieve the same synthesis without significant practice.

Chapter 11's treatment of exploration and social play excels. The paired Clocks approach (Progress + Pressure) for investigation creates natural dramatic tension without forcing artificial combat structures onto non-combat scenes. The negotiation guidance in particular - identifying leverage, framing offers in terms of NPC goals, using Clocks for complex deals - gives GMs concrete tools for scenes that often feel underdeveloped in other systems.

The GM section (Chapters 21-26) provides substantial support for my style of play. The faction standing ladder from Hostile to Honored creates clear mechanical hooks for relationship tracking without reducing everything to numbers. The guidance on scene framing and pacing respects GM authority while providing enough structure to keep sessions focused.

Where the book falls slightly short for me is in the alternative play modes. While Chapter 5 claims support for GMless and solo play, the actual mechanical support feels thin. As a fiction-first GM, I know how much invisible work goes into making scenes flow - and I'm not convinced the procedures described would enable the same quality of play without a dedicated GM.

Overall, this is a rulebook I could see myself running for years. It respects the craft of GMing, prioritizes character over mechanics, and provides tools that enhance rather than constrain scene framing. The practical usability score reflects my concern about cognitive load, but with a committed group, this system could sing.`,
  issue_annotations: [
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The layered interaction between Tags (scene), Conditions (character), and Clocks (progress/threat) creates potential tracking overhead during complex scenes",
      impact: "Scene framing GMs may find themselves managing too many mechanical elements simultaneously, which could slow pacing and reduce immersion",
      location: "Using Tags and Conditions with Checks, Combining Tags, Conditions, and Clocks sections"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The Resolve Clock system, while narratively elegant, lacks clear guidance on scaling for different threat levels and scene types",
      impact: "GMs may struggle to calibrate appropriate Clock sizes for varied opponents, leading to inconsistent pacing across different combat encounters",
      location: "Resolve Instead of Hit Points, Example - Enemy Resolve sections"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless and solo play modes are described aspirationally rather than with concrete procedural support",
      impact: "Groups attempting these modes will need to develop significant house procedures, which undermines the book's otherwise comprehensive approach",
      location: "GMless Cooperative Play, Solo Play subsections"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step creation process, while thorough, may overwhelm players unfamiliar with fiction-first approaches",
      impact: "Session zero could become lengthy as players work through narrative-heavy steps without clear examples of acceptable scope for each element",
      location: "The Creation Flow, Steps One through Nine"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "The dual-Clock investigation model (Progress + Pressure) requires significant pre-planning that may conflict with improvisational GM styles",
      impact: "Scene-framing GMs who prefer to discover situations at the table may find the Clock preparation requirements burdensome",
      location: "Investigation and Discovery, Structuring Scenes with Clocks sections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a genuinely fiction-first system that earns that designation through design rather than just rhetoric. For Method Actor GMs who prioritize character inhabitation, scene framing, and narrative emergence over mechanical optimization, this is one of the most thoughtfully designed systems available. The Resolve Clock combat system, the Tag/Condition vocabulary, and the emphasis on character goals and relationships all support the kind of play I value most.

The system succeeds as an integrated whole - Tags, Conditions, Clocks, and Checks form a coherent toolkit where each element reinforces the others. The GM guidance is substantial and respectful of the craft. The character creation process builds people first and sheets second.

My reservations center on practical usability during actual play. The cognitive load of tracking multiple mechanical layers simultaneously may require experienced groups or significant table discipline. The alternative play modes feel underdeveloped. And some GMs may find the Clock preparation requirements conflict with improvisational preferences.

For tables that share my philosophy - fiction first, character-driven, narratively emergent - this is an excellent system. I would run it immediately and expect it to become a long-term campaign choice. For tables less familiar with fiction-first approaches, I'd recommend starting with simplified procedures and adding complexity as the group internalizes the core principles.`
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

- **Archetype:** Method Actor
- **Experience:** Long-term GM
- **Fiction-First:** Native
- **Narrative/Mechanics:** Wary of Abstraction
- **GM Philosophy:** Scene Framer
- **Cognitive Style:** Systems Integrator

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
