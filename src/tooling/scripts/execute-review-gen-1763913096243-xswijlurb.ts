/**
 * Execute reviewer prompt for persona gen-1763913096243-xswijlurb
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Casual Gamer/Long-term GM)
 * - Archetype: Casual Gamer
 * - Experience: Long-term GM
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: GMless Advocate
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
const personaId = 'gen-1763913096243-xswijlurb';
const personaName = 'Casual Gamer/Long-term GM';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As someone who has been running games casually for over a decade and strongly advocates for GMless play, I came to the Razorweave Core Rulebook with specific expectations. I want concrete numbers I can point to during play, but I also want a system that genuinely supports shared authority. My verdict is mixed.

The good news first: the core 4d6 resolution system is wonderfully concrete. The DC ladder (12/14/16/18/20/22) gives me exactly what I need - real numbers to anchor decisions. The outcome tiers with specific margins (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 to -6, Critical Failure at -7 or worse) are the kind of hard data I can work with. No wishy-washy "somewhere between success and failure" - I know precisely where I stand. The Advantage/Disadvantage system with its explicit dice manipulation (roll 5d6 or 6d6, keep best/worst 4) is similarly transparent.

However, as a GMless advocate, I'm disappointed. Chapter 5 mentions GMless cooperative play in a single paragraph, promising that "the table uses procedures that rotate authority and help distribute scene framing." But when I turn to Chapter 26 for the actual procedures, the guidance is frustratingly vague. The "Rotating Facilitator" section is decent, but "Fully GMless play works best when procedures are explicit" followed by generic advice about agreeing on how to introduce threats doesn't give me the concrete procedures I need.

Where are the specific oracle tables? Where are the structured turn-taking rules? Where are the explicit protocols for who adjudicates contested outcomes when there's no GM? The book acknowledges these are needed but doesn't actually provide them. For a casual gamer like me who wants to pick up and play without extensive house-ruling, this is a significant gap.

The character creation nine-step process is solid but feels heavy for casual pickup games. Steps 1-9 with all the narrative questions about background, relationships, goals, and drives - that's a lot of prep for someone who just wants to roll dice with friends on a Friday night. I appreciate the depth for campaign play, but I'd love to see a quick-start option.

The Clocks system is excellent for pacing - concrete, visual, easy to track. Tags and Conditions are clearly differentiated (Tags for environment, Conditions for characters) with specific mechanical effects. This is exactly the kind of transparency I want. But managing all these tracking mechanisms in GMless play, where everyone needs to understand and agree on applications? That's asking a lot.

The GM chapters (21-26) are comprehensive but, ironically, the extensive GM-specific advice highlights how much the system still assumes traditional GM authority. The faction system with its Standing ladder is gameable and concrete, but requires someone to track and advance it - usually the GM.

As an evangelical fiction-first believer, I appreciate that the system leads with narrative intent before mechanics. The "declare intent and approach, then roll" structure keeps story at the center. But as a concrete thinker who needs clear numbers, I also appreciate that the fiction-first approach is backed by hard mechanical resolution.`,
  issue_annotations: [
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless cooperative play is mentioned but not mechanically supported with concrete procedures",
      impact: "Groups wanting GMless play must create their own protocols, adding significant prep burden to casual players",
      location: "GMless Cooperative Play subsection - single paragraph with no actual rules"
    },
    {
      section: "Chapter 26 - Alternative Play",
      issue: "The GMless procedures section lacks specific tools like oracle tables, turn structures, or conflict resolution protocols",
      impact: "Despite dedicating a chapter to alternative play, GMless advocates are left without the concrete procedures promised",
      location: "GMless Procedures section - advice is philosophical rather than procedural"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "The nine-step creation process is thorough but heavy for casual pickup games",
      impact: "Casual gamers may be deterred by the extensive narrative work required before play begins",
      location: "The Creation Flow - Steps 1 through 9"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "While clearly defined, managing these three tracking systems requires significant table agreement",
      impact: "In GMless play where no single authority adjudicates, applying Tags and Conditions consistently becomes challenging",
      location: "Core Concepts and implementation throughout"
    },
    {
      section: "Chapters 21-26 - GM Guidance",
      issue: "The extensive GM-specific material emphasizes traditional GM authority even while claiming support for alternative modes",
      impact: "The asymmetry between GM and alternative play support makes the book feel like it pays lip service to GMless while centering traditional play",
      location: "Running Sessions, Running Campaigns, Designing Scenarios chapters"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook delivers exactly what I need mechanically: concrete numbers, clear outcome tiers, and transparent resolution. The 4d6 system with its explicit DC ladder and margin-based outcomes satisfies my need for hard data at the table. The Clocks, Tags, and Conditions provide structured tracking that keeps everyone on the same page.

However, as a GMless advocate, I find the book's claims of supporting alternative play modes to be overstated. The actual procedures for GMless play are thin, leaving casual groups to improvise their own protocols. This is particularly frustrating because the core mechanics are sound and could support GMless play beautifully - the book just doesn't provide the scaffolding.

For traditional GM-led games, especially campaigns with dedicated prep time, this is an excellent rulebook. For casual GMless pickup games? You'll need to bring your own procedures or wait for a supplement that actually delivers on the promise of Chapter 26. I'd recommend this to long-term GMs who want a flexible fiction-first system with mechanical teeth, but with a caveat that GMless play requires significant house-ruling.

Rating Summary: Strong mechanics, clear procedures for traditional play, but a significant gap between the promise and delivery of GMless support.`
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
- **Fiction-First:** Evangelical
- **Mechanics:** Needs Concrete Numbers
- **GM Philosophy:** GMless Advocate
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
