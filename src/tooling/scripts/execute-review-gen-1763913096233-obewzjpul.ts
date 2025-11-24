/**
 * Execute reviewer prompt for persona gen-1763913096233-obewzjpul
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Archetype: Method Actor
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
const personaId = 'gen-1763913096233-obewzjpul';
const personaName = 'Method Actor Newbie (Visual)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As someone brand new to tabletop RPGs who really wants to get into my character's head and feel what they feel, I approached this rulebook hoping to find clear pathways into immersive play. I learn best when I can picture things - diagrams, examples I can visualize, step-by-step processes I can see unfolding.

The good news is that the rulebook genuinely tries to put story first. The opening chapters (1-5) made me feel welcomed rather than intimidated. Phrases like "the story comes first" and "mechanics support the story" resonated with what I'm hoping for - I don't want to be a rules lawyer, I want to become my character. The emphasis on describing what happens before reaching for dice feels right for my playstyle.

Chapter 6 on Character Creation was where I felt most engaged. The nine-step process gave me a clear visual pathway from "idea in my head" to "character on paper." The example character Rella helped tremendously - I could picture her in the relay station, feel her careful attention to detail. When the text described her "clothes are practical and layered" and "hands are steady from years of fine repair work," I could see her. That's what I need as a visual learner.

However, I started struggling when the mechanics got denser. Chapter 8 on Actions, Checks, and Outcomes introduces a lot: the 4d6 system, DCs from 12-22, margins, outcome tiers, advantage/disadvantage... It's a lot to hold in my head at once. I found myself wishing for more visual aids - maybe a flowchart showing "you want to do something uncertain" leading through the decision tree to "roll and interpret." The information is there, but as a newbie, I had to read some sections multiple times.

The Tags, Conditions, and Clocks chapter (Chapter 9) was conceptually appealing - I like the idea that the world has memorable descriptors that affect play. But the three-way distinction between Tags (environment), Conditions (character states), and Clocks (progress trackers) took a while to click. I kept mixing them up in my head. A side-by-side comparison table or a visual diagram showing "Tag = this room has Dim Light" vs "Condition = you are Exhausted" would have helped me enormously.

Combat in Chapter 10 was both exciting and intimidating. I love that there's no hit point tracking - the Resolve Clock concept makes narrative sense to me. When a character is "taken out," it could mean different things depending on the story we're telling. That flexibility appeals to the method actor in me. But the four combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) and how they interact with positioning, Tags, and Conditions felt like a lot to juggle for my first combat.

What I noticed throughout: the examples are generally excellent. When the text shows a specific scenario - like the warehouse fight with Cramped, Fragile Cover, and Slick tags - I can picture it and understand how the mechanics serve the fiction. But there aren't quite enough of these visual anchors, especially in the more mechanical sections.

My biggest challenge as a method actor newbie: the book assumes a level of comfort with abstraction that I don't yet have. The phrase "fiction first" appears often, but sometimes the mechanics feel like they come first and the fiction has to catch up. For someone who wants to stay in character's headspace, switching between "what would my character do?" and "which Attribute does that use?" is jarring.

The rules about Skills and Proficiencies being open-ended and collaborative with the GM is philosophically appealing but practically nerve-wracking. As a newbie, I'd appreciate more concrete examples of what Skills and Proficiencies actually look like in different genres. The examples given are good but feel narrow.

One thing I genuinely appreciated: the book doesn't make me feel stupid for being new. The tone is inviting rather than condescending. Phrases like "You do not need to memorize everything before you begin play" and "You can always revise these as the story unfolds" gave me permission to learn as I go.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The resolution system introduces many concepts at once (4d6, DC ladder, margins, outcome tiers, advantage/disadvantage) without visual aids or a clear flowchart",
      impact: "A visual learner and newbie like me had to re-read sections multiple times and still feels uncertain about the sequence during actual play",
      location: "Entire chapter, but especially 'Rolling 4d6 and Calculating Margin' and 'Interpreting Outcomes' sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "The distinction between Tags, Conditions, and Clocks is explained in prose but lacks a clear visual comparison",
      impact: "I kept confusing Tags (environmental) with Conditions (character states) in my head, which could lead to misapplication during play",
      location: "Opening sections 'Tags vs. Conditions' and throughout"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "While the nine steps are clear, the Skills and Proficiencies sections feel abstract for a newbie - the 'open list' approach requires genre knowledge I don't have",
      impact: "I felt uncertain about whether my Skill and Proficiency choices were appropriate or too narrow/broad, and worried about 'doing it wrong'",
      location: "Steps Four and Five, and 'Before You Choose Skills and Proficiencies' section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The four core combat actions and their interactions with Tags, Conditions, and Clocks represent significant cognitive load for a first combat",
      impact: "As a method actor, I want to stay in character during tense moments, but the mechanical complexity might pull me out of immersion while I figure out 'what can I even do?'",
      location: "Core Combat Actions section and Positioning and Environment section"
    },
    {
      section: "Overall - Visual Learning Support",
      issue: "The rulebook is text-heavy with few diagrams, flowcharts, or visual summaries of key procedures",
      impact: "Visual learners like me struggle to form mental models of the game's flow and must rely on prose explanations that can feel abstract",
      location: "Throughout the book, but especially Chapters 8-10"
    }
  ],
  overall_assessment: `As a method actor newbie with a visual learning style, the Razorweave Core Rulebook gave me a mixed experience. The philosophy is exactly what I want: fiction first, character-driven, collaborative storytelling with mechanics that support rather than dominate. The tone is welcoming and non-intimidating.

The character creation chapter shines because it offers concrete examples I can visualize (Rella the telegraph engineer) and a clear nine-step pathway. When the book gives me specific, visual examples - a warehouse fight with Slick floors and Fragile Cover, a negotiation with a nervous official - I understand how the system works and get excited about playing.

Where I struggled was with the density of mechanical concepts and the lack of visual aids. The 4d6 resolution system, the DC ladder, margins, outcome tiers, advantage/disadvantage, Tags, Conditions, Clocks, combat actions... it's a lot of moving parts for someone who's never played before. I learn best by seeing how things connect, and the prose-heavy presentation sometimes left me constructing mental models without enough scaffolding.

My specific concern as a method actor: will I be able to stay in my character's headspace during play, or will I constantly be pulled out to ask "wait, which Attribute is that?" and "do I have Advantage from that Tag?" The system seems designed to support immersion, but the learning curve might work against that for the first several sessions.

My recommendation would be to add more visual aids (flowcharts for resolution, comparison tables for Tags vs Conditions vs Clocks, quick-reference diagrams for combat) and more worked examples across different genres. The examples that exist are excellent - I just want more of them.

For a more experienced player or someone comfortable with mechanical abstraction, this book probably rates higher. For me, it's a promising system with a welcoming philosophy that I'd need to study carefully and probably learn best by actually playing with patient, experienced players who can show me how it flows.

I want to play this game. I'm just not quite sure I could run it or teach it to others yet.`
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
