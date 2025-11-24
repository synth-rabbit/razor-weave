/**
 * Execute reviewer prompt for persona gen-1763913096255-zyz1cc0x5
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona zyz1cc0x5
 * - Archetype: Achiever
 * - Experience: Newbie (0-1 years)
 * - Conversion Status: Converting
 * - Narrative/Mechanics: Neutral
 * - GM Role: Non-GM
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
const personaId = 'gen-1763913096255-zyz1cc0x5';
const personaName = 'Achiever Newbie (Converting, Concrete Thinker)';

// Review data based on thorough analysis from the Achiever/Newbie persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As someone new to tabletop RPGs who's looking for concrete goals and clear achievements, I approached the Razorweave Core Rulebook wanting to know: can I understand this, and will it help me feel like I'm accomplishing things at the table?

The good news is that the book is organized in a way that makes sense. It starts with basics and builds up - chapters 1-5 set the foundation, then character creation, then the actual rules for playing. I appreciated that Chapter 3 "How to Use This Rulebook" told me I don't need to memorize everything before I play. That took some pressure off.

The dice system is actually pretty clear once you get it: roll 4d6, add your Attribute (which is just a number from 0-2 to start), and compare to a target number (DC). The DC ladder is helpful - DC 12 is Easy, DC 14 is Routine, DC 16 is Tough, and so on up to DC 22 for Legendary. I like having those specific numbers because as a concrete thinker, I can look at a situation and think "okay, this seems Tough, so probably DC 16."

The outcome tiers are also spelled out clearly: Critical Success when you beat the DC by 5 or more, Full Success when you meet or beat it, Partial Success when you're 1-2 below, Failure at 3 or more below, and Critical Failure at 7 or more below (or all 1s on the dice). This gives me specific targets to work toward, which I appreciate as an achiever.

Character creation in Chapter 6 follows a clear 9-step process, which is exactly what I need. Having that numbered list (Step One: Choose a Concept, Step Two: Define Core Identity Elements, etc.) makes me feel like I'm making progress as I work through it. The example character "Rella" throughout the chapter is helpful for seeing how it all comes together.

The Attribute spread is simple: one attribute at 2, two at 1, one at 0. That's easy to remember and apply. Skills and Proficiencies are less clear to me though - the book says they're "open" and you work with your GM to define custom ones. As a newbie without a GM yet, I don't have clear examples of what's too broad or too narrow. The Skills Reference in Chapter 15 helps, but I'd have appreciated more explicit guidance on "here are 10 good starter skills for most games."

Combat makes sense to me. Four main actions: Strike (attack), Maneuver (reposition or change the situation), Set Up (create advantage for later), and Defend/Withdraw (protect yourself or escape). The book is clear that you don't use hit points - instead, you track Resolve with Clocks, which are these segment trackers that fill up until someone is "taken out." I understand the concept, but I'm not 100% sure how many segments an average enemy should have, or how many segments my character should have. That feels like something my GM would decide.

The thing that works against my achiever mindset is the "fiction first" philosophy throughout the book. The system really wants me to describe what I'm doing narratively before reaching for dice, and outcomes are meant to flow from the story. That's fine, but as someone who likes clear goals and measurable progress, I wish there were more concrete benchmarks. When do I "level up"? The advancement system in Chapter 19 uses milestones, not XP. I understand why this approach can work, but as a newbie I don't have the experience to know what constitutes a meaningful milestone.

The Clock system is something I both like and feel uncertain about. Progress Clocks for goals and Pressure Clocks for threats make logical sense. But the book says things like "successful Checks tick the Clock forward" without always being specific about how many segments. Is it always 1 segment for success and 2 for critical success? The examples help, but there seems to be a lot of "GM decides" which is hard for me to evaluate as someone who hasn't run or played a session yet.

The Tags and Conditions are helpful concrete descriptors. Tags describe the environment (Dim Light, Cramped, Elevated, Solid Cover), and Conditions describe your character's state (Exhausted, Bleeding, Frightened). These give specific names to situations that affect rolls. I can work with that.

Overall, I think I could play this game with help from experienced players. The core mechanics are clear. My concern is that a lot depends on GM interpretation and "the fiction," and as a converting player who's neutral on the narrative vs. mechanics spectrum, I'm not sure how well I'll adapt to that flexibility. I want to accomplish things and see my character grow, and the system seems to support that - but the growth feels more qualitative than quantitative.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Skills and Proficiencies are described as 'open lists' with GM collaboration, but insufficient starter examples for newbies",
      impact: "New players without an experienced GM may struggle to create balanced, appropriate Skills and Proficiencies",
      location: "Steps Four and Five: Choose Skills and Choose Proficiencies"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock tick rates are not consistently specified (how many segments per success type)",
      impact: "Newbie players cannot reliably predict how long goals or threats will take to resolve without GM guidance",
      location: "Advancing Clocks section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "No guidance on standard Resolve Clock sizes for player characters or typical enemies",
      impact: "New players cannot gauge combat difficulty or duration without GM interpretation",
      location: "Resolve Instead of Hit Points section"
    },
    {
      section: "Chapter 19 - Advancement and Long Term Growth",
      issue: "Milestone-based advancement without clear criteria for what constitutes advancement-worthy achievements",
      impact: "Achiever-type players may feel uncertain about when they should expect character growth or rewards",
      location: "Advancement Overview (referenced from Chapter 12)"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The 'intent and approach' framework is well-explained but may feel abstract to concrete thinkers",
      impact: "New players may hesitate to declare actions, unsure if their approach is 'valid' or will map to the right Attribute",
      location: "Declaring Intent and Approach section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a well-structured system that successfully explains its core mechanics clearly. The 4d6 resolution system, DC ladder, and outcome tiers are concrete and learnable. Character creation follows a logical 9-step process that achiever-type learners can track. However, the system's emphasis on "fiction first" play and GM interpretation creates uncertainty for newbies who lack experienced guidance. Skills, Proficiencies, and Clocks rely heavily on collaboration with a GM, which is challenging for someone just entering the hobby. The milestone-based advancement, while narratively flexible, may frustrate achievers who want clear benchmarks for progress. For a newbie with access to an experienced group, this rulebook would serve well. For someone trying to learn solo or start a group of fellow newbies, additional guidance or starter modules would be valuable. Rating: Solid foundation with a learning curve that favors having experienced guidance.`
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
- **Experience:** Newbie (0-1 years)
- **Conversion Status:** Converting (new to TTRPGs)
- **Narrative/Mechanics Balance:** Neutral
- **GM Role:** Non-GM (player only)
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
