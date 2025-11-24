/**
 * Execute reviewer prompt for persona gen-1763913096228-9d4rpjum3
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Socializer/Newbie)
 * - Archetype: Socializer
 * - Experience: Newbie (0-1 years)
 * - Fiction-First: Curious, Wary of Abstraction
 * - Cognitive Style: Visual
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
const personaId = 'gen-1763913096228-9d4rpjum3';
const personaName = 'Socializer/Newbie Visual Learner';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As someone new to tabletop RPGs who mostly plays for the social experience and connection with friends, I approached this rulebook with both excitement and some trepidation. I learn best through pictures, diagrams, and visual examples rather than walls of text, which shapes a lot of my experience with this book.

The good news first: the synthwave color scheme is gorgeous! The electric blue and hot pink headers really pop and help me find my place when flipping through. The table formatting with colored headers makes reference sections scannable. I genuinely enjoy looking at this book, which matters more than people realize when you're learning a new system.

However, as a visual learner who's new to RPGs, I found myself struggling in several places. The book is extremely text-heavy. Chapters like Character Creation and Actions, Checks, and Outcomes explain concepts thoroughly in paragraphs, but I kept wishing for flowcharts, diagrams, or illustrated examples showing "here's what a turn looks like" or "here's the step-by-step of making a Check."

The 4d6 resolution system sounds interesting, but I had to read the Margin and Outcome Tiers section multiple times to understand how it works. A simple visual showing: "Roll 4d6 -> Add Attribute -> Compare to DC -> Find Margin -> Look up Outcome" would have saved me a lot of confusion. The same goes for Tags, Conditions, and Clocks - I understand them conceptually, but I'd love to see actual play examples with visual representations of Clocks filling up.

As a Socializer, I was drawn to Chapters 11 and 13 about social play and roleplaying guidance. The negotiation and leverage section is exactly what I want to do at the table! But again, more visual examples of social Clocks in action, or maybe a diagram showing how faction standing changes, would help me internalize these concepts faster.

The fiction-first philosophy resonates with me - I don't want math puzzles, I want collaborative storytelling with my friends. But I worry that the system's many moving parts (Tags, Conditions, Clocks, Skills, Proficiencies, Attributes, Advantage/Disadvantage) might be overwhelming to track in actual play. Will I remember all this when I'm trying to have fun with my group?

The example boxes (in that nice light blue) are my favorite parts of the book. Every time I hit an example, the concepts clicked better. I just wish there were more of them, especially showing complete scenes from multiple player perspectives.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The core resolution mechanic (4d6, Margin, Outcome Tiers) is explained only in prose without visual aids",
      impact: "Visual learners and RPG newcomers may struggle to internalize the procedure without flowcharts or step-by-step diagrams",
      location: "Rolling 4d6 and Calculating Margin section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step character creation process presented as numbered list with extensive prose explanations",
      impact: "New players may feel overwhelmed; a visual character creation flowchart or filled-in example sheet would significantly help",
      location: "The Creation Flow section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "Clocks are described conceptually but no visual representation is shown of what a Clock actually looks like",
      impact: "The primary visual tracking tool in the system has no visual example in the rulebook itself",
      location: "What Clocks Are section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) lack a quick-reference visual summary",
      impact: "During actual play, new players will struggle to remember their options without a visual action card or summary diagram",
      location: "Core Combat Actions section"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Dual Clock examples are described in text but never shown visually side-by-side",
      impact: "The powerful Progress/Pressure Clock pairing concept would benefit enormously from a visual diagram showing how they interact",
      location: "Investigation and Discovery section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook has a strong foundation and a genuinely appealing visual design with its synthwave aesthetic. The fiction-first philosophy aligns well with what I want from an RPG as a Socializer - I'm here for the stories and connections, not spreadsheet optimization.

However, for someone new to RPGs who learns visually, this book is challenging. It's extremely text-heavy with minimal diagrams, flowcharts, or illustrated examples. The example boxes help tremendously, but there aren't enough of them, and they rarely show complete scenes or visual representations of mechanical concepts.

My biggest concern is whether I can actually use this at the table. The system has many interlocking pieces (Attributes, Skills, Proficiencies, Tags, Conditions, Clocks, Advantage/Disadvantage) that I understand individually but worry about tracking simultaneously. Quick-reference cards, visual summaries, or a "cheat sheet" would dramatically improve my confidence.

For experienced GMs or players who learn well from reading, this is probably an excellent rulebook. For a newbie visual learner like me, it's functional but not optimized. I'd recommend this system with the caveat that new players may need additional support materials or an experienced guide at the table.`
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

- **Archetype:** Socializer
- **Experience:** Newbie (0-1 years)
- **Fiction-First:** Curious, Wary of Abstraction
- **Cognitive Style:** Visual

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
