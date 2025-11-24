/**
 * Execute reviewer prompt for persona gen-1763913096252-8omf9tia8
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 219238
 * - Archetype: Explorer
 * - Experience: Hybrid GM/Player
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Railroad Conductor
 * - Cognitive Style: Pattern-Driven
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
const personaId = 'gen-1763913096252-8omf9tia8';
const personaName = 'Generated Persona 219238';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 7,
    persona_fit: 8,
    practical_usability: 7
  },
  narrative_feedback: `As an Explorer archetype with hybrid GM/Player experience who evangelizes fiction-first design while simultaneously needing concrete numbers, the Razorweave Core Rulebook presents a fascinating tension that I find both compelling and occasionally frustrating. Let me break this down through my pattern-driven cognitive lens.

The structure of this rulebook is elegant and immediately recognizable as designed for exploration. The flow from Part I (Foundations) through Part II (Skills/Proficiencies) to Part III (GM Section) creates a clear discovery path. Each chapter builds on previous concepts while opening new avenues for investigation. This appeals deeply to my Explorer nature - the rulebook itself becomes something to explore.

The fiction-first philosophy is stated clearly and consistently throughout Chapters 1-5. The principle that "the story is always the starting point" (Chapter 2) and "you begin by understanding the situation, describing what the characters do, and only then reaching for rules if the outcome is uncertain and meaningful" aligns perfectly with my evangelical view of fiction-first design. This is how games should work.

The 4d6 core resolution system with its Advantage/Disadvantage mechanism (roll extra dice, keep best/worst 4) creates recognizable patterns that my brain can latch onto. The outcome tier system - Critical Success (margin >= +5), Full Success (>= 0), Partial Success (-1 to -2), Failure (<= -3), Critical Failure (<= -7) - provides the kind of structured probability space I crave.

However, here's where my "Needs Concrete Numbers" trait creates friction with the text. The DC ladder (Easy 12, Routine 14, Tough 16, Hard 18, Heroic 20, Legendary 22) is beautifully laid out in Chapter 8, but the guidance for selecting between these tiers remains frustratingly narrative. When the book says "Use lower DCs when characters have strong fictional positioning, good information, and safe conditions," I want to know: how much lower? If they have Solid Cover, does that shift DC by one tier or two? The pattern isn't explicit.

The Clock system (Chapter 9) is excellent for exploration-based play. Progress Clocks and Pressure Clocks create visible pacing mechanisms that help me as a Railroad Conductor-style GM maintain narrative momentum while giving players agency within structured bounds. The segment counts (4, 6, or 8) provide concrete options, but the book doesn't offer guidance on when to use each size. A 6-segment "Expose the Official" Clock is mentioned, but why 6 and not 4 or 8? I need to infer these patterns myself.

Chapter 10 (Combat Basics) replaces hit points with Resolve Clocks, which is narratively elegant but mechanically abstract. The book states "2-3 segments for quick, cinematic threats, more for major foes" but doesn't provide a VPC/enemy catalog with pre-set Resolve values. As an Explorer who GMs, I want to discover enemies and their capabilities through play, but I also want reliable baseline numbers to start from.

The Skills system (Chapters 14-15) and Proficiencies (16-17) embrace open lists and GM collaboration, which serves exploration well - I can discover what Skills exist in my world organically. But the lack of a definitive list or explicit mechanical bonuses means I'm constantly calibrating expectations during play rather than beforehand.

Chapter 18's Tags and Conditions reference is perhaps the most useful section for my playstyle. The tables providing Environmental Tags, Situational Tags, Physical Conditions, and Mental/Social Conditions give me concrete vocabulary to pattern-match during sessions. This is exactly what I need: clear categories with mechanical teeth.

The GM Section (Part III) speaks directly to my Railroad Conductor philosophy in Chapter 21 (Running Sessions). The advice about framing scenes, managing pacing, and using Clocks to track faction activities gives me tools to create structured exploration experiences. The session structure feels natural - preparation leading to engagement leading to resolution.

What truly excites me as an Explorer is Chapter 26 (Alternative Play). The support for GMless cooperative play, solo play, and asynchronous modes opens exploration possibilities beyond traditional table formats. These aren't afterthoughts; they're presented as legitimate ways to experience the system.

The advancement system (Chapter 19) offers clear triggers (session-based, milestone, downtime) but leaves specific thresholds undefined. How many sessions constitute a "few"? What makes a milestone "significant"? My pattern-driven cognition wants explicit criteria I can recognize and apply consistently.

Overall, Razorweave presents a beautiful exploration framework that faithfully executes fiction-first principles. For someone who evangelizes this approach while needing concrete numbers to implement it, the book provides strong conceptual architecture but requires me to construct my own numerical scaffolding.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "DC selection guidance is purely narrative without quantified modifiers for common situations",
      impact: "Hybrid GMs who run structured exploration must improvise DC adjustments mid-scene, risking inconsistent difficulty curves across similar scenarios",
      location: "Setting DCs, pages covering DC ladder"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock segment counts (4, 6, 8) lack explicit selection criteria for different scenario types",
      impact: "Pattern-driven GMs cannot reliably predict appropriate Clock sizing for new exploration scenarios without trial and error",
      location: "Clock Structure sections, Advancing Clocks"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clock sizing for enemies described in ranges ('2-3 segments for quick threats') without enemy templates or sample stat blocks",
      impact: "Explorers who GM must create enemy Resolve values from scratch with no baseline patterns to reference",
      location: "Resolve Instead of Hit Points, Why Clocks and Not Hit Points"
    },
    {
      section: "Chapter 14-17 - Skills and Proficiencies",
      issue: "Open Skill/Proficiency lists with GM collaboration requirement but no mechanical bonus specification",
      impact: "Railroad Conductor GMs who prefer predictable mechanical frameworks must negotiate Skill/Proficiency effects case-by-case, slowing structured play",
      location: "Choosing Skills, Creating Custom Skills, Proficiency chapters"
    },
    {
      section: "Chapter 19 - Advancement and Long Term Growth",
      issue: "Advancement triggers described qualitatively ('every few sessions', 'significant milestones') without explicit thresholds",
      impact: "Pattern-driven players and GMs cannot reliably forecast character growth curves or plan long-term campaign arcs around concrete advancement points",
      location: "When Advancement Happens, Session-Based Advancement, Milestone Advancement"
    },
    {
      section: "Chapter 18 - Extended Tags and Conditions Reference",
      issue: "Excellent Tag/Condition vocabulary but inconsistent specification of mechanical effects (some grant Advantage, some shift DC, some do both)",
      impact: "Creates cognitive load during play when determining which mechanical lever a Tag affects - requires per-situation interpretation",
      location: "Environmental Tags table, Situational & Atmospheric Tags table"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook represents an exceptionally well-crafted fiction-first system that will delight Explorers and evangelical fiction-first advocates. The structural patterns - 4d6 resolution, outcome tiers, Clocks, Tags, Conditions - create a coherent design language that supports emergent gameplay.

For someone in my specific position - an Explorer archetype with hybrid GM/Player experience who evangelizes fiction-first but needs concrete numbers while running Railroad Conductor-style structured exploration with pattern-driven cognition - this book delivers approximately 80% of what I need.

The 20% gap consists almost entirely of numerical specificity: explicit DC adjustment rules, Clock sizing guidelines, enemy Resolve templates, Skill/Proficiency mechanical effects, and advancement thresholds. These are exactly the kinds of concrete scaffolding I require to implement the beautiful fiction-first philosophy with consistency.

My recommendation: this system will become my primary exploration-focused TTRPG, but I will need to create supplementary reference sheets with explicit numerical guidelines. The core design is sound enough that adding this structure won't break anything - it will simply make the patterns I naturally seek visible on the page.

Rating Summary:
- Clarity & Readability: 9/10 - Outstanding organization, clear prose, logical chapter progression
- Rules Accuracy: 7/10 - Mechanics are consistent but intentionally underspecified for numbers-focused GMs
- Persona Fit: 8/10 - Excellent for Explorers and fiction-first evangelists; requires adaptation for concrete-numbers preference
- Practical Usability: 7/10 - Requires significant GM calibration work before sessions for structured play

For pure fiction-first tables comfortable with organic mechanical interpretation, this would rate higher. For my specific needs profile, it's a strong foundation requiring personal customization.`
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
- **Experience:** Hybrid GM/Player
- **Fiction-First Stance:** Evangelical
- **Narrative/Mechanics:** Needs Concrete Numbers
- **GM Philosophy:** Railroad Conductor
- **Cognitive Style:** Pattern-Driven

## Structured Ratings

| Category | Score |
|----------|-------|
| Clarity & Readability | ${reviewData.ratings.clarity_readability}/10 |
| Rules Accuracy | ${reviewData.ratings.rules_accuracy}/10 |
| Persona Fit | ${reviewData.ratings.persona_fit}/10 |
| Practical Usability | ${reviewData.ratings.practical_usability}/10 |

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
