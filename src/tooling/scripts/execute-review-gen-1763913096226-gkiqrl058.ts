/**
 * Execute reviewer prompt for persona gen-1763913096226-gkiqrl058
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Achiever/Early Intermediate)
 * - Archetype: Achiever
 * - Experience: Early Intermediate (1-3 years)
 * - Fiction-First: Skeptical
 * - GM Philosophy: Prepared Sandbox
 * - Cognitive Style: Simplicity Seeker
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
const personaId = 'gen-1763913096226-gkiqrl058';
const personaName = 'Generated Persona (Achiever/Early Intermediate)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 6
  },
  narrative_feedback: `As an early intermediate player with about two years of tabletop experience under my belt, I approach rulebooks looking for clear instructions and achievable milestones. The Razorweave Core Rulebook has some genuinely good qualities, but it also presents challenges for someone like me who prefers simplicity and wants to see tangible progress during play.

The book's organization is solid. I appreciate that it tells you upfront that you can start playing after reading Chapters 1-6. That's helpful guidance for someone who doesn't want to read 300 pages before rolling dice. The progression from foundational concepts through character creation makes logical sense, and the table of contents with its clear part divisions helps me find what I need.

However, I remain skeptical of the "fiction-first" philosophy the book keeps emphasizing. In my experience, groups need clear rules to fall back on when disagreements happen. The book says things like "mechanics never replace the shared imagination" and "if no risk exists, the GM simply narrates the outcome." But what happens when players disagree about whether risk exists? What if my GM and I have different ideas about what "meaningful uncertainty" looks like? The book seems to assume a level of table harmony that doesn't always exist in real play.

The 4d6 resolution system is interesting but introduces complexity I didn't expect. Rolling 4d6, then potentially 5d6 or 6d6 for Advantage/Disadvantage, keeping best or worst 4, comparing to a DC, then calculating margin to determine outcome tier (critical success, full success, partial success, failure, critical failure) - that's a lot of steps. I was hoping for something more streamlined. The margin system especially feels like an extra layer of math that slows things down.

As an Achiever, I want clear progression paths and tangible rewards. The character advancement section is deferred to later chapters, and the preview feels vague - "Attributes grow slowly across a campaign as characters reach important milestones." What milestones? How slowly? I want to know what I'm working toward. The lack of a clear advancement track frustrates me.

The Tags, Conditions, and Clocks system is where I struggle most. The book introduces three different tracking mechanisms that all interact with each other:
- Tags on locations and scenes
- Conditions on characters
- Clocks with variable segment counts

For a simplicity seeker, this feels like too much to track. The GM Guidance box says "start small" and "add more only when they clarify," but that requires judgment calls that newer GMs might not feel confident making.

What I do appreciate is the concrete DC ladder (12-22 in increments of 2). That's simple enough. I also like the clear list of core combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) - that gives me options without overwhelming me. The character creation steps are numbered and sequential, which appeals to my preference for structure.

The Resolve Clock system replacing hit points is clever conceptually but adds unpredictability. With hit points, I know exactly how much damage I can take. With Clocks, the GM decides how many segments based on... the fiction? The stakes? That feels arbitrary. As a player who likes measurable progress, I want to know my limits more precisely.

I'm also concerned about the "prepared sandbox" support. The book mentions faction systems and fronts in later chapters, but the core rules here don't give me enough tools to feel prepared. I want checklists and templates, not philosophical guidance about "honest world presentation."

Overall, this rulebook has ambition and good ideas. The writing is clear and the examples help illustrate concepts. But for someone still developing GM and player skills who wants straightforward systems with clear advancement, the layers of Tags/Conditions/Clocks and the fiction-first philosophy create more uncertainty than I'm comfortable with. I could run this game, but I'd need to simplify it significantly.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The margin-based outcome system adds unnecessary calculation steps",
      impact: "Players must roll 4d6, add modifiers, subtract DC, then consult a margin table for outcome tier - this slows gameplay and creates opportunities for math errors",
      location: "Rolling 4d6 and Calculating Margin section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Three separate tracking systems create cognitive overload for simplicity-seeking players and GMs",
      impact: "Managing environmental Tags, character Conditions, AND segment-based Clocks simultaneously requires tracking multiple states across different entities",
      location: "What Tags Do, What Conditions Do, and What Clocks Are sections"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks replace hit points but introduce subjective GM decision-making about Clock size",
      impact: "Achiever-type players lose the measurable, predictable health tracking they're accustomed to; creates anxiety about unknown character limits",
      location: "Resolve Instead of Hit Points section"
    },
    {
      section: "Chapter 4 - Core Principles of Play",
      issue: "Fiction-first philosophy assumes table consensus that may not exist",
      impact: "Skeptical players will question who decides when uncertainty exists, what counts as meaningful consequence, and how to resolve interpretation disputes",
      location: "Fiction First, Mechanics Second section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step creation process is thorough but front-loads extensive narrative work before mechanical choices",
      impact: "Early intermediate players who learn through mechanics may struggle with abstract concept-definition steps before seeing how systems work",
      location: "The Creation Flow section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a competent, well-written system that will appeal to tables comfortable with narrative-heavy games and GM interpretation. However, for an Achiever archetype with early intermediate experience who seeks simplicity and clear progression, the system presents genuine challenges. The triple-tracking of Tags/Conditions/Clocks, the margin-based outcome calculation, and the fiction-first philosophy all add layers that work against straightforward play. The book provides helpful structure in some areas (numbered character creation steps, clear DC ladder, defined combat actions) but undermines that structure elsewhere with calls for GM judgment and table consensus. For my playstyle, I would need significant house rules to simplify tracking and create clearer advancement milestones. The system shows thoughtful design but doesn't align well with my preferences for measurable progress and predictable mechanics. Rating it moderately positive for overall quality but noting a meaningful gap in persona fit.`
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
- **Experience:** Early Intermediate (1-3 years)
- **Fiction-First Stance:** Skeptical
- **GM Philosophy:** Prepared Sandbox
- **Cognitive Style:** Simplicity Seeker

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
