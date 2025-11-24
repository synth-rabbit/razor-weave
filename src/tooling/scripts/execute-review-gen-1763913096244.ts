/**
 * Execute reviewer prompt for persona gen-1763913096244-1hxjxo0g9
 * Campaign: campaign-20251123-192801-j6p4e486
 *
 * Persona Profile:
 * - Name: Generated Persona 765240
 * - Archetype: Method Actor
 * - Experience: Experienced (3-10 years)
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Railroad Conductor
 * - Genre Flexibility: Genre-Agnostic Enthusiast
 * - Cognitive Style: Concrete Thinker
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
const personaId = 'gen-1763913096244-1hxjxo0g9';
const personaName = 'Generated Persona 765240';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As someone who lives for deep character immersion and truly inhabiting my roles, I find Razorweave presents a fascinating tension that mirrors my own playstyle preferences. The fiction-first philosophy speaks to my soul - I want to describe my character's desperate lunge across the rooftop, not just say "I roll Athletics." And this rulebook absolutely delivers that promise in its prose and examples.

However, and this is where my concrete-thinking side kicks in, I need to know exactly what happens when I roll those dice. The 4d6 system with its margin-based outcomes gives me precisely that - I can calculate my chances, understand my odds, and still describe everything through the lens of my character's experience. The DC ladder from 12 to 22 is clear and memorable. The Advantage/Disadvantage system stacking to +/-2 is elegant.

What I struggle with is the character creation process. As a Method Actor, I want to build a character with a rich internal life, clear motivations, and distinctive quirks. The rulebook gives me attributes and skills, but the character creation chapter feels rushed. I need more guidance on how to translate my character concept into mechanical choices - not because I can't figure it out, but because I want the mechanics to reinforce and support my character vision, not feel arbitrary.

The Conditions and Tags system is brilliant for immersion - "Dazed," "Frightened," "Bleeding" - these are states I can roleplay, not just penalties to track. But some tags could use more concrete examples of how they manifest in play. When my character is "Marked," what does that feel like from their perspective?

The GM section concerns me slightly. I appreciate structured play - I want my GM to have clear tools to guide the narrative. But the Fronts and Pressure Clocks feel more suited to sandbox play than the guided experiences I prefer. More examples of how to use these tools in a more directed campaign would be welcome.

The glossary and index are excellent reference tools. When I need to look up exactly what "Partial Success" means or how many segments a standard Clock has, I can find it quickly. This supports my need for concrete answers during play.

Overall, I can see myself deeply investing in characters in this system. The mechanics are clear enough to plan around, and the fiction-first framing means my roleplay choices matter. I just wish the book did more to help me bridge my character concept to their sheet.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Lacks guidance for translating rich character concepts into mechanical choices",
      impact: "Method Actors may struggle to ensure their character's personality is reflected in their mechanical build, leading to disconnect between roleplay and rolls",
      location: "Character Creation Overview - Steps 1-9"
    },
    {
      section: "Chapter 9 and 18 - Tags and Conditions",
      issue: "Some conditions lack roleplay guidance for how they feel from the character's perspective",
      impact: "Immersion-focused players need to invent their own interpretations, which may conflict with GM expectations or table norms",
      location: "Extended Tags and Conditions Reference"
    },
    {
      section: "Chapter 25 - Factions, Fronts, and World Pressure",
      issue: "Tools skew toward sandbox play rather than guided narrative",
      impact: "GMs who prefer structured campaigns may find difficulty adapting these tools, and players expecting guided play may feel adrift",
      location: "Fronts and Pressure Clocks subsections"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Margin calculations require mental math that can break immersion",
      impact: "Having to calculate Roll minus DC to determine outcome tier pulls players out of character momentarily during dramatic scenes",
      location: "Resolution Procedure and Outcome Tiers"
    },
    {
      section: "Chapter 24 - NPCs, VPCs, and Enemies",
      issue: "VPC advanced antagonist mechanics not fully explained for players to understand",
      impact: "Players may feel blindsided by VPC abilities if they don't understand the system, reducing dramatic tension in favor of confusion",
      location: "VPC Special Mechanics Overview"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a strong foundation for fiction-first play with enough mechanical crunch to satisfy my need for concrete numbers. The 4d6 margin-based system elegantly bridges narrative and mechanics - I always know what my roll means while staying in character. However, for Method Actors who want deep character immersion, the rulebook could better support translating rich character concepts into meaningful mechanical choices. The GM tools assume a level of sandbox play that may challenge groups preferring more structured narratives. Despite these friction points, I could see myself running and playing this system enthusiastically - I'd just need to do some personal prep work to make my characters sing the way I want them to.

As a genre-agnostic player, I appreciate that the system's core mechanics (attributes, skills, tags, conditions) could flex to many settings with minimal adaptation. The synthwave aesthetic is striking but doesn't lock the rules to any particular genre.

Rating: 7/10 - A solid system with room to grow in supporting deep character investment.`
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
- **Experience:** Experienced (3-10 years)
- **Playstyle:** Evangelical, Concrete Thinker

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
