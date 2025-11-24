/**
 * Execute reviewer prompt for persona gen-1763913096250-ghnbdf58i
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Casual Gamer/Long-term GM)
 * - Archetype: Casual Gamer
 * - Experience: Long-term GM
 * - Fiction-First: Native
 * - Narrative/Mechanics: Neutral on mechanics
 * - GM Philosophy: World Simulator
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
const personaId = 'gen-1763913096250-ghnbdf58i';
const personaName = 'Casual Gamer / Long-term GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `As someone who has been running games casually for many years, I approach any new system with one key question: can I pick this up and run it without extensive prep? The Razorweave Core Rulebook largely answers that question positively, though with some caveats that matter for my style of play.

What immediately resonates with me is the fiction-first philosophy. The book repeatedly emphasizes that the story comes first, mechanics second - this is exactly how I run my tables. The principle that "you do not start with a rule and then try to force the fiction to match it" (Chapter 3) reflects my natural GMing instinct. When my players describe what they want to do, I want the rules to support that moment, not constrain it.

The 4d6 resolution system with outcome tiers (Critical Success, Full Success, Partial Success, Failure, Critical Failure) is elegant in concept. The margin-based outcomes mean I can quickly interpret results without consulting tables mid-scene. As a World Simulator GM, I appreciate that partial success is baked into the core mechanic - the world can respond with nuance rather than binary pass/fail.

Character creation is well-structured but longer than I typically want for a casual session zero. Nine steps feels comprehensive for players who enjoy building characters, but for my groups who often want to jump into play quickly, I would likely streamline this. The example character (Rella, the telegraph engineer) demonstrates the process well and gives me a template to follow.

The open Skills and Proficiencies system is both a strength and a potential complexity trap. I love that players can define custom abilities that fit their concepts, but as someone seeking simplicity, I worry about decision paralysis during character creation. The GM approval requirement helps, but it puts more work on my plate during what should be collaborative setup.

Where the book excels is in GM support material. Chapters 21-26 provide practical tools I can actually use: session prep worksheets, faction tracking, front management, and Clock templates. The Campaign & Fronts Sheet alone justifies the book's GM section - it gives me a single page to track the moving parts of my world.

The Tags, Conditions, and Clocks system is where I feel some tension as a Simplicity Seeker. In theory, these are elegant fiction-first tools. Tags describe scenes, Conditions track character states, Clocks visualize progress. In practice, juggling all three during a fast-moving session could become cognitive overhead. I would likely use Clocks sparingly for major threats and rely on Tags and Conditions only when they actively drive story decisions.

The alternative play modes (solo, GMless, duet, asynchronous) are thoughtful inclusions. I may never use GMless play, but knowing the system supports it tells me the designers thought carefully about different table configurations. The VPC (Virtual Player Character) rules for solo play are particularly well-conceived.

The DC ladder (12-22) with clear labels (Easy through Legendary) is exactly what I need for improvisational GMing. I can set difficulty by gut feeling rather than calculation. The outcome tiers mapped to margin ranges give me clear guidance without requiring memorization.

One concern for casual pickup play: the book is substantial. While well-organized, a player who just wants to understand "how do I make a check" has to navigate through philosophy sections first. A one-page quick-start reference would help tables that want to learn by playing rather than reading.

Overall, Razorweave feels like a system designed by people who understand fiction-first play deeply. For my casual GMing style, it provides enough structure to resolve uncertainty while staying out of the way during roleplay. The question is whether my players will engage with the Tag/Condition/Clock ecosystem or find it one layer too many. I suspect the answer varies by table.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step character creation process is thorough but potentially lengthy for casual play groups",
      impact: "Session zero may take longer than expected for groups wanting quick character generation",
      location: "The Creation Flow - Steps One through Nine"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Three parallel tracking systems require active mental management during play",
      impact: "Casual GMs may find it challenging to consistently apply Tags, Conditions, and Clocks simultaneously while maintaining narrative flow",
      location: "Core Concepts and Throughout Chapter 9"
    },
    {
      section: "Chapter 14-17 - Skills and Proficiencies",
      issue: "Open-ended Skill and Proficiency creation requires significant GM guidance",
      impact: "Without clear boundaries, casual players may struggle with decision paralysis or create overlapping abilities",
      location: "Before You Choose Skills and Proficiencies section"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless and solo play modes described conceptually but lack detailed procedural support",
      impact: "Groups attempting these modes may need to develop their own procedures beyond what the book provides",
      location: "GMless Cooperative Play and Solo Play subsections"
    },
    {
      section: "Book Structure - General",
      issue: "No quick-start reference or one-page rules summary for immediate play",
      impact: "Tables wanting to learn by playing must navigate full chapters before understanding core resolution",
      location: "Book organization overall"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a thoughtfully designed fiction-first system that aligns well with my World Simulator GMing philosophy. Its emphasis on story-driven play, flexible character creation, and nuanced outcome tiers creates space for the kind of improvisational worldbuilding I enjoy. The GM support materials are genuinely useful, particularly the printable sheets and Clock templates.

For casual play, the system presents a trade-off: the fiction-first principles feel natural and reduce rule-lookup friction, but the Tag/Condition/Clock triad adds tracking overhead that may slow tables seeking pure simplicity. I would run this system, but I would likely simplify the tracking systems during early sessions until my group internalizes the core resolution flow.

The book is well-written and organized, with clear examples demonstrating the rules in action. As a long-term GM, I appreciate that the system trusts me to make judgment calls rather than prescribing rigid procedures for every situation. Recommended for groups who want structured fiction-first play with room to grow into its full complexity over time.`
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
- **Experience:** Long-term GM
- **Fiction-First:** Native
- **Mechanics Stance:** Neutral on mechanics
- **GM Philosophy:** World Simulator
- **Cognitive Style:** Simplicity Seeker

## Structured Ratings

| Category | Rating |
|----------|--------|
| **Clarity & Readability** | ${reviewData.ratings.clarity_readability}/10 |
| **Rules Accuracy** | ${reviewData.ratings.rules_accuracy}/10 |
| **Persona Fit** | ${reviewData.ratings.persona_fit}/10 |
| **Practical Usability** | ${reviewData.ratings.practical_usability}/10 |

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
