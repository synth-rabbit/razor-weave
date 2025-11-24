/**
 * Execute reviewer prompt for persona gen-1763913096234-ht7gs1mbd
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 675764
 * - Archetype: Explorer
 * - Experience: Long-term GM
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Scene Framer
 * - Genre Flexibility: Enjoys Flexibility
 * - Cognitive Style: Intuitive
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
const personaId = 'gen-1763913096234-ht7gs1mbd';
const personaName = 'Generated Persona 675764';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As an explorer GM with long years of experience running diverse systems and genres, I find myself intrigued by the Razorweave rulebook's approach to flexibility within structure. My intuitive playstyle values books that adapt to my creative impulses rather than constraining them, and this system shows promise in that regard.

The organizational flow is solid, and I appreciate how the foundational concepts prepare the reader for the mechanical systems to follow. The progression from Chapter 1's welcome through Chapter 5's multiple play modes aligns with how I think about tabletop gaming - there isn't one right way, and systems should acknowledge that.

What stands out most in the character creation and core mechanics chapters is the attempt to balance mechanical precision with narrative flexibility. The 4d6 resolution system is clean and intuitive, which suits my preference for rules that don't distract from exploration and discovery. The modification made to these chapters appears to have streamlined the flow without sacrificing the mechanical depth I appreciate.

Where my skepticism about fiction-first design comes through is in the proliferation of tracking mechanics. As a narrative purist at heart, I'm cautiously optimistic about how Tags, Conditions, and Clocks actually function at the table. The descriptions are clear, but I'll need to playtest whether they truly fade into the background or become the focus of scene management.

The emphasis on scene framing throughout the book resonates with my GM philosophy - I want systems that help me frame dramatic moments, not systems that need my constant attention to adjudicate edge cases. The combat chapter's structure around action types and positioning feels appropriate for this goal.

What excites me most is the support for multiple play modes (duet, GMless, solo, asynchronous). As an explorer who likes to venture into unconventional gaming experiences, having explicit support for these modes opens creative possibilities. The fact that these aren't afterthoughts but integrated into the design shows thoughtful consideration.

My intuitive cognitive style means I often improvise and adapt rules mid-session. This rulebook seems designed to support that approach - the guidance for GMs in running sessions and campaigns emphasizes judgment calls and adaptation rather than strict adherence to procedure. That's exactly what I need.

Overall, this is a rulebook that respects the GM's creative agency while providing solid mechanical scaffolding. For explorers who want systems that don't demand mastery before interesting play, this hits the sweet spot.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "While streamlined from previous versions, the character creation still has multiple dependency chains that could confuse some explorers new to the system",
      impact: "New players exploring the system might need GM guidance to navigate attribute selection and skill/proficiency interactions smoothly",
      location: "Attribute selection through skill point allocation"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The distinction between different check types (opposed checks, situational modifiers) could benefit from more genre-specific examples",
      impact: "Explorers who like to adapt rules for different genres might need to extrapolate more than desired to see how mechanics scale",
      location: "Opposed Checks and Situational Modifiers sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While the mechanics are clear, the chapter could include more examples of how GMs might improvise additional Tags for unexpected situations",
      impact: "Scene framers improvising genre-specific scenarios might second-guess whether they're using Tags correctly",
      location: "Tags section - could benefit from creative improvisation guidance"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "The positioning system is elegant but the chapter assumes a certain comfort level with tactical positioning that not all explorers may have",
      impact: "GMs who prefer to keep combat loose and narrative-focused might need to adapt the positioning framework significantly",
      location: "Positioning and Movement subsection"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "The alternative play modes (GMless, solo, asynchronous) are intriguing but lack detailed example scenarios showing how Tags and Conditions function in these contexts",
      impact: "Explorers interested in venturing into these modes will need to invest significant preparation to understand mechanical implications",
      location: "GMless Cooperative Play, Solo Play, Asynchronous Play subsections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an excellent match for GMs who want flexibility within structure - exactly what an explorer needs. The system trusts the GM's intuition and provides tools rather than mandates. The modifications to character creation, checks, tags, and combat have created a tighter presentation without sacrificing the mechanical depth that scene framers need.

What makes this book work for my playstyle is the consistent message throughout: these are your tools, adapt them to your stories. The extensive GM guidance for running sessions and campaigns reflects a philosophy that values creative agency. The support for multiple play modes shows a genuine commitment to flexible gaming.

For long-term GMs who enjoy exploring different genres, play styles, and systems, this rulebook offers a solid foundation that won't get in the way of your vision. My skepticism about fiction-first design is tempered by the book's clear acknowledgment that mechanical depth serves narrative, not the reverse. I'd run this system immediately and expect to discover new applications through actual play.

Recommended for GMs seeking tools that adapt to their vision rather than demanding conformity to a rigid design philosophy.`
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

- **Archetype:** Explorer
- **Experience:** Long-term GM
- **Playstyle:** Skeptical, Intuitive, Scene Framer
- **Genre Flexibility:** Enjoys Flexibility

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
