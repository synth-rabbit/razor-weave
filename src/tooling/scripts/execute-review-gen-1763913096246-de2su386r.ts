/**
 * Execute reviewer prompt for persona gen-1763913096246-de2su386r
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 336809
 * - Archetype: Power Gamer
 * - Experience: Newbie (0-1 years)
 * - Fiction-First: Native
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Prepared Sandbox
 * - Genre Flexibility: Prefers Focused Systems
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096246-de2su386r';
const personaName = 'Generated Persona 336809';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 9
  },
  narrative_feedback: `As a new player diving into tabletop RPGs, I'm absolutely loving how this rulebook is structured. The Razorweave system speaks directly to someone like me who wants to understand the mechanics deeply and find the optimal way to play.

What makes this rulebook shine for a power gamer is the clarity of the mechanical architecture. The 4d6 resolution system is straightforward - I can calculate probabilities and understand how my choices impact success. The explicit Numbers matter: DC tiers are clearly defined, action types have specific mechanical effects, and the advancement system provides concrete progression paths. This is exactly what I need to understand the game's underlying systems.

Chapter 14-15 (Skills System and Reference) is phenomenal. As someone pattern-driven, I love how skills are organized by attribute and presented systematically. I can instantly see which skills synergize, understand attribute interactions, and plan my character development strategically. The Proficiencies system in Chapters 16-17 is equally clear - I can see exactly what benefits I gain and how to optimize my loadout.

The Clocks and Conditions system initially seemed abstract, but once I saw the examples, the pattern became obvious: Clocks track progress toward dramatic moments, Conditions modify your capabilities. That's elegant and mechanical - I can predict how they'll interact. Tags follow the same logical pattern for environment and scene state. This systematic approach to tracking game state feels natural to my pattern-driven thinking.

Character creation (Chapter 6) is approachable for a newbie. While there are multiple steps, each one has clear options with concrete effects I can understand. I appreciated working through the process - it helped me grasp how the system's pieces fit together. The ability to understand each choice's mechanical impact is crucial for my learning style.

What really works is how the system supports sandbox play. Chapter 21 (Running Sessions) gives concrete procedures for improvisation, and the faction standing system (Chapter 25) provides quantifiable progression that feels like optimization potential. As a power gamer, I want to know how my decisions move the needle - this system lets me see that.

The combat chapter is clear and mechanical without being bloated. Action types (Strike, Maneuver, Set Up, Defend/Withdraw) are distinct, positioning works logically, and I can see the tactical space. Environmental Tags create interesting positioning puzzles without drowning in subsystems.

One thing that strengthens my confidence: the acknowledgment of multiple play styles in Chapter 5 shows the designers understand different player motivations. They're not forcing narrative purity; they're giving me tools to engage the way I want to play.

My only small concern is that some advanced mechanics (like combined Clock usage for complex scenarios) could use a bit more worked example, but the pattern is consistent enough that I can extrapolate.

This rulebook respects my intelligence, gives me concrete systems to master, and supports the prepared sandbox style where I can set up interesting challenges and watch how players optimize their approach. For a newbie power gamer, this is incredibly satisfying.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The section on opposing rolls and relative success could benefit from a probability table showing odds at various DC tiers",
      impact: "While the system is clear, power gamers optimizing character builds would benefit from explicit win percentages to make informed decisions",
      location: "Opposed Checks and Relative Success subsection"
    },
    {
      section: "Chapter 14-15 - Skills System Reference",
      issue: "No explicit synergy matrix showing which skill combinations create mechanical advantages",
      impact: "Power gamers must infer synergies rather than having optimization paths explicitly laid out",
      location: "Between Skills Reference and Proficiencies System chapters"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Step selection process (particularly Proficiency selection) lacks explicit mechanical comparison between options",
      impact: "Newbie power gamers must reference multiple chapters to understand the impact of choosing one Proficiency over another",
      location: "Step Seven: Choose Proficiencies section"
    },
    {
      section: "Chapter 19 - Advancement and Long-Term Growth",
      issue: "Missing concrete examples of character progression arcs from Level 1 to higher levels with mechanical power scaling shown",
      impact: "Difficult for newbie power gamers to visualize long-term optimization strategy and viable character builds",
      location: "Advancement Paths and Character Growth Strategy"
    },
    {
      section: "Chapter 21 - Running Sessions",
      issue: "GM procedures for handling player optimization attempts and rules disputes lack explicit guidance",
      impact: "Prepared GMs need clearer procedures for when power gamers find edge cases in the mechanics",
      location: "GM Authority and Rulings section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exceptional for power gamers at any experience level, particularly newbies hungry to understand how systems work. The mechanical clarity is outstanding - systems are well-organized, patterns are consistent, and mechanical effects are explicit. The book succeeds brilliantly at making the underlying architecture transparent and learnable.

For prepared sandbox GMs, the toolkit is superb: faction mechanics, Clocks, and environmental Tags provide quantifiable progression and complexity. Character advancement has clear paths and is deeply understandable. The skill and proficiency systems have satisfying optimization depth without overwhelming new players.

If I had to improve it, I'd add probability tables and optimization examples to help power gamers make informed character choices, and I'd include explicit synergy guidance between game systems. That said, the patterns are consistent enough that motivated players can figure this out.

This is the rulebook a newbie power gamer should study to learn tabletop RPGs - it respects your intelligence, shows you exactly how systems work, and gives you sandbox space to apply that knowledge strategically. Highly recommended for anyone wanting to truly master their system before sitting down at the table.`
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
- **Experience:** Newbie (0-1 years)
- **Playstyle:** Pattern-Driven, Needs Concrete Numbers

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
