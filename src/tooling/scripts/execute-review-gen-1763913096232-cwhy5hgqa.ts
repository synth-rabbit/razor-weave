/**
 * Execute reviewer prompt for persona gen-1763913096232-cwhy5hgqa
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 504172
 * - Archetype: Storyteller
 * - Experience: Long-term GM
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Wary of Abstraction
 * - GM Philosophy: Railroad Conductor
 * - Genre Flexibility: Neutral
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
const personaId = 'gen-1763913096232-cwhy5hgqa';
const personaName = 'Generated Persona 504172';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As a long-term GM who has run story-driven campaigns for over a decade, I approach this rulebook as both an engineer of moments and a conductor of narrative. The Razorweave system shows genuine promise in how it thinks about mechanical support for storytelling, though I have reservations about how cleanly it bridges the gap between abstraction and fiction.

The character creation chapter (Chapter 6) is exceptional work. The progression from concept through nine deliberate steps gives players a scaffolding that doesn't feel like a checklist—it feels like discovering who their character is. The worked examples of Kira and Delian are particularly strong; they show decision-making, not just outcomes. The quick-start option is a kindness I appreciate; I run one-shots regularly, and respecting that play mode matters. My criticism is small: the chapter could benefit from a sidebar on how concept connects to campaign tone. I always end up having that conversation with players anyway, and explicit guidance here would save time.

The action resolution chapter (Chapter 8) demonstrates clear thinking about when to roll and when not to. "Uncertainty, Consequence, Agency"—three conditions that get at the heart of meaningful play. The DC ladder is practical and readable, and the examples (the merchant negotiation, the lock-picking scene) show how to apply it. However, I notice the chapter leans on abstract concepts like "fictional positioning" and "margin" without fully grounding them in specific narrative moments. As someone who values concrete table practice, I would want more worked examples showing how terrain, NPC attitudes, and time pressure translate into specific DCs. The system *can* handle that nuance, but the chapter makes it feel more abstract than it needs to.

Tags, Conditions, and Clocks (Chapter 9) is where the system reveals its greatest tension. The intent is clear: make mechanics that serve story rather than compete with it. But the proliferation of tracking mechanisms—environmental Tags, character Conditions, multiple Clocks running in parallel—pushes back against that goal in practice. As a GM who values decisive narrative momentum, I worry about scenes becoming mechanical rather than cinematic. Example: a character trying to investigate in a foggy graveyard (Dim Light, Obscured Tags), affected by Frightened (Condition), while both an investigation Clock and a threat Clock tick separately. The system *works*, but it requires constant cross-referencing. I run narrative-driven games precisely to avoid that cognitive overhead. The quick-reference tables help mitigate this, but the sheer number of interactions suggests a system that is more mechanically dense than its fiction-first philosophy acknowledges.

The combat chapter (Chapter 10) treats combat as a scene type rather than a separate subsystem, which I appreciate philosophically. The four core actions—Strike, Maneuver, Set Up, Defend/Withdraw—are clean and tactically sound. Resolve Clocks instead of hit points is a strong choice that keeps narrative stakes visible. However, the chapter shows its most abstract face here. Resolving combat means tracking Resolve Clock segments, applying and clearing Conditions, managing Tags, and making positioning decisions simultaneously. This is mechanically coherent but narratively dense. As a scene framer who thinks in story beats first, I find myself constantly asking "what does this Clock state *mean* for the character emotionally?" The system makes me work for that translation. A railroad conductor like me would benefit from more explicit guidance: "when Resolve reaches 3/6, describe the character as *this*, not that; when it hits 5/6, they show *this* behavior."

What works brilliantly across all four chapters is how the system respects player agency while maintaining GM control. The progression from broad choices (character concept) to specific mechanical moments (Checks and Clocks) is sound. The worked examples are strong, especially the combat sequences showing how position and Tags shift advantage. And the system clearly wants to support varied play styles—from one-shots to long campaigns, from tactical to narrative focus.

My core concern is that the system promises to be fiction-first while requiring increasingly abstract mechanical thinking to execute properly. Chapter 6 feels genuinely narrative. By Chapter 10, I'm tracking abstract numbers and managing interconnected subsystems. For a railroad conductor like me, who guides story from behind the scenes, that shift from narrative to mechanical is where I lose the throughline. I would run this system, but I would expect to house-rule it toward simpler resolution in actual play—fewer active Clocks, simplified Tag interactions, clearer narrative anchors for Clock states.

The chapters also show clear evidence of iteration and refinement. The system answers hard questions about when to roll, how to size challenges, and what happens when characters fail. That thoughtfulness is visible throughout. I respect the design work here; it just pushes toward abstraction at moments when I prefer specificity.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Quick-Start section and nine-step creation process don't explicitly connect character concept to campaign tone, relying on implicit player knowledge of setting expectations",
      impact: "GMs running diverse campaign types (dark fantasy vs. lighthearted adventure) may need to have additional conversations to ensure character concepts fit; the streamlined process becomes less streamlined when tone alignment requires discussion outside the chapter",
      location: "Quick-Start box and Step 1: Choose a Concept section"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Core concepts like 'fictional positioning' and 'margin' are explained mechanically but not grounded in specific narrative examples that show how table descriptions translate to DC numbers",
      impact: "New or less experienced GMs may struggle to assess whether a DC 14 or DC 16 is appropriate in unique scenarios; requires intuition-building that doesn't come from the chapter itself",
      location: "Setting DCs section and the Standard DC Ladder table"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "The system supports multiple simultaneous tracking mechanisms (environmental Tags, character Conditions, opposing Clocks) that create cognitive overhead during play, especially in complex scenes with multiple actors",
      impact: "Scenes with rich detail (foggy graveyard + Frightened character + investigation Clock + threat Clock) require constant cross-referencing between tables and Clock states, pulling focus from narrative flow and requiring frequent mechanical pauses",
      location: "Using Tags and Conditions with Checks section and the multi-Clock guidance flowchart"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat scenes require simultaneous management of Resolve Clocks, Tags, Conditions, and positioning, with minimal guidance on translating Clock state into narrative description of character behavior and desperation",
      impact: "GMs must do interpretive work to narrate combat's progression; a character at 3/6 on their Resolve Clock is mechanical fact, but what does their body language, tactics, and emotional state *show* at the table? This translation work slows pacing and requires GM improvisation",
      location: "Worked Combat Examples section and the Conditions in Combat subsection"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The system claims to support multiple play styles and initiative modes (Conversational, Popcorn, Rolled) equally, but the worked examples and guidance lean heavily toward tactical, structured combat with clear position and initiative discipline",
      impact: "GMs running looser, more narrative-focused combat (which the system claims to support) may find the examples and procedures feel over-defined, requiring significant adaptation to match their table's improvisational style",
      location: "Initiative Options Quick Reference and the worked combat examples (Example 1 and 2)"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a competent, well-organized system that will appeal to tables seeking narrative support without abandoning mechanical rigor. The character creation and action resolution chapters are genuinely strong, showing clear design thinking and respect for player agency. The system's innovations—Resolve Clocks instead of hit points, the "Uncertainty, Consequence, Agency" framework, and the explicit permission to not roll—are sound.

However, the system reveals an inherent tension as it progresses. It promises to be fiction-first but increasingly relies on abstract mechanical tracking. Tags, Conditions, and Clocks interact in mathematically coherent ways, but translating that coherence back into narrative momentum requires interpretive work that pulls focus from the story. For a long-term GM like me who conducts narrative from the conductor's podium rather than narrating from the spotlight, this is where the system becomes demanding rather than enabling.

The book would be stronger if it acknowledged this tension explicitly and provided more narrative anchors—clearer guidance on describing Clock states, more examples showing how specific combat positioning translates to fiction, and more permission to simplify the system for tables that want lighter mechanical touch. As written, it suggests a system that scales well from one-shots to campaigns, but in practice, the mechanical density increases notably as stakes rise.

I would recommend this rulebook to long-term GMs who enjoy medium-to-heavy mechanical systems and have the experience to abstract numerical states back into narrative. I would caution those who run purely improvisational games or who find that multiple simultaneous Clocks divide their attention. The core concepts are sound; the execution demands a particular style of GM expertise to shine.

Recommended with the caveat that you will likely drift the system during actual play—toward simpler Clock interactions, toward clearer triggers for Condition application, toward fewer simultaneous mechanical tracks. The rulebook works best not as written but as a foundation for table-specific adaptation.`
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

- **Archetype:** Storyteller
- **Experience:** Long-term GM
- **Playstyle:** Fiction-First (Converting), Wary of Abstraction, Railroad Conductor, Abstract Thinker

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
