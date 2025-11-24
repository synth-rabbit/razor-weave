/**
 * Execute reviewer prompt for persona gen-1763913096261-049jryt1u
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona (Tactician)
 * - Archetype: Tactician
 * - Experience: Experienced 3-10 years
 * - Fiction-First: Converting
 * - Numerical Preference: Needs Concrete Numbers
 * - GM Style: Prepared Sandbox
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
const campaignId = 'campaign-20251123-222404-g1zvdflh';
const personaId = 'gen-1763913096261-049jryt1u';
const personaName = 'Generated Persona (Tactician)';

// Review data based on thorough analysis from the persona's perspective
// Key traits informing this review:
// - Tactician archetype: values strategic depth, planning, resource management
// - Experienced 3-10 years: solid foundation, expects systems to be internally consistent
// - Converting to fiction-first: adapting from more traditional systems, needs bridge concepts
// - Needs Concrete Numbers: wants clear quantitative benchmarks, not just narrative guidance
// - Prepared Sandbox: prefers structured GM prep with clear encounter guidelines
// - Abstract Thinker: can grasp conceptual frameworks, but needs concrete anchors

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 6
  },
  narrative_feedback: `As a tactician with nearly a decade of experience coming from more crunchy systems, I approached Razorweave looking for strategic depth beneath its fiction-first surface. The book presents a coherent philosophy, but my need for concrete numbers left me wanting more precise frameworks in several key areas.

The core resolution system (4d6 + modifiers vs DC ladder) is elegantly simple, and I appreciate that the math is transparent. The DC ladder from 12 (Easy) to 22 (Legendary) gives me the kind of numerical scaffolding I need. However, the Advantage/Disadvantage system caps at +/-2 dice, which flattens the strategic impact of stacking multiple favorable conditions. For a tactician who enjoys building optimal positions through careful planning, this cap feels limiting.

What I found genuinely valuable was the structured approach to Clocks. The Clock system provides the strategic pacing tool I was looking for. Seeing segment counts (4, 6, 8) tied to complexity gave me concrete prep benchmarks. The dual-clock examples (evacuation vs flood, investigation vs cover-up) demonstrate elegant tactical tension that I can build scenarios around.

The combat chapter, however, left me frustrated. The Resolve Clock system replacing hit points is philosophically interesting, but the book provides almost no numerical guidance for scaling threats. The single example mentions "6 segments for a dangerous VPC" but I need a full threat-scaling table: minions (2-3 segments), standard (4), dangerous (6), boss (8+), legendary (10+). Without this, my prepared sandbox approach requires significant house-ruling to build balanced encounters.

Character creation offers only a single attribute spread (2/1/1/0), which limits the tactical differentiation I expect at session zero. Where are the alternative arrays for specialized builds? A tactician character should be able to trade breadth for depth if the player chooses that trade-off consciously.

The Skills and Proficiencies chapters are well-structured and provide good examples of flexible application across attributes. The case studies showing how Streetwise or Field Medicine can pair with different attributes depending on approach demonstrates the system's flexibility. But again, I want numerical guidance: how much does a relevant Proficiency typically lower a DC? The text says "one or two steps" in one place but elsewhere suggests Advantage instead. Consistency would help my prep significantly.

The Tags and Conditions vocabulary is excellent for a converting player like me. Having concrete labels (Exhausted, Bleeding, Cramped, Slick) bridges the gap between narrative description and mechanical effect. The warehouse fight example in Chapter 9 shows exactly how Tags create tactical texture.

For GM-facing content, Chapter 21 (Running Sessions) and Chapter 24 (NPCs, VPCs, Enemies) will be essential for my prepared sandbox style, but I found myself wishing for more structured encounter building tools. The faction and fronts material (Chapter 25) provides good strategic scaffolding for campaign-level play.

Overall, Razorweave is a thoughtful system that will reward investment, but tacticians converting from number-heavy systems should expect to develop supplementary reference sheets for threat scaling and encounter balance.`,
  issue_annotations: [
    {
      section: "Chapter 10: Combat Basics",
      issue: "Resolve Clock sizing lacks systematic threat-scaling guidelines",
      impact: "GMs preparing sandbox content cannot quickly calibrate encounters without house-ruling a threat tier system. The single '6-segment dangerous VPC' example is insufficient for building diverse combat scenarios.",
      location: "Section 'Resolve Instead of Hit Points' - needs a threat tier table (minion/standard/dangerous/boss/legendary with segment counts)"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Only one attribute spread offered (2/1/1/0)",
      impact: "Tactical character differentiation is limited at creation. Players seeking specialist builds (3/1/0/0 or 2/2/1/-1) have no sanctioned options, reducing strategic choice at session zero.",
      location: "Step Three: Assign Attributes - should offer 2-3 alternative arrays with trade-off explanations"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Advantage/Disadvantage cap at +/-2 reduces stacking value",
      impact: "Tactical planning to create optimal conditions yields diminishing returns beyond two factors. For tacticians who enjoy building layered advantages, this cap feels arbitrary without narrative justification.",
      location: "Section 'Advantage, Disadvantage, Tags, and Conditions' - needs design rationale or optional rule for extended stacking"
    },
    {
      section: "Chapter 16: Proficiencies System Overview",
      issue: "Inconsistent guidance on Proficiency mechanical benefits",
      impact: "Text alternates between 'lower DC by one or two steps' and 'grant Advantage' without clear criteria for which approach applies. Prepared sandbox GMs need consistent rulings to maintain encounter integrity.",
      location: "Section 'Using Proficiencies in Play' - needs decision tree or priority system"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook presents a well-designed fiction-first system with genuine strategic depth waiting beneath its narrative surface. For my profile - a mid-experience tactician converting from crunchier systems who needs concrete numbers and prepares sandbox-style campaigns - the book delivers approximately 65% of what I need out of the box.

Strengths: Clear DC ladder, elegant Clock mechanics with concrete segment guidelines, well-organized Tag/Condition vocabulary, flexible Skill/Proficiency system with good examples, and strong conceptual frameworks an abstract thinker can work with.

Critical gaps: Missing threat-scaling tables for combat encounter prep, limited character creation options for tactical differentiation, Advantage cap limiting strategic depth, and inconsistent Proficiency benefit guidelines.

Recommendation: Excellent for narrative-focused tables willing to develop supplementary reference materials. Tactician-archetype players and prepared-sandbox GMs should budget session zero time for house-ruling threat tiers and encounter calibration. The abstract frameworks are sound, but converting players who need concrete numbers will want to build reference sheets before their first combat-heavy session.

I would happily run this system, but I'll be creating my own threat tier table and alternative attribute arrays before session one.`
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
const markdown = `# Review: ${personaName}

**Campaign:** ${campaignId}
**Persona ID:** ${personaId}
**Date:** ${new Date().toISOString()}

## Persona Profile

- **Archetype:** Tactician
- **Experience:** Experienced (3-10 years)
- **Fiction-First Stance:** Converting
- **Numerical Preference:** Needs Concrete Numbers
- **GM Style:** Prepared Sandbox
- **Cognitive Style:** Abstract Thinker

## Structured Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Clarity & Readability** | ${reviewData.ratings.clarity_readability}/10 | Well-organized, clear prose, good examples |
| **Rules Accuracy** | ${reviewData.ratings.rules_accuracy}/10 | Core mechanics sound, some gaps in calibration guidance |
| **Persona Fit** | ${reviewData.ratings.persona_fit}/10 | Good conceptual frameworks, insufficient numerical anchors for tactician needs |
| **Practical Usability** | ${reviewData.ratings.practical_usability}/10 | Requires supplementary house-ruling for prepared sandbox prep |

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
*Execution time: ${agentExecutionTime}ms*
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
