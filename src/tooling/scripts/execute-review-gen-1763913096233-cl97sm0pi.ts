/**
 * Execute reviewer prompt for persona gen-1763913096233-cl97sm0pi
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Achiever/Long-term GM)
 * - Archetype: Achiever
 * - Experience: Long-term GM
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Non-GM philosophy
 * - Cognitive Style: Systems Integrator
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
const personaId = 'gen-1763913096233-cl97sm0pi';
const personaName = 'Achiever/Long-term GM (Systems Integrator)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 9,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `As a long-term GM who has been converting to fiction-first approaches, I find the Razorweave Core Rulebook to be a thoughtfully constructed system that addresses many of the pain points I've experienced transitioning from more traditional RPGs. My Systems Integrator mindset appreciates how the mechanical pieces interlock, even as I evaluate whether this system will truly serve my evolving play style.

The book's architecture is impressively coherent. The four-part structure (Foundations, Skills/Proficiencies Reference, GM Section, Reference Materials) creates clear pathways through the material. Part I establishes the philosophical foundation before introducing mechanics, which aligns well with how I've been trying to reframe my GMing approach. The explicit "fiction first" framing in Chapters 1-2 provides the conceptual anchor that systems like this need.

What works exceptionally well for my needs:

The 4d6 resolution system with its clear outcome tiers (Success, Partial Success, Failure) creates predictable but meaningful resolution moments. As someone accustomed to more granular systems, I appreciate that the math is straightforward while still providing gradation. The DC ladder from Routine (10) to Nearly Impossible (24) gives me enough structure to make consistent rulings.

The Tags/Conditions/Clocks triad is where my Systems Integrator brain really lights up. The distinction between Tags (scene/location descriptors) and Conditions (character states) creates two parallel tracks that influence play in complementary ways. Clocks provide the temporal pressure I've learned to value from PbtA-adjacent games. The integration of these three systems creates emergent complexity from relatively simple parts.

The advancement system in Chapter 19, tied to character growth triggers rather than pure accumulation, supports the kind of play I'm trying to cultivate. It rewards meaningful fictional engagement rather than just showing up.

The GM guidance in Chapters 21-26 is substantial and practical. The material on running sessions, campaigns, and designing scenarios directly addresses challenges I face weekly. The faction/fronts system provides structure for world dynamics without requiring exhaustive prep.

Where I have reservations:

The sheer volume of Skills and Proficiencies in Chapters 14-17 feels at odds with the fiction-first ethos. While I understand the need for mechanical differentiation, the extensive reference sections risk encouraging players to think in terms of abilities rather than situations. This is particularly challenging for someone like me who is still consciously breaking old habits.

Character creation, while comprehensive, front-loads significant decisions before players have experienced the system. The nine-step process in Chapter 6 may overwhelm newcomers, and even experienced players might struggle to make informed choices about Skills and Proficiencies without play context.

The book's length and depth, while thorough, creates a barrier to entry. As a converting GM, I can work through this material systematically. But when I think about onboarding new players, especially those unfamiliar with fiction-first approaches, I worry about the cognitive load.

For my specific context as an Achiever-archetype GM, the system provides clear markers of character development and campaign progress that satisfy my desire for tangible advancement. The advancement triggers and Clock completions create achievement moments that make play feel purposeful. However, I must remain vigilant that these tracking mechanisms don't pull me back toward the mechanical optimization mindset I'm trying to evolve beyond.

Overall, the Razorweave Core Rulebook represents a sophisticated attempt to bridge traditional and fiction-first RPG design. For GMs in my position, actively converting their approach, it provides substantial scaffolding while pointing toward a more narrative-centered future. The question remains whether the system's mechanical richness will ultimately serve or subvert that goal at individual tables.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Nine-step character creation process requires significant decision-making before players have experiential context with the system",
      impact: "New players may make suboptimal choices or feel overwhelmed at session zero; converting GMs like myself may default to familiar optimization patterns rather than fiction-first character discovery",
      location: "Character Creation Flow (Steps 1-9)"
    },
    {
      section: "Chapters 14-17 - Skills and Proficiencies Reference",
      issue: "Extensive mechanical reference sections may inadvertently encourage ability-first thinking over situation-first narration",
      impact: "Players browsing these chapters might approach play as 'what can I do with my Skills' rather than 'what does my character want to do'; this tension undermines the fiction-first philosophy for those still developing that mindset",
      location: "Skills Reference by Attribute, Proficiencies Reference by Domain"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The three parallel tracking systems, while elegant in design, create cumulative cognitive load during actual play",
      impact: "GMs must simultaneously manage scene Tags, character Conditions, and multiple Clocks, which may fragment attention during high-stakes moments; my Systems Integrator approach helps, but less systematic GMs might struggle",
      location: "Tags vs Conditions distinction, Clock management guidelines"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat action types (Strike, Maneuver, Set Up, Defend/Withdraw) combined with positioning Tags and environmental factors create decision density",
      impact: "Combat may slow down as players process tactical options; Achiever-archetype players might optimize turns rather than describe fictional actions, working against the fiction-first approach",
      location: "Combat Actions, Positioning and Environment sections"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless, solo, and asynchronous play modes are mentioned but lack dedicated mechanical support",
      impact: "Converting GMs interested in exploring alternative play structures may find insufficient guidance; the claim feels more aspirational than fully realized in this edition",
      location: "Alternative play mode descriptions"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook earns a strong recommendation for GMs, like myself, who are actively transitioning from traditional to fiction-first play. Its design philosophy explicitly supports this conversion while providing enough mechanical scaffolding to remain comfortable for Achiever-archetype players who value progression and clear systems.

The book's greatest strength is its coherent integration of Tags, Conditions, and Clocks as interconnected systems that reinforce narrative beats. For a Systems Integrator, watching these pieces interact is intellectually satisfying and practically useful. The advancement system rewards fictional engagement over mechanical accumulation, which helps retrain the optimization instincts that traditional systems develop.

Its primary weakness is the tension between fiction-first philosophy and mechanical depth. The extensive Skills/Proficiencies reference and the detailed character creation process may inadvertently anchor players in ability-first thinking. For converting GMs, this requires conscious effort to guide players toward situational descriptions rather than mechanical invocations.

Practical usability is high once the initial learning curve is surmounted. The GM chapters provide actionable guidance for session and campaign management. The four-part organization makes reference lookup straightforward during play.

For my table, I would adopt this system with two modifications: a simplified character creation pathway for newcomers (perhaps deferring some Skill/Proficiency choices until after initial sessions), and explicit session-zero calibration discussions about fiction-first expectations. With those adjustments, Razorweave offers a compelling framework for the kind of play I'm working toward.`
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

- **Archetype:** Achiever
- **Experience:** Long-term GM
- **Fiction-First Stance:** Converting
- **Cognitive Style:** Systems Integrator

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
