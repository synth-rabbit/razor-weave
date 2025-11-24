/**
 * Execute reviewer prompt for persona gen-1763913096216-obqhtpz6f
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 125214
 * - Archetype: Power Gamer
 * - Experience: Long-term GM
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Comfortable with Abstraction
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Neutral
 * - Cognitive Style: Verbal
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
const personaId = 'gen-1763913096216-obqhtpz6f';
const personaName = 'Generated Persona 125214';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 9
  },
  narrative_feedback: `As an evangelical fiction-first GM with years of experience under my belt, I approach every new rulebook with an eye toward how it serves storytelling at the table. The Razorweave Core Rulebook doesn't just talk the talk on fiction-first design—it walks the walk in ways that genuinely excite me.

What strikes me most is the elegant integration of mechanics into narrative flow. The book's commitment to putting fiction first isn't window dressing; it's baked into how every system works. The 4d6 resolution mechanic feels natural and intuitive, giving players meaningful choices while keeping the narrative pace moving. I love that the outcome scales (Triumph, Success, Partial, Failure) directly map to story beats rather than forcing awkward mechanical translations.

Chapters 6, 8, 9, and 10 represent the real innovation here. The DC tables with worked examples are a game-changer for practical play. As someone who runs scenes verbally and thematically rather than mechanically, I appreciate having clear reference points that don't derail the fiction. The Quick Reference sections are exactly what I need at the table—accessible without requiring mechanical fluency.

The expansion of Tags, Conditions, and Clocks in Chapter 9 shows thoughtful design. Rather than creating rigid tracking systems, these tools feel like collaborative narrative instruments. Tags on scenes become part of the storytelling, not bookkeeping. The Clocks system brilliantly bridges the gap between narrative urgency and mechanical resolution.

Character creation in Chapter 6 strikes that perfect balance I've always wanted: thorough enough to create meaningful characters, streamlined enough to not bog down the first session. The step-by-step approach respects both new and experienced players.

The combat chapter (10) could have been dry mechanics, but instead it becomes a framework for describing dynamic action. The action types (Strike, Maneuver, Set Up, Defend/Withdraw) encourage describing what's happening narratively before resolving mechanically. The positioning system using Tags creates environmental storytelling that feels natural.

What really won me over is Chapter 21-26 on running sessions and campaigns. This is GM support material that actually supports GMs in the way they think and work. The faction system with its standing ladder is intuitive and immediately usable. The scenario design guidance respects the GM's role as storyteller while providing enough structure to keep things organized.

The acknowledgment of multiple play modes shows philosophical maturity. Single and small group play receive equal consideration to traditional table play, which tells me the designers understand that role-playing happens in diverse contexts.

This is the rulebook I've been hoping for—one that takes mechanics seriously enough to make them useful while keeping the focus where it belongs: on the stories we tell together.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The Partial Success outcome can create narrative ambiguity about how fictional consequences manifest",
      impact: "GMs comfortable with abstraction will love it, but less experienced facilitators might need guidance on translating mechanical partial successes into concrete fiction",
      location: "Outcomes and Consequences section - specifically the Partial Success example"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The interaction between Strike actions and Conditions requires careful frame-by-frame narration to avoid confusion about who's affected",
      impact: "In fast-paced verbal narration, GMs might accidentally apply Conditions to the wrong target or forget to narrate the mechanical consequence",
      location: "Positioning and Tactical Options, Conditions in Combat subsection"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While elegant, the three-system design (Tags/Conditions/Clocks) requires GMs to think in three parallel tracks simultaneously",
      impact: "Scene framing becomes cognitively taxing when managing multiple environmental Tags, character Conditions, and scene Clocks in high-tension moments",
      location: "Core Concepts and Examples throughout the chapter"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Step Four (Determine Attributes) offers significant mechanical complexity with linked progression systems",
      impact: "Players new to mechanically-informed character choices may feel overwhelmed despite the fiction-first framing",
      location: "Attribute Assignment and Progression Flow"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a masterclass in fiction-first game design that actually delivers on its promises. For GMs who think narratively and thematically, this system feels like it was written for you. The DC tables with worked examples in modified Chapters 6, 8, 9, and 10 are tremendously practical—they give you the mechanical support you need without interrupting the flow of storytelling.

The book succeeds on multiple levels: as reference material, as guidance for running games, and as a design document that respects both fiction and mechanics. The faction system, scenario design guidance, and GM support material demonstrate that the authors understand how actual play works.

My only reservation is that less experienced GMs might need additional support navigating the three-system approach (Tags/Conditions/Clocks) in real-time, but for those of us who have run games for years, this system feels purpose-built for the way we think and play.

Strongly recommended for tables seeking genuine fiction-first mechanics with mechanical depth. This rulebook sets a new standard for how to integrate narrative and mechanics without compromising either.`
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
- **Playstyle:** Evangelical, Fiction-First, Scene Framer
- **Cognitive Style:** Verbal, Pattern-Driven

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
