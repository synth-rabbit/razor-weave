/**
 * Execute reviewer prompt for persona gen-1763913096217-prwd9cu1k
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 814943
 * - Archetype: Achiever
 * - Experience: Long-term GM
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Prefers Focused Systems
 * - Cognitive Style: Complexity Tolerant
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
const personaId = 'gen-1763913096217-prwd9cu1k';
const personaName = 'Generated Persona 814943';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As a long-term GM who has run countless systems, I approach this rulebook with a critical eye honed by years of practical table experience. The Razorweave Core Rulebook presents a compelling fiction-first framework, though I find myself both impressed and occasionally frustrated by its design choices.

The book's organization is exemplary. The progression from foundational concepts through character creation to combat and social mechanics follows a logical flow that respects the reader's time. I appreciate that Chapters 1-5 establish the philosophical foundation before diving into crunch - this is how rulebooks should be written.

However, as someone who leans toward narrative purity, I notice some tension between the book's fiction-first claims and its actual mechanical weight. The system claims to put story first, but the extensive Skills, Proficiencies, Tags, and Conditions reference sections suggest a heavier mechanical footprint than I prefer. The 4d6 resolution system is elegant enough, but the proliferation of tracking mechanisms (Clocks, Conditions, Tags) feels like it could bog down the narrative flow at actual tables.

The combat chapter is well-structured with clear action types (Strike, Maneuver, Set Up, Defend/Withdraw), but I worry about how scene framing will work in practice when players need to juggle positioning Tags, environmental Tags, Conditions, and multiple Clocks simultaneously. As a Scene Framer, I value systems that get out of my way - this one asks for significant cognitive load.

What works brilliantly is the GM guidance material. Chapters 21-26 provide substantial support for running sessions and campaigns. The faction system with its standing ladder (Hostile to Honored) is intuitive and gameable. The downtime and advancement overview strikes a good balance between structure and flexibility.

The book's acknowledgment of multiple play modes (group, duet, GMless, solo, asynchronous) is admirable and shows thoughtful design consideration. However, I question whether the core mechanics truly flex to support all these modes equally well, or if this is aspirational rather than tested.

Overall, this is a competent, well-written rulebook with genuine innovations. My reservations stem from a personal preference for even lighter mechanical touch and some skepticism about whether the fiction-first philosophy is fully realized in practice. I would run this system, but I'd expect to drift it toward simpler resolution during actual play.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step character creation process, while thorough, may be overwhelming for new players at a first session",
      impact: "Could slow down session zero significantly and front-load too much decision-making before players understand the system",
      location: "Step One through Step Nine in Character Creation Flow"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The interaction between Tags, Conditions, Clocks, and action types creates significant cognitive overhead",
      impact: "Scene framing becomes mechanically dense, potentially slowing combat pacing and pulling focus from narrative description",
      location: "Positioning and Environment, Conditions in Combat sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The distinction between Tags (applied to scenes/locations) and Conditions (applied to characters) is clear in theory but may blur in practice",
      impact: "GMs may struggle to consistently apply the right mechanic to the right target during fast-paced scenes",
      location: "Core Concepts section defining Tags vs Conditions"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Claims of supporting GMless and solo play feel aspirational without dedicated mechanical support",
      impact: "Groups attempting these modes may find themselves improvising significant house rules or procedures",
      location: "GMless Cooperative Play and Solo Play subsections"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Heavy reliance on paired Clocks (Progress + Pressure) for non-combat scenes adds prep burden",
      impact: "Improvisational GMs may find the system demands more pre-scene planning than they prefer",
      location: "Investigation and Discovery, Structuring Scenes with Clocks"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a solid, well-organized system that will appeal to tables seeking a middle ground between narrative games and traditional RPGs. Its fiction-first philosophy is genuine but tempered by substantial mechanical infrastructure. For long-term GMs who enjoy complexity, the system offers rich tools for campaign play, faction management, and character advancement. However, narrative purists may find the Tag/Condition/Clock triad adds more bookkeeping than they want between them and their stories. The book succeeds as reference material and provides excellent GM support, but achieving true fiction-first flow will require practice and likely some drift. Recommended with caveats for tables that enjoy moderate crunch with narrative aspirations.`
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

- **Archetype:** Achiever
- **Experience:** Long-term GM
- **Playstyle:** Skeptical, Complexity Tolerant

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
