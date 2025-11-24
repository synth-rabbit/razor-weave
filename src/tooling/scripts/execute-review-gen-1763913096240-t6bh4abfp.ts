/**
 * Execute reviewer prompt for persona gen-1763913096240-t6bh4abfp
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Archetype: Method Actor
 * - Experience: Forever GM
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Comfortable with Abstraction
 * - GM Philosophy: Scene Framer
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096240-t6bh4abfp';
const personaName = 'Method Actor / Forever GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As a Forever GM who lives for getting into character and someone who is actively converting to fiction-first play, the Razorweave Core Rulebook speaks directly to my evolving philosophy at the table. This is a system that wants me to ask "what would this character do?" before I ever think about what dice to roll - and that resonates deeply with my Method Actor sensibilities.

The book opens strong with its Core Principles of Play (Chapter 4). Lines like "The Table Is a Creative Team" and "Player Intent Drives Action" read like a manifesto for collaborative storytelling. As someone who has spent years behind the screen, I appreciate how the text repeatedly emphasizes the GM's role as an honest presenter of the world rather than an adversary. This aligns beautifully with my scene-framing approach - I want to set up situations and see where the players take them.

What works exceptionally well for a Method Actor like myself is the intent-and-approach framework. When the book instructs players to state what they want to accomplish (intent) and how they're doing it (approach), it forces everyone at the table into character headspace. This isn't "I roll Persuasion" - it's "I speak with her in private, emphasize the safety risks, and show her evidence." That's character-driven play, and I'm here for it.

The four-attribute system (Might, Agility, Presence, Reason) is elegant and concrete enough for my thinking style. I can immediately visualize what a high-Presence, low-Might character looks and feels like. The Skills and Proficiencies layers add depth without overwhelming - they're narrative permissions first, mechanical bonuses second.

However, as a concrete thinker, I occasionally struggle with some of the abstraction. The Resolve Clock system replacing hit points is philosophically sound - it puts "taken out" in the hands of the fiction rather than a number countdown. But when I'm running a tense fight scene, I want something I can hold onto mentally. The book does explain this well with examples, but I'd appreciate even more concrete guidance on pacing Clock ticks in different scenarios.

The Tags and Conditions system is where my scene-framing instincts light up. Describing a warehouse as "Cramped, Fragile Cover, Slick" gives me instant hooks for describing consequences and complications. Every Tag becomes a potential story beat. This is exactly how I want to run environments - loaded with fictional truth that mechanics can hang on.

My main concern as a converting GM is onboarding my players. The book's learning curve is reasonable for someone reading cover to cover, but I can see traditional players needing coaching through the intent-and-approach loop. Chapter 13's roleplaying guidance helps, but session zero will need to explicitly reset expectations about how this game flows differently than D&D-style "I attack" declarations.

The GM chapters (21-26) are a treasure trove. Running Sessions and Running Campaigns provide the structural thinking I need as a Forever GM, while Factions, Fronts, and World Pressure gives me exactly the kind of living-world tools I crave. The standing ladder from Hostile to Honored is immediately gameable and tells me stories just by existing.

Overall, this system feels like it was written for GMs who want to get out of their players' way while still providing meaningful structure. It respects my time at the table by making every roll matter (the three-condition test for when to roll is perfect). For my journey toward fiction-first play, this is a substantial step forward from where I started.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The five-tier outcome system (Critical Success through Critical Failure) requires GMs to narrate distinct results quickly, which can be challenging for concrete thinkers who prefer clear examples",
      impact: "GMs may default to binary success/failure interpretations, missing the nuanced storytelling opportunities of Partial Success",
      location: "Interpreting Outcomes subsection with outcome tier definitions"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The Resolve Clock abstraction, while elegant, lacks concrete guidance on tick pacing for different threat levels",
      impact: "Forever GMs may struggle to consistently calibrate how many ticks a given action should produce, leading to inconsistent fight pacing",
      location: "Resolve Instead of Hit Points section and Enemy Resolve example"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step creation process assumes players already understand fiction-first thinking, which may alienate Method Actors from traditional systems",
      impact: "Players converting from mechanics-first games may feel lost without explicit guidance on connecting character concept to mechanical choices",
      location: "Character Creation Flow, particularly Steps One through Three"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The distinction between scene-level Tags and character-level Conditions is philosophically clear but can blur during fast scene-framing",
      impact: "Scene Framer GMs may apply the wrong mechanic type in the moment, creating inconsistent rulings",
      location: "Tags vs. Conditions core distinction"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "Alternative play modes (GMless, solo) reference later chapters without providing concrete examples in this section",
      impact: "Method Actors interested in solo journaling or duet play lack immediate clarity on how their deep character work translates to these modes",
      location: "GMless Cooperative Play and Solo Play subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook succeeds as a bridge system for GMs converting to fiction-first play. Its intent-and-approach framework will delight Method Actors who want mechanical validation for deep character work. The Scene Framer philosophy embedded throughout respects GM authority while encouraging player agency. As a Forever GM, I find the GM section chapters exceptionally useful - these are tools I'll actually use, not filler.

The concrete thinker in me occasionally wants more explicit examples, particularly around Clock pacing and outcome narration. But the system's philosophical grounding is sound, and the learning curve is manageable for dedicated groups. This isn't a rules-light indie game nor a crunchy tactical simulator - it's a thoughtful middle ground that rewards the collaborative mindset.

Recommended for tables with experienced GMs seeking fiction-first structure, and for Method Actors who want their character investment to matter mechanically without drowning in optimization choices.`
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
- **Experience:** Forever GM
- **Fiction-First:** Converting
- **Comfort with Abstraction:** Comfortable
- **GM Philosophy:** Scene Framer
- **Cognitive Style:** Concrete Thinker

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
