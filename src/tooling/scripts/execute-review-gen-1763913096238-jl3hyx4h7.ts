/**
 * Execute reviewer prompt for persona gen-1763913096238-jl3hyx4h7
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Method Actor
 * - Archetype: Method Actor
 * - Experience: Early Intermediate (1-3 years)
 * - Fiction-First: Converting
 * - Wary of Abstraction
 * - GM Philosophy: Scene Framer
 * - Cognitive Style: Experimental
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
const personaId = 'gen-1763913096238-jl3hyx4h7';
const personaName = 'Method Actor - Early Intermediate';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 6
  },
  narrative_feedback: `Coming to this rulebook as someone who has been playing for a couple of years now, mostly in more traditional games, I find myself genuinely excited by what Razorweave is trying to do. I have always cared most about getting into my character's head, about living in their skin during a session. This book seems to understand that impulse, even if it sometimes asks me to hold more abstractions in my mind than I am entirely comfortable with.

The fiction-first philosophy speaks directly to how I want to play. Chapter 1 sets this tone beautifully: "The story comes first. Mechanics support the story when the outcome of an action is uncertain and meaningful." Yes. This is what I have been looking for. When I describe my character attempting something bold, I want the rules to follow naturally from that description, not the other way around.

Where I start to feel uncertain is when the book introduces the full weight of its mechanical infrastructure. The 4d6 roll is elegant and I understand the appeal of the margin-based outcomes. But when I also need to track Tags on the scene, Conditions on my character, multiple Clocks ticking in different directions, and remember which Skills and Proficiencies apply... that is a lot to hold while also staying immersed in my character's experience.

The character creation chapter (Chapter 6) gives me hope. The emphasis on Origin, Defining Moment, and Drive feels right for how I build characters. I start with who they are, their history, their wounds. The nine steps feel thorough rather than overwhelming because they ground mechanical choices in narrative meaning. I can see myself enjoying that process.

Combat concerns me more. As someone who prefers scene framing over tactical minutiae, the combat chapter's attention to positioning Tags and environmental conditions feels like it might pull me out of character. When I am in a tense fight, I want to be thinking about what my character is feeling, not calculating whether the Dim Light tag gives me Advantage on my Stealth approach.

The examples throughout the book help enormously. Seeing how the mechanics flow from described actions makes the abstract concepts more concrete. I wish there were even more of these extended play examples, particularly for combat and social scenes, showing how a whole exchange unfolds.

What excites me most is the game's commitment to making failure interesting. The outcome tiers where even Partial Success and Failure move the story forward aligns perfectly with how I think about dramatic play. My character does not need to win every roll to have a compelling arc. I just need every result to mean something.

I am converting to fiction-first thinking, and this book feels like it wants to help me complete that journey. My hesitation comes from uncertainty about whether I can hold all the moving pieces while staying in character. I suspect the answer is practice, and a GM who helps manage the mechanical overhead while I focus on inhabiting my character.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The margin calculation (Roll - DC) is clear, but remembering all the modifiers from Tags, Conditions, Advantage, and Skills simultaneously feels cognitively demanding",
      impact: "Method actors may struggle to stay immersed while mentally tracking mechanical modifiers during play",
      location: "Advantage and Disadvantage section, modifier stacking rules"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The conceptual distinction between Tags (scene/location) and Conditions (character) is elegant but requires abstraction to apply consistently",
      impact: "Players wary of abstraction may default to treating everything as conditions or miss environmental Tags entirely",
      location: "Tags vs. Conditions: Core Distinction section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat positioning relies heavily on environmental Tags (Elevated, Cramped, Dim Light) which requires scene framing GMs and players to maintain spatial awareness",
      impact: "Method actors focused on character emotion and motivation may find tactical positioning breaks immersion",
      location: "Positioning and Environment section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step process is narratively rich but may overwhelm early intermediate players new to this specific system",
      impact: "First session character creation could take longer than expected, delaying the actual roleplay that method actors are eager to begin",
      location: "Step One through Step Nine workflow"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Social encounters using paired Clocks (Progress + Pressure) are mechanically elegant but may feel artificial when players are focused on authentic character interaction",
      impact: "The abstraction of relationship building into clock segments may clash with players who prefer organic social roleplay",
      location: "Social Checks and Negotiation section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a thoughtfully designed system that genuinely prioritizes fiction-first play. For method actors still developing their relationship with game mechanics, it offers a compelling middle ground: enough structure to resolve uncertainty fairly, enough flexibility to let character choices drive the story. The 4d6 margin system is elegant and the outcome tiers reward dramatic play over simple success-hunting.

However, the system asks players to hold multiple abstraction layers simultaneously (Tags, Conditions, Clocks, Skills, Proficiencies), which may challenge those who prefer to stay fully immersed in character. The book would benefit from more extended play examples showing how these elements weave together during actual scenes.

For early intermediate players converting to fiction-first thinking, this is an excellent system to grow with. It does not patronize by oversimplifying, but it also grounds its complexity in narrative purpose. The key will be finding a table and GM who share the method actor's commitment to character immersion and can help manage mechanical overhead when needed.

Recommended for players willing to experiment and practice, with the understanding that mastery will take time.`
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
- **Experience:** Early Intermediate (1-3 years)
- **Fiction-First:** Converting
- **Playstyle:** Wary of Abstraction, Experimental
- **GM Philosophy:** Scene Framer

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
