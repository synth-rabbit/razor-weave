/**
 * Execute reviewer prompt for persona gen-1763913096235-rwgpl9wue
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona rwgpl9wue
 * - Archetype: Socializer
 * - Experience: Long-term GM
 * - Fiction-First: Skeptical, Needs Concrete Numbers
 * - GM Philosophy: Railroad Conductor
 * - Cognitive Style: Pattern-Driven
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
const personaId = 'gen-1763913096235-rwgpl9wue';
const personaName = 'Generated Persona rwgpl9wue';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As a long-term GM who values social interaction at the table and prefers structured, predictable game flow, I approach this rulebook with significant concerns about its usability for my playstyle. Let me be direct: the Razorweave Core Rulebook has admirable ambitions, but its fiction-first philosophy creates friction points that will frustrate GMs who need concrete numbers and clear, predictable outcomes.

The book's strongest asset is its organizational structure. The progression from welcome materials through character creation to gameplay mechanics follows a logical pattern I can work with. The DC ladder (Easy 12, Routine 14, Tough 16, Hard 18, Heroic 20, Legendary 22) provides the kind of concrete benchmark I crave - this is exactly what I need to run consistent sessions.

However, the 4d6 resolution system with its margin-based outcome tiers concerns me. The spread between Critical Success (+5), Full Success (0), Partial Success (-1 to -2), Failure (-3), and Critical Failure (-7 or all 1s) creates a swingy probability space that makes it difficult to predict session pacing. When I run games, I need to know approximately how long encounters will take and what the likely outcomes are. This system's emphasis on "let the fiction decide" leaves too much undefined.

The Advantage/Disadvantage system (rolling 5d6 or 6d6 and keeping best/worst 4) is elegant mathematically, but the text is frustratingly vague about when exactly these modifiers apply. It tells me Tags and Conditions "typically" grant Advantage or Disadvantage, but rarely provides explicit triggers. As a pattern-driven thinker, I need clear rules like "Dim Light always grants Disadvantage on ranged attacks beyond 30 feet" - not guidance that says "may impose Disadvantage."

The social interaction framework will serve my Socializer archetype well once I establish house rules. The negotiation mechanics with Progress and Pressure Clocks give me tools to structure social encounters, which I appreciate. However, the book spends too much time on philosophy ("respect player ownership," "trust at the table") and not enough on concrete procedures for handling common social situations.

For my Railroad Conductor approach, this system presents challenges. The fiction-first philosophy explicitly pushes against pre-planned outcomes, which conflicts with how I prefer to run games. The text repeatedly emphasizes that "failure creates momentum" and "the world responds to character action" - philosophies that sound great in theory but make it harder to deliver consistent narrative experiences across sessions.

The combat chapter's Resolve Clock system is interesting but lacks the precision I need. How many segments should a standard enemy have? The answer "2-3 for quick threats, more for major foes" is too vague. I need a clear formula: Level X enemy has Y segments, takes Z damage per successful Strike. Without these patterns, session prep becomes guesswork.

What I do appreciate is the extensive GM guidance in Part III. Chapter 21's session structure (Strong Opening, Middle Situations, Closing Beat) provides the framework I need. The between-session prep guidance and the advice on running different scene types shows the authors understand practical GM needs - they just don't always deliver concrete enough procedures.

The Proficiencies system is well-conceived for social play. Having characters with Community Organizing, Court Etiquette, or Neighborhood Fixer proficiencies gives me hooks for social encounters. The detailed examples of how each Proficiency functions in play are among the book's best content.

Overall, this rulebook will require significant house-ruling to fit my style. I'll need to create explicit conversion tables, define concrete Tag triggers, and establish firm procedures where the book provides suggestions. The foundation is solid, but the fiction-first overlay obscures the mechanical clarity I need for effective session planning.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Outcome tiers are defined but frequency guidance is missing - no probability tables or expected success rates",
      impact: "GMs cannot accurately predict how many checks will succeed per session, making pacing difficult to plan",
      location: "Rolling 4d6 and Calculating Margin, Interpreting Outcomes sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Tag effects described as 'typically' or 'may' grant modifiers without explicit mechanical triggers",
      impact: "Inconsistent rulings at the table; different GMs will apply the same Tags differently",
      location: "What Tags Do, Common Tag Categories, Using Tags and Conditions with Checks"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock segment guidelines are too vague ('2-3 for quick threats, more for major foes')",
      impact: "No consistent framework for scaling enemy difficulty; session prep requires extensive GM judgment calls",
      location: "Resolve Instead of Hit Points, Why Clocks and Not Hit Points sections"
    },
    {
      section: "Chapter 4 - Core Principles of Play",
      issue: "Heavy emphasis on 'fiction first' philosophy actively discourages structured play approaches",
      impact: "GMs who prefer planned narratives may feel their style is invalidated by the design philosophy",
      location: "Fiction First Mechanics Second, Failure Creates Momentum, The World Responds sections"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Social mechanics rely heavily on GM interpretation with few concrete procedures",
      impact: "Socializer archetype players lack clear rules for how their character's social abilities function",
      location: "Social Interaction, Negotiation and Leverage, Deception and Reading People"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Attribute spread (2,1,1,0) and Skill selection lack concrete guidance on expected capability levels",
      impact: "Players cannot reliably assess whether their character will succeed at tasks they envision",
      location: "Step Three Assign Attributes, Step Four Choose Skills"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook presents a competent fiction-first system that will frustrate GMs seeking concrete, predictable mechanics. Its strengths lie in organization, GM guidance material, and the Proficiencies system for social play. However, the persistent use of vague language ("typically," "may," "usually") where precise rules should appear, combined with an explicit philosophy that pushes against structured play, makes this system poorly suited for pattern-driven GMs who need reliable numbers.

For Socializer archetypes, the relationship and reputation mechanics offer useful tools, but require house-ruling to function predictably. For Railroad Conductors, the fiction-first philosophy is actively hostile to preferred play patterns. The book would benefit enormously from appendices providing: probability tables for the 4d6 system, explicit Tag trigger rules, enemy scaling formulas, and structured procedures for common situations.

I can run this system, but only with significant prep work to establish the concrete benchmarks it refuses to provide. Rated cautiously for tables that share my need for predictable, structured play.`
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
- **Experience:** Long-term GM
- **Fiction-First Stance:** Skeptical, Needs Concrete Numbers
- **GM Philosophy:** Railroad Conductor
- **Cognitive Style:** Pattern-Driven

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
