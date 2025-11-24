/**
 * Execute reviewer prompt for persona gen-1763913096239-uw3849432
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 189611
 * - Archetype: Tactician
 * - Experience: Newbie (0-1 years)
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Genre-Agnostic Enthusiast
 * - Cognitive Style: Intuitive
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
const personaId = 'gen-1763913096239-uw3849432';
const personaName = 'Generated Persona 189611';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `I'm relatively new to tabletop RPGs, but I'm absolutely hooked on the story-first approach, and this rulebook speaks my language! I picked it up expecting dense mechanical tables, but instead found a book that clearly prioritizes the narrative experience while still giving me the concrete numbers I need to feel confident running the game.

The way this book is structured is phenomenal for someone like me. Starting with "Welcome to the Game" immediately sold me on the philosophy - yes, I want mechanics that serve the story, not the other way around. As a Tactician (even a new one), I appreciate that I can understand the positioning system, the four-step action resolution, and how Clocks advance play. These aren't just abstract concepts; they have clear numerical anchors.

What really impressed me most is how the book respects different play styles. The "Ways to Play" chapter validates my scene-framing impulses while acknowledging that some tables want different things. I felt seen, honestly. And the skills organized by attributes make intuitive sense - I can picture how Cunning, Physiology, or Insight affects what I can attempt.

The character creation system took me maybe 20 minutes to understand, and the templates are lifesavers for players who don't want to stare at blank sheets. The advancement chapter actually makes me excited about long-term progression rather than intimidated by it. Numbers that mean something, progression that feels earned.

Combat feels manageable too. Four action types, clear positioning mechanics with specific conditions tied to positions - it's tactically interesting without needing a flowchart. I'm naturally drawn to systems with grid tactics, and while this isn't a wargame, it scratches that itch while keeping the dramatic narrative intact.

The GM sections (Chapters 21-26) are gold. They're not just reference material; they're actual guidance from people who know how tables work. The faction system with its explicit standing ladder (Hostile to Honored) gives me concrete targets to aim for. I can work toward these numbers. That matters to me as a new GM.

I do have some questions about how deep the system goes when things get complex, but the fact that the book acknowledges alternative play modes and optional rules makes me feel like there's room to grow with this system as I get more experienced.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Character creation is well-structured but the skill selection (50+ skills across attributes) could overwhelm new players despite the templates",
      impact: "New players might feel paralyzed by choice or worry they're building suboptimal characters, potentially slowing down session zero",
      location: "Step Five - Skills Selection section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While the mechanics are clear, the sheer number of condition types (Bleeding, Dazed, Vulnerable, etc.) requires active reference during gameplay",
      impact: "New GMs will need to keep the reference sheet handy, and might accidentally forget a condition's mechanical effect mid-scene",
      location: "Conditions Reference table"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Positioning system is intuitive but adding positional Tags to Conditions creates a dual tracking system that new players need to internalize",
      impact: "First few combats may feel slow as players learn that position affects what Tags are in play and thus what actions are available",
      location: "Positioning and Environment subsection"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The 4d6 resolution system is elegant, but the difficulty ladder (DC 8-15) would benefit from a quick reference showing what difficulty represents in narrative terms",
      impact: "New GMs might overthink whether a scene's challenge should be a 10 or 12, uncertain about the mechanical/narrative mapping",
      location: "Rolling and Difficulty section"
    },
    {
      section: "Chapter 14-15 - Skills System",
      issue: "Skills are organized logically by attribute, but there's no quick-reference table showing which skills are most common in practice",
      impact: "New GMs may not know which skills to emphasize or what a 'typical' skill distribution looks like for different character types",
      location: "Skills Reference by Attribute (Chapter 15)"
    }
  ],
  overall_assessment: `This rulebook is a genuine joy for someone like me - an enthusiastic newcomer who cares deeply about the story but wants mechanical clarity and concrete numbers to build confidence. The book's philosophy is lived, not just stated. Every chapter respects the narrative-first principle while providing the numerical anchors I need to GM confidently.

The organization is excellent, the guidance is practical rather than theoretical, and the acknowledgment of diverse play styles made me feel like my specific preferences (faction-based play, scene framing, some tactical positioning) were anticipated rather than afterthoughts. I felt welcomed.

For new players and new GMs with a story-first orientation, this is the perfect match. I can see myself recommending it enthusiastically to friends who want narrative games but get nervous about "too much roleplay and not enough rules." The rules are here, they're clear, and they're designed to enable stories rather than constrain them.

My only caution is that newer players will need to spend time with the reference materials - skill lists, condition effects, difficulty mappings - to feel fully fluent. But that's a minor point given how well the core concepts are explained. This is a rulebook I'll return to repeatedly, both as I run more sessions and as I introduce new players to my table. Highly recommended for anyone seeking story-first play with mechanical confidence.`
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
- **Experience:** Newbie (0-1 years)
- **Playstyle:** Evangelical (story-first), Intuitive, Scene Framer

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
