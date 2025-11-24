/**
 * Execute reviewer prompt for persona gen-1763913096241-dpiookep6
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Casual Gamer (Early Intermediate)
 * - Archetype: Casual Gamer
 * - Experience: Early Intermediate (1-3 years)
 * - Fiction-First: Skeptical, Needs Concrete Numbers
 * - GM Philosophy: GMless Advocate
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096241-dpiookep6';
const personaName = 'Casual Gamer (Early Intermediate)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As someone who plays TTRPGs casually with a few years of experience, I approached the Razorweave Core Rulebook looking for a system I could pick up quickly and run without a GM. My takeaway is mixed: the book is well-written and organized, but it requires more investment than I expected for casual play, and its GMless support feels like an afterthought.

Let me start with the positives. The book is clearly organized with good navigation. Chapters 1-5 establish the philosophy effectively, and the separation of player-facing rules (Chapters 6-13) from GM tools (Chapters 21-26) makes sense. The DC ladder (12/14/16/18/20/22) is concrete and easy to reference, which I appreciate. I need numbers I can point to when making rulings, and the ladder delivers.

The 4d6 resolution system is interesting. Rolling 4d6 and comparing to a DC with clear margin thresholds (Critical Success at +5, Full Success at 0, Partial at -1 to -2, Failure at -3 or worse) gives me the concrete numbers I crave. The Advantage/Disadvantage system (roll 5d6 or 6d6, keep best/worst 4) is intuitive once you understand it.

However, I'm skeptical of the "fiction first" philosophy. The book repeatedly says to start with the story and only reach for mechanics when outcomes are uncertain. That sounds nice in theory, but as an analytical player, I want clearer guidelines about WHEN to roll. The three conditions (Uncertainty, Consequence, Agency) help, but I found myself wanting more concrete triggers. The fiction-first approach seems to assume a confident GM who knows when to invoke mechanics, which is precisely what GMless play lacks.

Speaking of GMless play - this is where the book disappoints me most. Chapter 5 mentions GMless Cooperative Play as a supported mode, but Chapter 26 (Alternative Play) provides only high-level principles, not procedures. I was hoping for explicit turn structures, oracle tables, or scene-framing procedures baked into the core rules. Instead, the book suggests "using oracles or random tables" without providing any. For a casual player who wants to pick up and play GMless, this requires significant additional preparation or homebrew.

The Tag/Condition/Clock system is conceptually sound but adds cognitive overhead. As someone who plays casually, I worry about tracking multiple Clocks, remembering which Tags apply to the environment versus characters, and managing Conditions during play. The book distinguishes between Tags (applied to scenes/locations) and Conditions (applied to characters), but in practice, I can see this blurring during actual play. For casual groups, this could slow things down significantly.

Character creation (Chapter 6) has nine steps, which seems intimidating for a first session. While the book says you can start after reading Chapters 1-6, actually creating a character requires understanding Attributes, Skills, Proficiencies, and how they interact with Tags and Conditions. That's a lot of front-loading for casual play.

The combat chapter uses Resolve Clocks instead of hit points, which is elegant conceptually but means learning a new paradigm. The four combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) are clear, but understanding how they interact with positioning Tags and environmental Tags requires careful reading.

Overall, Razorweave is a thoughtfully designed system that would work well for groups with an experienced GM who can adjudicate the fiction-first approach. For casual GMless play with players who want concrete numbers and explicit procedures, it requires more work than I'd hoped. The foundation is solid, but I'd need to develop house rules and procedures to run this GMless with my group.`,
  issue_annotations: [
    {
      section: "Chapter 5 & 26 - GMless Play Support",
      issue: "GMless play is mentioned as supported but lacks concrete procedures, oracle tables, or explicit turn structures",
      impact: "Casual players seeking GMless play must homebrew procedures or source external oracle tools, increasing prep burden significantly",
      location: "Chapter 5 'GMless Cooperative Play' subsection and Chapter 26 'GMless Procedures'"
    },
    {
      section: "Chapter 8 - When to Roll",
      issue: "The three conditions for rolling (Uncertainty, Consequence, Agency) are abstract and rely on GM judgment",
      impact: "Players who prefer concrete triggers will struggle to know when to invoke mechanics, especially in GMless play where no single authority makes that call",
      location: "When to Roll (and When Not To) section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step character creation process is thorough but front-loads significant decisions",
      impact: "Casual players may feel overwhelmed at session zero; the process assumes familiarity with Skills, Proficiencies, and how they integrate with the resolution system",
      location: "Character Creation Flow steps"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The distinction between Tags (scenes/locations) and Conditions (characters) is clear in isolation but creates tracking overhead",
      impact: "Casual groups may struggle to consistently apply the right mechanic to the right target, especially in fast-paced scenes or GMless play",
      location: "Tags vs Conditions definitions and usage examples"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks replace hit points, requiring players to learn a new paradigm even if they have D&D experience",
      impact: "Early intermediate players coming from traditional systems will need to unlearn HP tracking; the book could better scaffold this transition",
      location: "Resolve Instead of Hit Points section"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a well-organized system with a clear resolution engine (4d6 vs DC with concrete thresholds) that appeals to my analytical side. However, its fiction-first philosophy and GM-centric design create friction for casual players seeking explicit procedures, especially for GMless play. The book acknowledges multiple play modes but doesn't deliver dedicated mechanical support for them. For experienced GMs running traditional group play, this is a solid choice. For casual players like me who want concrete numbers, clear triggers, and out-of-the-box GMless support, Razorweave requires significant additional investment. The system has strong foundations but needs supplementary materials or house rules to fulfill its promise of flexible play modes. Rated cautiously for my use case.`
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

- **Archetype:** Casual Gamer
- **Experience:** Early Intermediate (1-3 years)
- **Fiction-First Stance:** Skeptical, Needs Concrete Numbers
- **GM Philosophy:** GMless Advocate
- **Cognitive Style:** Analytical

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
