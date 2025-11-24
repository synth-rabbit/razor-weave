/**
 * Execute reviewer prompt for persona gen-1763913096264-7ah9suds4
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 7ah9suds4
 * - Archetype: Power Gamer
 * - Experience: Newbie (0-1 years)
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Narrative Purist
 * - GM Philosophy: Collaborative Storyteller
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
const personaId = 'gen-1763913096264-7ah9suds4';
const personaName = 'Generated Persona 7ah9suds4';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `I've only been playing TTRPGs for about eight months now, and I came to this rulebook looking for a system I could really sink my teeth into and eventually teach to my friends. What drew me in was hearing it described as "fiction-first" - I'm totally sold on narrative gaming even though I haven't been playing long. I want the story to drive everything, but I also want to understand how to build effective characters and make smart tactical choices. Razorweave delivers on a lot of that, though there are places where I wished for more concrete guidance.

First, the good stuff - and there's a lot of it. The book's structure is genuinely welcoming. Starting with "Welcome to the Game" and building up through Core Concepts before hitting any crunch? That's exactly how I needed to be introduced. I read Chapters 1 through 5 in one sitting and actually understood what kind of game this was trying to be. The fiction-first philosophy is explained clearly enough that I could explain it to someone else, which is huge for me because I want to evangelize this system to my gaming group.

The 4d6 resolution system clicks in my head better than d20 systems I've tried. The probability feels different - more clustered around the middle, which means my character's bonuses actually matter more. The outcome tiers (Critical Success, Full Success, Partial Success, Failure, Critical Failure) give me concrete categories to think about. When I read that Partial Success is "Margin -1 to -2," I knew exactly what that meant mathematically. That kind of precision helps me as someone who wants to understand the system deeply.

Character creation walks me through each step, which I appreciated. The Attribute spread (one at 2, two at 1, one at 0) is simple and creates meaningful trade-offs right from the start. I actually did a practice build following the Rella example, and it helped me understand how Skills and Proficiencies work together. The distinction between Skills (what you do under pressure) and Proficiencies (what you understand deeply) finally makes sense after reading those chapters. In other systems I've tried, these blur together confusingly.

The Tags, Conditions, and Clocks chapter is where the system really shines for me as a narrative purist who still wants structure. Tags like Dim Light, Cramped, Slick - they're not just flavor text. They mechanically grant Advantage or Disadvantage. That's the bridge between "cool description" and "actual game effect" that I've been looking for. Clocks are brilliant for tracking tension - I love that they're visual and everyone can see how close we are to something happening.

Combat surprised me. I expected to dislike it since I'm more narrative-focused, but the Resolve Clock system instead of hit points actually appeals to my storytelling brain. The idea that enemies are "out" when their clock fills - and "out" can mean fleeing, captured, or killed depending on what we decided as a table - that's genuinely exciting. It means combat has narrative stakes I care about, not just "did I reduce the number to zero."

The four combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) are clean and memorable. I can actually remember them all, which wasn't true with other systems where I'd have like fifteen options I'd forget. The book explicitly says that against tough enemies, you should expect early rounds to use more Set Ups and Maneuvers before Strikes become effective. That's the kind of tactical advice I crave as someone who wants to play well.

Now, my frustrations - mostly around wanting MORE concrete examples and clearer optimization paths.

The Skills reference chapters provide example entries, but I wanted to see more side-by-side comparisons. When I'm building a character, how do I know if Stealth & Evasion or Acrobatic Positioning is better for a mobile infiltrator concept? The book tells me what each one does, but not how to weigh them against each other. As a new player who wants to make effective choices, I need that kind of guidance.

Advancement is mentioned but Chapter 19 isn't included in what I reviewed, and I kept wondering: how quickly do characters grow? What's the XP cost for a new Skill versus improving an Attribute? The overview in Chapter 12 mentions three progression models (XP-based, milestone-based, session-based) but doesn't give me numbers to plan around. I'm the kind of player who wants to map out a character's growth trajectory.

The "Ways to Play" chapter mentions GMless play, solo play, and duet play, which is awesome - I sometimes can only get one other person to play with me. But the variant rules chapter (20) that would tell me how to actually run those modes isn't in the core part of what I reviewed thoroughly. I need concrete procedures, not just "the system supports this."

Some of the worked examples are great, but there aren't enough of them. The warehouse fight example with Tags (Cramped, Fragile Cover, Slick) is exactly what I need - concrete descriptions of how mechanics interact. I wanted that level of detail for more scenarios: a social negotiation, an investigation scene, a chase sequence. The examples that exist are helpful; I just wanted more.

The Conditions reference mentions things like Exhausted, Bleeding, Frightened, Restrained - but the full list is in the Glossary and extended reference chapters rather than in one easy-to-scan table during character creation. When I'm building a character, I want to know what Conditions I might face so I can prepare for them. A "common Conditions quick reference" in the character creation chapter would help.

For my friends who I want to bring into this game, the rulebook is accessible but long. Chapters 1-5 are great for explaining the philosophy, but I'd love a "teach this system in 10 minutes" summary I could hand to someone who's never played any TTRPG. The book assumes you'll read it in order, which is good for deep learning but makes quick reference harder.

Despite these frustrations, I'm genuinely excited about Razorweave. The fiction-first philosophy is authentic - it's not just marketing speak. The mechanical systems support narrative play without feeling like we're just making things up arbitrarily. I can see myself running this for years and teaching it to new players.

As someone who wants to be evangelical about games I love, Razorweave gives me a system I can actually explain to people. "You roll 4d6, add your Attribute and Skill, compare to the difficulty, and the margin tells you how well you did" - that's a pitch I can deliver. The philosophy of "fiction first, mechanics second" is compelling and defensible.

I just wish there were more worked examples, clearer character optimization guidance, and a quick-start summary. The system is good enough that I want those tools to help me share it.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "While the step-by-step process is clear, there's limited guidance on how to evaluate trade-offs between different Skill choices for similar concepts",
      impact: "New players who want to build effective characters may struggle to distinguish between overlapping options without trial and error",
      location: "Step Four: Choose Skills, Step Five: Choose Proficiencies"
    },
    {
      section: "Chapter 12 - Downtime, Recovery, Advancement Overview",
      issue: "The chapter describes three progression models but doesn't provide specific XP costs or advancement timelines that would help players plan character growth",
      impact: "Players who want to optimize long-term character development lack the numbers needed to make informed decisions",
      location: "Advancement Overview subsection"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless, solo, and duet play are described conceptually but lack procedural examples showing how core mechanics adapt to these modes",
      impact: "Groups wanting to try alternative play styles need to improvise adaptations rather than following established procedures",
      location: "GMless Cooperative Play, Solo Play, Duet Play subsections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "The full Conditions reference is split between this chapter and later reference chapters, making it harder to see all options when creating characters or planning scenes",
      impact: "Players and GMs may not realize what Conditions are available without reading multiple chapters",
      location: "Examples of Common Conditions, pointer to Chapter 18"
    },
    {
      section: "Overall Structure",
      issue: "The book is comprehensive but lacks a condensed 'quick start' or 'teach the game in 10 minutes' summary that would help evangelical players introduce the system to new groups",
      impact: "Players who want to recruit new players must create their own summaries rather than using official materials",
      location: "No dedicated quick-start section exists"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a genuinely impressive fiction-first system that manages to be both philosophically coherent and mechanically satisfying. As a newbie player who's also a power gamer at heart, I found a lot to love here - the 4d6 resolution creates interesting probability curves, the Attribute/Skill/Proficiency split makes character building meaningful, and the Tags/Conditions/Clocks framework provides exactly the kind of structure I need to make narrative play feel grounded.

My ratings reflect both enthusiasm and specific frustrations. I gave Clarity & Readability an 8/10 because the writing is genuinely clear and the book structure helps new players build understanding gradually - I just wished for more worked examples and a quick-start summary. Rules Accuracy gets 7/10 because everything presented is internally consistent, but some mechanical details (like specific XP costs) are either in chapters I didn't fully review or simply not specified. Persona Fit is 8/10 because the system actually bridges my seemingly contradictory desires - I can be a narrative purist AND make effective tactical choices - though I wanted more optimization guidance. Practical Usability is 7/10 because the book works well for deep learning but is harder to use as quick reference during play.

What makes me want to evangelize this system is that it takes fiction-first seriously without being mechanically vague. I can tell my friends "the story drives the game, but there are real rules that make your choices matter." That's the pitch that will work for my group, and Razorweave delivers on it.

The things that would make this a 9 or 10 across the board: more worked examples in every major chapter, a dedicated quick-start section, clearer advancement economics, and procedural guidance for alternative play modes. These are additions, not fixes - the core of what's here is solid.

I'm confident I can run this game for years and continue discovering new depth. I'm also confident I can teach it to new players, though I'll probably create my own cheat sheet to help with that. For a newbie player who wants both narrative richness and mechanical clarity, Razorweave is the best system I've found so far. It respects both my desire to tell great stories and my desire to understand how the game actually works.`
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

- **Archetype:** Power Gamer
- **Experience:** Newbie (0-1 years)
- **Playstyle:** Evangelical about fiction-first, Narrative Purist, Collaborative Storyteller, Concrete Thinker

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
