/**
 * Execute reviewer prompt for persona gen-1763913096219-bjvva5oxj
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 613102
 * - Archetype: Method Actor
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Neutral
 * - GM Philosophy: Prepared Sandbox
 * - Genre Flexibility: Enjoys Flexibility
 * - Cognitive Style: Abstract Thinker
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
const personaId = 'gen-1763913096219-bjvva5oxj';
const personaName = 'Generated Persona 613102';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who thinks of myself as a method actor at heart—deeply invested in character authenticity and narrative immersion—I find the Razorweave Core Rulebook genuinely delightful. This is a rulebook that respects the fiction and the emotional reality of the characters within it.

The most compelling aspect is how thoroughly the book commits to fiction-first principles without actually breaking the mechanical spine of the system. Too many systems claim to prioritize narrative while secretly hiding crunchy mechanics underneath. Razorweave doesn't hide. It embraces both with equal sincerity. As someone who wears both the GM hat and the player hat, I appreciate how this design actually supports the sandbox style of play where both GMs and players contribute to world building.

Chapter 6 (Character Creation) is exemplary. The worked examples don't just explain mechanics—they show why those mechanics matter. When I read Rella's creation, I wasn't thinking about attribute arrays. I was thinking about the railway junction where she spent her youth, how the scent of hot copper and ozone shaped her senses, why she observes before she acts. This is method acting territory. The system encourages players to connect mechanical choices to the emotional and sensory reality of their character.

The modified chapters (6, 8, 9, 10) show particular attention to this principle. Chapter 8's worked examples don't just show successful checks. They show how margin of success transforms the narrative. A partial success doesn't feel like a failure with consolation; it feels like the story branching into unexpected places. As someone who improvises scenes as a GM, this is exactly the framework I need—structure that doesn't constrain, mechanics that don't script.

The DC tables and quick references in these chapters are invaluable. As a Prepared Sandbox GM, I appreciate having a concrete framework for difficulty without feeling like I'm consulting a tax code. The tiers make intuitive sense. A difficulty 14 check feels different from difficulty 16 in narrative weight, not just numerical difference.

Tags, Conditions, and Clocks (Chapter 9) work beautifully for the style of play I prefer. Rather than simulating combat systems or inventory minutiae, these mechanics track what matters to the story: Is the door locked? How many guards are alert? How much pressure is building? When I'm running a scene where players make unexpected choices, these tools let me improvise consequences without needing to consult tables. The clock system particularly resonates—I've used variants of this in my own campaigns, and seeing it formalized and explained clearly is wonderful.

Combat (Chapter 10) strikes a balance I rarely see. It's tactical enough that positioning and strategy matter, but abstract enough that it doesn't devolve into miniature placement. As a method actor, I find combat scenes often derail into mechanical minutiae. This system lets combat stay cinematic while still providing meaningful choices.

What genuinely delights me is how the book embraces genre flexibility. I run sandboxes in multiple genres—sometimes high fantasy, sometimes noir mystery, sometimes sci-fi exploration. The fact that this rulebook doesn't force a particular genre fantasy is liberating. It's a toolkit that accepts that different tables want different fictional flavors.

The GM guidance in Chapters 21-26 is thorough without being prescriptive. I don't feel lectured. I feel supported. There's a difference, and this book gets it. The material on session structure, faction management, and scenario design gives me anchoring points without requiring me to run the exact kind of campaign the authors prefer.

One note of caution: the neutral stance on narrative versus mechanics might confuse groups that haven't explicitly discussed their priorities. But as someone who enjoys flexibility, I see this as a strength rather than weakness. The system is legible enough that different tables can emphasize what matters to them.`,
    issue_annotations: [
      {
        section: "Chapter 6 - Character Creation",
        issue: "The nine-step process, while thorough, assumes players will find mechanical choices emotionally resonant. Players who separate mechanics from fiction may find it overwhelming.",
        impact: "Some players might feel the chapter is too long or too granular when what they want is faster character assembly. First-session energy could flag.",
        location: "Step 1 through Step 9, particularly Steps 3-5 (Attributes, Skills, Proficiencies assignment)"
      },
      {
        section: "Chapter 9 - Tags, Conditions, and Clocks",
        issue: "The distinction between scene-level Tags and character-level Conditions is clear in text but requires GM discipline in execution. Hasty application could muddy the model.",
        impact: "Scenes could become cluttered with too many Tags if GMs don't carefully track what's environmental vs. situational. This could slow narrative flow.",
        location: "Tags vs. Conditions distinction section; How Tags Affect Checks"
      },
      {
        section: "Chapter 10 - Combat Basics",
        issue: "While the combat system is well-explained, the interaction between Resolve, Conditions, and positioning Tags requires practice to internalize. New GMs might over-complicate early combats.",
        impact: "First combat encounter could feel clunky as GM fumbles with mechanics. Could break narrative momentum while consulting rules.",
        location: "Resolve Instead of Hit Points section; Conditions in Combat; Positioning and Environment"
      },
      {
        section: "Chapter 5 - Ways to Play",
        issue: "GMless and solo play modes are described but lack the mechanical scaffolding of GM-led play. These feel aspirational rather than fully developed.",
        impact: "Groups attempting solo or GMless play may need to create their own procedures beyond what the book provides, requiring homebrew work.",
        location: "GMless Cooperative Play and Solo Play subsections"
      },
      {
        section: "Chapter 8 - Actions, Checks, and Outcomes",
        issue: "While worked examples are excellent, the difference between 'the outcome tier' and 'what happens next' could be clearer. Some readers might conflate rolls with narrative inevitability.",
        impact: "Players and GMs might over-constrain improvisation, treating outcome tiers as prescriptive rather than generative framework.",
        location: "Interpreting Outcomes section; relationship between margin and narrative consequence"
      }
    ],
    overall_assessment: `The Razorweave Core Rulebook is a masterwork of fiction-first game design. For someone like me—a method actor who values character authenticity, a hybrid GM/player who benefits from clear procedures, someone who runs prepared sandboxes with room for improvisation—this is the system I've been waiting for.

The book respects the players' investment in their characters. It provides mechanics that enhance the fiction rather than replace it. The worked examples and quick references make it genuinely usable at the table. The modified chapters show real attention to practical play.

This is not a system that will appeal to everyone. Players who want crunchy, simulationist mechanics will want more detail. Players who prefer lighter narrative frameworks might find the mechanical scaffolding excessive. But for the sweet spot of "we want meaningful choices, clear narrative consequences, and room to improvise," Razorweave hits perfectly.

I would run this system enthusiastically. I would direct other GMs I know toward it. I would confidently build a long-term campaign in this framework. For a method actor who values both emotional authenticity and mechanical clarity, this rulebook delivers on all fronts.`
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
- **Experience:** Hybrid GM/Player
- **Playstyle:** Evangelical Fiction-First, Neutral on Mechanics, Abstract Thinker
- **GM Philosophy:** Prepared Sandbox

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
