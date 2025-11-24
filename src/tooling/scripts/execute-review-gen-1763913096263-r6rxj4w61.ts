/**
 * Execute reviewer prompt for persona gen-1763913096263-r6rxj4w61
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 965610
 * - Archetype: Tactician
 * - Experience: Forever GM
 * - Fiction-First: Evangelical
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Non-GM
 * - Genre Flexibility: Enjoys Flexibility
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
const personaId = 'gen-1763913096263-r6rxj4w61';
const personaName = 'Generated Persona 965610';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who has GMed forever and fundamentally believes that fiction comes first, I'm genuinely impressed by what Razorweave accomplishes. This rulebook demonstrates an understanding that mechanics serve story, not the other way around. The design philosophy resonates deeply with my conviction that the best gaming happens when the fiction drives the mechanics, not when mechanics get in the way.

The clarity of this book is exceptional. The progression from foundational philosophy through mechanics to application is masterfully structured. Chapters 1-4 establish the fiction-first theology before any crunch appears - this is exactly right. By the time you reach character creation, you understand not just what to do, but why you're doing it. The writing consistently prioritizes accessibility without sacrificing depth.

What distinguishes this rulebook is its commitment to concrete numbers where it matters. The 4d6 resolution system provides clear probability bands that players can internalize. The Advancement chapters give explicit XP costs, explicit advancement timelines, and explicit paths forward. As an eternal GM who has tweaked countless systems, I appreciate that Razorweave gives me actual numbers to work with rather than fuzzy guidance. The Clocks system specifies segment counts (4, 6, 8, 10, 12). The Conditions have clear mechanical effects. The faction standing ladder (Hostile to Honored) is quantified and measurable.

But here's what truly elevates this for me: I don't have to GM it. The Multiple Ways to Play section acknowledges that fiction-first principles work equally well for GMless groups, duet play, and solo play. As a Tactician who lives for the complexity of strategic play - whether I'm plotting as a GM or scheming as a player - I find this flexibility invaluable. The system doesn't privilege the GM role as the "true" way to play. It provides a toolkit that scales from solo play through traditional campaigns.

The Skills and Proficiencies systems are admirably thorough without being overwhelming. The fact that they're organized both by domain and by attribute means I can approach character creation intuitively - either by thinking about what I want my character to do (domain) or by building from core attributes (top-down). The Conditions reference distinguishes mechanical effects clearly: Does this condition prevent actions? Does it impose disadvantage? Does it require saving throws? No ambiguity.

The combat chapter demonstrates sophisticated design. The action economy (Strike, Maneuver, Set Up, Defend/Withdraw) is balanced for both narrative flow and tactical depth. Tags and Conditions apply mechanically but don't require tracking sheets within tracking sheets. Clocks provide natural pacing for longer conflicts without being oppressive. The environmental mechanics support dynamic fiction without bogging down in positioning grids.

What I appreciate most is that every major system includes not just "how to use this" but also "here's why this mechanic matters for your fiction." The advancement chapter explains why the experience progression is paced the way it is. The faction system explains how standing creates meaningful narrative pressure. The Clocks section connects mechanical segments to story beats.

I do notice some areas where the system's flexibility could be even more explicit. The variant rules section is good, but more guidance on how to hack specific subsystems would be valuable for GMs and players who want to customize. The downtime section could benefit from more worked examples showing how downtime moves connect mechanically to advancement.

The production quality extends to the reference materials. Character sheet, session prep templates, faction fronts sheet, advancement tracker - these aren't afterthoughts. They're integral tools that reinforce the system's core philosophy. A Tactician like me studies these sheets carefully, and they reveal the designer's understanding of what actually matters at the table.

What makes this special is that it respects player agency equally with GM agency. The player-facing chapters (Character Creation, Actions and Checks, Skills, Proficiencies, Advancement) are as detailed and supportive as the GM-facing guidance. This is fiction-first authentically applied: story needs everyone at the table empowered.`,
  issue_annotations: [
    {
      section: "Chapter 5 - Ways to Play",
      issue: "While multiple play modes are described, the variant rules chapter could provide more explicit hacks for adapting core mechanics to each mode",
      impact: "Groups attempting GMless or duet play may need to infer adjustments rather than having explicit guidance",
      location: "GMless Cooperative Play, Duet Play, Solo Play subsections"
    },
    {
      section: "Chapter 12 - Downtime and Recovery",
      issue: "Downtime moves are specified mechanically but lack extensive worked examples showing how they chain together across multiple sessions",
      impact: "GMs may struggle to understand the long-term narrative pacing of downtime in practice",
      location: "Downtime Moves section"
    },
    {
      section: "Chapter 20 - Optional Variant Rules",
      issue: "Variant rules exist but could provide more guidance on which variants pair well together and potential interaction issues",
      impact: "Groups experimenting with multiple variants might create unintended mechanical conflicts",
      location: "Variant rules presentation and organization"
    },
    {
      section: "Chapter 15 - Skills Reference",
      issue: "While skills are comprehensive, some overlap in domains could be clarified with explicit guidance on when one skill applies over another",
      impact: "Ambiguity in skill selection during character creation may require GM adjudication",
      location: "Skills organized by attribute, overlapping domain definitions"
    },
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The distinction between different check types (Standard, Advantage, Disadvantage) could benefit from more concrete examples of when each applies",
      impact: "New players may second-guess themselves about which check type applies in edge cases",
      location: "Check types and when to apply each"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an exceptional achievement in fiction-first system design. As an eternal GM who fundamentally believes mechanics should serve story, I'm impressed by its authentic commitment to this philosophy. The book succeeds across every dimension that matters: clarity of communication, accuracy of rules, applicability to multiple play styles, and genuine usability at the table.

The ratings I've given reflect this assessment: 9/10 for clarity and persona fit, 8/10 for rules accuracy and practical usability. The only reason I'm not giving straight 10s is that perfection would require even more variant guidance and worked examples for edge cases.

This rulebook will serve multiple audiences well. New players find clear onramps and supportive guidance. Experienced GMs find a system that respects their expertise without condescension. Tactical players find meaningful choices and advancement paths. Players who want to tell stories without a GM get genuine support for their preferred play style.

The book's greatest strength is that it trusts the fiction. Every mechanic is designed to raise interesting questions and create dramatic moments, not to provide busy-work or simulate details. As a Tactician, I appreciate that the complexity is purposeful - each layer of rules (Tags, Conditions, Clocks, Advancement) serves narrative goals.

Recommended unconditionally for any table seeking a fiction-first system that actually delivers on its promises. The design is sophisticated, the communication is clear, and the support materials are comprehensive. This is rulebook design done right.`
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

- **Archetype:** Tactician
- **Experience:** Forever GM
- **Playstyle:** Evangelical about fiction-first, Needs Concrete Numbers, Complexity Tolerant

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
