/**
 * Execute reviewer prompt for persona gen-1763913096235-j6aqqm38b
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Archetype: Storyteller
 * - Experience: Experienced (3-10 years)
 * - Fiction-First: Native
 * - Narrative/Mechanics: Needs Concrete Numbers
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
const personaId = 'gen-1763913096235-j6aqqm38b';
const personaName = 'Storyteller Persona (Experienced 3-10 years)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `As a storyteller with nearly a decade of GM experience who lives and breathes fiction-first gaming, this rulebook speaks directly to my soul while occasionally leaving me wanting more concrete scaffolding.

The Razorweave Core Rulebook immediately establishes its fiction-first credentials in Chapter 1, and I appreciate how consistently this philosophy is woven throughout. The emphasis on "story comes first, mechanics support when uncertainty matters" aligns perfectly with how I run games. The intent-and-approach structure is elegant - asking players to describe WHAT they want and HOW they attempt it before reaching for dice feels natural and keeps the narrative flowing.

What works brilliantly for a storyteller like me:

The Tags, Conditions, and Clocks system (Chapter 9) is storytelling gold. Tags like "Dim Light," "Crowded," and "Tense" aren't just mechanical modifiers - they're narrative texture I can paint scenes with. The book's advice to "tag the things that shape decisions" resonates deeply. I can already imagine describing a scene and watching my players engage differently when I mention "the archive is tagged Restricted and Under Watch."

The GM chapters (21-26) provide excellent world-simulator tools. The faction relationship mapping, front advancement, and scenario design principles all support the kind of emergent storytelling I love. The worked example "Skybridge Sabotage" scenario demonstrates exactly how to take abstract stakes and make them concrete through locations, NPCs, and Clocks.

Where I need more concrete numbers:

While I embrace fiction-first play, I also need solid numerical anchors to make quick decisions. The DC ladder (12-22) is good, but I'd appreciate more guidance on when to use specific values. The book says "Routine in calm conditions but Hard in a burning building" - I want a quick reference that says "burning building adds +2 to DC" or similar.

The 4d6 resolution system is mathematically interesting but I'd appreciate probability tables or quick-reference odds. When my Attribute 2 player rolls against DC 16, what are their approximate chances? As a world simulator, I need to calibrate challenge fairly.

The Proficiency system (Chapter 16-17) is narratively rich but mechanically vague. "Proficiency might lower DC by one or two steps" is the kind of guidance that leaves me improvising more than I'd like. I want concrete defaults: "Domain proficiency always grants +1 Advantage unless circumstances suggest otherwise."

Simplicity concerns:

As a simplicity seeker, I worry about cognitive load during complex scenes. The interaction between environmental Tags, character Conditions, active Clocks, and Advantage/Disadvantage calculations could bog down the narrative flow I prize. The book's advice to "start small" is wise, but I'd appreciate clearer guidance on what the "minimum viable complexity" looks like for different scene types.

Character creation's nine steps feel thorough but potentially overwhelming for a one-shot or convention game. I'd love a streamlined "quick-start" process for experienced players who want to get into the story faster.

Overall, this is a system built by storytellers for storytellers. It trusts me to make judgment calls and provides rich narrative tools. I just wish it gave me slightly firmer mechanical footing when I need to make quick, fair rulings at the table.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The DC ladder provides ranges but lacks specific guidance for environmental modifiers",
      impact: "GMs who want concrete numbers must improvise DC adjustments on the fly, which can feel arbitrary to players expecting consistent world simulation",
      location: "Setting DCs section, around the DC 12-22 ladder"
    },
    {
      section: "Chapter 16 - Proficiencies System Overview",
      issue: "Proficiency benefits are described narratively but lack default mechanical values",
      impact: "Storytellers who need concrete numbers to feel confident in rulings may struggle with 'might grant Advantage or lower DCs' language",
      location: "Using Proficiencies in Play section"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While individually elegant, the combination of Tags, Conditions, and Clocks in a single scene could overwhelm simplicity seekers",
      impact: "Complex scenes with multiple environmental Tags, character Conditions, and racing Clocks require significant cognitive overhead that may slow narrative pacing",
      location: "Combining Tags, Conditions, and Clocks section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step process, while thorough, lacks a streamlined option for experienced players or one-shots",
      impact: "Groups wanting to jump into the story quickly may find character creation front-loads too much decision-making",
      location: "The Creation Flow section listing Steps One through Nine"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks replace hit points elegantly but tick rates for different attack types are not specified",
      impact: "World simulators need clearer guidance on whether a sword strike and a crossbow bolt tick the same number of segments",
      location: "Resolve Instead of Hit Points section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an excellent fiction-first system that will resonate strongly with experienced storyteller GMs who want narrative tools rather than tactical miniatures rules. Its fiction-first philosophy is genuine and consistently applied, from the intent/approach structure through to the scenario design guidance.

For my specific persona - an experienced Storyteller who is fiction-first native but needs concrete numbers and seeks simplicity - this book hits about 75% of what I want. The narrative framework is superb. The Tags/Conditions/Clocks system is elegant and evocative. The GM chapters provide rich world-building and scenario tools.

What's missing is the mechanical scaffolding that lets me make quick, confident rulings. I want default values, probability guidance, and streamlined options for when complexity threatens flow. The system trusts the GM to improvise - which I can do - but sometimes I want rules that tell me the answer so I can focus on describing it beautifully.

Recommended for storyteller GMs who are comfortable with mechanical improvisation and want rich narrative tools. Those who prefer explicit numerical guidance may need to develop house rules or reference sheets to feel fully supported.

Rating: 7.5/10 - A strong storytelling engine that could use firmer mechanical anchors for GMs who need them.`
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
- **Experience:** Experienced (3-10 years)
- **Fiction-First:** Native
- **Narrative/Mechanics:** Needs Concrete Numbers
- **GM Philosophy:** World Simulator
- **Cognitive Style:** Simplicity Seeker

## Structured Ratings

| Category | Rating |
|----------|--------|
| **Clarity & Readability** | ${reviewData.ratings.clarity_readability}/10 |
| **Rules Accuracy** | ${reviewData.ratings.rules_accuracy}/10 |
| **Persona Fit** | ${reviewData.ratings.persona_fit}/10 |
| **Practical Usability** | ${reviewData.ratings.practical_usability}/10 |

**Average Score:** ${((reviewData.ratings.clarity_readability + reviewData.ratings.rules_accuracy + reviewData.ratings.persona_fit + reviewData.ratings.practical_usability) / 4).toFixed(1)}/10

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

---

*Review generated: ${new Date().toISOString()}*
*Agent execution time: ${agentExecutionTime}ms*
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
console.log(`\nAverage Score: ${((reviewData.ratings.clarity_readability + reviewData.ratings.rules_accuracy + reviewData.ratings.persona_fit + reviewData.ratings.practical_usability) / 4).toFixed(1)}/10`);
console.log(`\nIssues Identified: ${reviewData.issue_annotations.length}`);
console.log(`Execution Time: ${agentExecutionTime}ms`);

db.close();
