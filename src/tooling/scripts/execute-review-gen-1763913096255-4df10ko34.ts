/**
 * Execute reviewer prompt for persona gen-1763913096255-4df10ko34
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 4df10ko34
 * - Archetype: Socializer
 * - Experience: Long-term GM
 * - Fiction-First: Skeptical
 * - Narrative/Mechanics: Neutral mechanics
 * - GM Philosophy: Non-GM philosophy
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
const personaId = 'gen-1763913096255-4df10ko34';
const personaName = 'Socializer / Long-term GM';

// Review data based on thorough analysis from the Socializer/Long-term GM persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 7,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `As a Socializer with extensive GM experience, I approach RPGs primarily for the interpersonal connections they foster - the shared laughter, dramatic moments, and lasting friendships built around the table. While I am skeptical of "fiction-first" philosophies that sometimes feel like excuses for vague rules, I recognize when a system genuinely tries to support collaborative storytelling. Razorweave presents an interesting case.

The system's core resolution is mechanically clean: 4d6 summed, add Attribute, compare to DC ladder (12/14/16/18/20/22), derive outcome from margin. The Advantage/Disadvantage system (5d6 or 6d6, keep best/worst 4) is elegant and familiar enough that players will grasp it quickly. The outcome tiers (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse, Critical Failure at -7 or all 1s) provide meaningful gradations that support dramatic tension.

However, as a pattern-driven thinker who has run games for years, I notice several places where the system creates friction for the kinds of social, character-driven play I value most:

First, the Presence (PRE) attribute feels underspecified for social encounters. Chapter 8 discusses intent and approach well, but social resolution examples are sparse compared to physical action. When I want to run intricate negotiation scenes or complex political machinations - the bread and butter of my campaigns - I find myself having to extrapolate from combat examples rather than working from dedicated social mechanics.

Second, the Clocks system, while visually intuitive, lacks guidance for social and relationship tracking. There are "Expose the Official" and "Cover-Up" Clocks in Chapter 9, which is promising, but I would want more extensive examples of relationship Clocks, faction standing Clocks, and social reputation tracking. My players love watching their social maneuvering pay off across sessions, and the current Clock guidance feels combat/crisis-oriented.

Third, the Proficiencies chapter (16-17) has excellent community and institutional proficiencies like "Community Organizing," "Court Etiquette," and "Neighborhood Fixer." These speak directly to social gameplay. But the Skills chapter (14-15) feels skewed toward action - Persuasion & Appeal, Deception & Performance, and Insight & Empathy are present but receive less detailed treatment than physical skills.

From my "Non-GM philosophy" perspective (I tend to share narrative authority with players), I appreciate Chapter 5's discussion of GMless cooperative play and shared authority modes. However, the procedural support for these modes is thin - there are no concrete turn structures or scene-framing protocols for groups without a dedicated GM. This is a missed opportunity.

The Tag system's "Atmospheric Tags" (Tense, Festive, Solemn, Suspicious) show the designers understand social texture, but these tags need more mechanical teeth. How exactly does "Tense" affect a PRE Check? The table says "Higher DCs for clumsy social approaches" but that is qualitative rather than quantitative. I want to know: is Tense +1 DC? +2 DC? Does it grant Disadvantage? Pattern-driven players like me want clearer mappings.

What works well for socializers: the emphasis on relationships and personal threads in character creation (Steps 7-8), the clear statement that "failure creates momentum" rather than ending scenes, the guidance that partial success should introduce complications rather than just reduced effect. These principles align with dramatic, relationship-focused play.

The Conditions system includes "Compromised Reputation," "Suppressed," and "Inspired" which directly model social/emotional states. That is thoughtful design. But I note that physical Conditions (Bleeding, Exhausted, Restrained) have clearer mechanical definitions than social ones.

Bottom line: Razorweave has the bones to support social play, but its heart beats strongest for action-adventure. A Socializer can make this system work, but will need to do more improvisational work in social scenes than they would with a system explicitly designed for intrigue and relationships.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Social encounter resolution examples are sparse compared to physical action examples; PRE-based checks receive less detailed treatment",
      impact: "GMs and players focused on social play must extrapolate from combat examples rather than working from dedicated social mechanics guidance",
      location: "Declaring Intent and Approach, Interpreting Outcomes sections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Atmospheric Tags like Tense, Festive, and Suspicious have qualitative effects ('higher DCs for clumsy approaches') rather than quantitative mechanical specifications",
      impact: "Pattern-driven players and GMs cannot reliably predict how social scene tags will affect rolls; inconsistent table rulings likely",
      location: "Situational and Atmospheric Tags table and surrounding text"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless cooperative play and shared authority modes are mentioned but lack concrete procedural support - no turn structures, scene-framing protocols, or authority distribution mechanics",
      impact: "Groups wanting to share narrative authority have no scaffolding; 'GMless' becomes GM-less-structured rather than collaboratively structured",
      location: "GMless Cooperative Play section"
    },
    {
      section: "Chapter 18 - Extended Tags and Conditions Reference",
      issue: "Mental and Social Conditions are less mechanically specified than Physical Conditions; Compromised Reputation says 'higher DCs' without precision",
      impact: "Social consequence tracking is vaguer than physical consequence tracking; social-focused players feel their domain is less mechanically supported",
      location: "Mental and Social Conditions table"
    },
    {
      section: "Chapter 14-15 - Skills System",
      issue: "Physical skills receive more detailed coverage than social skills; Persuasion & Appeal, Deception & Performance, and Insight & Empathy entries are shorter and less example-rich",
      impact: "Players building socially-focused characters have less guidance on skill application than those building action-focused characters",
      location: "Skills Reference by Attribute - PRE section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "Relationship establishment (Step 7) is brief compared to mechanical elements; no structured relationship mapping or connection web mechanics",
      impact: "Socializer players who want rich inter-character connections must improvise relationship tracking methods not provided by the system",
      location: "Step Seven: Establish Background and Relationships"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a competent, well-organized TTRPG that prioritizes flexible resolution over social-specific mechanics. For a Socializer with long-term GM experience and a pattern-driven cognitive style, the system presents a mixed picture: the foundational resolution is sound and the fiction-first principles genuinely support dramatic play, but the mechanical support for intricate social encounters, relationship tracking, and shared authority play lags behind the support for action-adventure. A Socializer can run excellent campaigns in this system, but will be doing more improvisational heavy lifting in their preferred play domains than the system's action-focused players will in theirs. The bones are good; the social flesh needs development. Rating: Solid foundation, social expansion desired.`
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

- **Archetype:** Socializer
- **Experience:** Long-term GM
- **Fiction-First Stance:** Skeptical
- **Narrative/Mechanics:** Neutral mechanics preference
- **GM Philosophy:** Non-GM (shared authority preference)
- **Cognitive Style:** Pattern-Driven

## Structured Ratings

| Category | Rating |
|----------|--------|
| **Clarity & Readability** | ${reviewData.ratings.clarity_readability}/10 |
| **Rules Accuracy** | ${reviewData.ratings.rules_accuracy}/10 |
| **Persona Fit** | ${reviewData.ratings.persona_fit}/10 |
| **Practical Usability** | ${reviewData.ratings.practical_usability}/10 |

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
