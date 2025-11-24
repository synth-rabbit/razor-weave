/**
 * Execute reviewer prompt for persona gen-1763913096246-agudq89dk
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 572134
 * - Archetype: Casual Gamer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Native
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Neutral
 * - Cognitive Style: Complexity Tolerant
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
const personaId = 'gen-1763913096246-agudq89dk';
const personaName = 'Generated Persona 572134';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As someone who drifts between GM and player depending on the campaign, I found the Razorweave Core Rulebook genuinely refreshing. It speaks to how I actually want to play - narrative-focused with mechanics that support the story rather than overshadow it.

The opening chapters get it right. The philosophy sections feel like someone finally understands that I don't want to spend three hours learning subsystems before we start playing. The fiction-first approach resonates with how my group naturally approaches games anyway. We want mechanics that fade into the background when the story is hot and become visible again when we need clarity.

What really impressed me is the book's accessibility. Coming at this from a casual perspective - I run maybe two campaigns a year, GM maybe every other session - the progressive reveal of complexity works perfectly. Chapter 6's character creation looks thorough without being overwhelming. I can sit down with new players at session zero and have them ready to play within an hour, which is exactly what my groups need.

The Tags and Conditions system is elegant. As a scene framer, I appreciate that I can apply narrative descriptors to a location (Oppressive, Cramped, Eerie) and they mechanically matter without requiring a spreadsheet. The Clocks feel like they were designed for people like me who want structure without drowning in bookkeeping.

The combat chapter is particularly well-done for casual play. The action types are intuitive - Strike, Maneuver, Set Up, Defend/Withdraw. I can teach this at the table in minutes. The fact that positioning doesn't require a grid but still has mechanical weight is exactly the balance I've been looking for.

I'm also genuinely grateful for the acknowledgment of different play modes. My regular group loves standard group play, but we've also run duets and occasional solo play. The book treats these as legitimate, not afterthoughts. The GMless variant chapters acknowledge that we're all storytellers first.

My one hesitation is whether the advancement and proficiencies chapters might still feel a bit crunchy for ultra-casual tables, but honestly, even that's presented clearly and you can defer it to between-session conversations.

The GM guidance chapters (21-26) deserve special mention. The faction standing ladder, the guidance on framing scenes effectively, the advice on running sessions - this is the stuff I actually need. Not just mechanics, but philosophy and practical approach. The campaign fronts section gives me structure without railroading, which is exactly my style.

This rulebook respects player agency and storytelling instinct while providing guardrails when we need them. That balance is hard to achieve, and the Razorweave Core Rulebook nails it.`,
  issue_annotations: [
    {
      section: "Chapter 14-15 - Skills System",
      issue: "The full skills reference with all attribute combinations could be overwhelming for casual tables on first read",
      impact: "New players might feel like they need to memorize the full table, though in practice GMs can guide choices",
      location: "Skills Reference by Attribute sections - the comprehensive grid presentation"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While mechanically clear, new GMs might overuse Clocks initially before understanding optimal application",
      impact: "Could lead to analysis paralysis on clock design in early sessions before groups find their rhythm",
      location: "The introductory examples showing Clocks in action"
    },
    {
      section: "Chapter 20 - Optional Variant Rules",
      issue: "The variant rules are presented clearly, but some casual groups may not realize which variants best match their playstyle",
      impact: "Groups might adopt inappropriate variants or miss ones that would enhance their experience",
      location: "Variant rules overview and descriptions"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "While the various play modes are acknowledged, the mechanical differences for solo and GMless play could use more worked examples",
      impact: "Groups wanting to experiment with these modes might struggle with actual implementation",
      location: "Solo Play and GMless Cooperative Play sections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exactly the kind of game that casual GM/players like me have been waiting for. It's narrative-first without being precious about it, mechanically sound without requiring a PhD to understand, and flexible enough to support my group's diverse play styles.

The book is well-written, logically organized, and respects my time. I can reference it quickly at the table, teach it to new players without dread, and trust that the mechanics will support my narrative instincts rather than fight them. The faction system, the Clock mechanic, the Tags - these all feel like tools I'll actually use.

For anyone who wants to run games that feel collaborative and story-driven but still have satisfying mechanical depth, this rulebook is a no-brainer. I'd use this for my next campaign without hesitation. The only reason I'm not giving it a perfect score is that some of the reference sections might benefit from additional examples for ultra-casual play, but that's a minor quibble.

Recommended enthusiastically for casual tables, duets, and any group that prioritizes narrative. This is what modern RPG design should look like.`
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
- **Experience:** Hybrid GM/Player
- **Playstyle:** Narrative Purist, Scene Framer, Complexity Tolerant

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
