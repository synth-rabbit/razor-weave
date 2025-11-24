/**
 * Execute reviewer prompt for persona gen-1763913096216-z68czo4h2
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 126214
 * - Archetype: Explorer
 * - Experience: Experienced (3-10 years)
 * - Fiction-First: Converting
 * - Narrative/Mechanics: Comfortable with Abstraction
 * - GM Philosophy: GMless Advocate
 * - Genre Flexibility: Prefers Focused Systems
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096216-z68czo4h2';
const personaName = 'Generated Persona 126214';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 8,
    practical_usability: 8
  },
  narrative_feedback: `As an Explorer with three to ten years of experience, I approach this rulebook looking for systems that support discovery, flexibility, and collaborative worldbuilding. The Razorweave Core Rulebook delivers on these fronts better than most games I've encountered.

What immediately strikes me is how the book's structure respects different play modes. As someone who advocates for GMless play, I'm pleased that the system genuinely supports this approach without feeling like a bolt-on afterthought. The friction-free nature of the 4d6 resolution system means conversion to shared authority is straightforward. When everyone at the table understands that Checks trigger based on meaningful uncertainty, rotating who frames challenges becomes natural.

The clarity here is exceptional. Chapters 1-5 establish philosophical foundation before mechanics, which is exactly how I learn systems. The fiction-first principle isn't just stated—it's demonstrated through repeated examples. I find myself nodding along as the book shows intent and approach mattering more than mechanical optimization. That simplicity of approach aligns perfectly with how my groups actually play.

The modified chapters (6, 8, 9, 10) deserve special mention. The worked examples in character creation make stepping through the process genuinely painless. The DC tables in Chapter 10 are a revelation—finally, a rulebook that addresses "what difficulty should I set?" with actual guidance rather than hand-waving. The quick reference sections feel like they were written by someone who understands table friction. These additions transform the book from "good reference material" to "actually usable during play."

However, there's a tension I notice. The system claims to support abstraction and simplicity, yet the proliferation of Tags, Conditions, and Clocks creates decision trees that sometimes feel at odds with the stated philosophy. When running GMless, deciding whether something is a "Tag on the scene" versus a "Condition on a character" can create table friction. The quick references help, but ideally the distinction would be even more intuitive.

The Clocks mechanic is elegant but requires GM-forward thinking when playing GMless. Tracking multiple parallel Clocks across a shared-authority scene demands clarity about who controls advancement. The book hints at solutions but doesn't fully spell out the collaborative approach.

Where this book shines for my playstyle is in its acknowledgment that different tables will hack different things. The variant rules section shows maturity. The acknowledgment that players own their characters deeply respects player agency. These are the values that matter to Explorers and GMless advocates.`,
  issue_annotations: [
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "The distinction between Tags (scene/location) and Conditions (character) remains slightly ambiguous in edge cases, particularly during GMless play when authority rotates",
      impact: "When players take turns framing scenes, confusion about what type of mechanic to apply can disrupt flow and require table discussion to resolve",
      location: "Core Concepts section comparing Tags vs Conditions"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Clock advancement mechanics in shared-authority or GMless contexts lack explicit procedures for who decides when a Clock advances",
      impact: "During GMless play, the rotating authority structure can create uncertainty about Clock ownership, potentially leading to under- or over-advancement",
      location: "Clock advancement guidelines in Combat and Scene Structure"
    },
    {
      section: "Chapter 5 - Ways to Play the Game",
      issue: "GMless section describes the mode but lacks practical procedures for how to rotate authority during actual play (who speaks when, who sets challenges)",
      impact: "Groups new to GMless play may struggle to operationalize the principles without house-ruling procedures that the book could provide",
      location: "GMless Cooperative Play subsection"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "While the nine-step process is clear, the Quick-Start option might oversimplify Proficiency selection for explorers who value character uniqueness",
      impact: "Quick-start characters can feel samey when Proficiencies are suggested rather than discovered through concept development",
      location: "Quick-Start 10-Minute Character and Step 4 guidance"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an exceptionally well-crafted system for explorers and experimental play. Its commitment to fiction-first design, combined with genuine support for multiple play modes including GMless play, sets it apart. The modified chapters with worked examples and DC tables are standout improvements that significantly enhance usability at the table.

The system succeeds at being accessible without being simplistic. The rules are clear and purposeful. The examples genuinely teach rather than merely demonstrate. Most importantly, the book trusts tables to discover their own approach rather than prescribing a single way to play.

For GMless groups specifically, this system is more flexible than many "traditional" RPGs that bolt on shared-authority support as an afterthought. The core mechanics adapt cleanly to rotating authority, though explicit procedures for GMless play would strengthen the offering further.

As someone who values exploring what's possible at a table, I find this rulebook exciting. It provides scaffolding without crutches, support without constraint. I would eagerly run this in both traditional GM-led campaigns and fully GMless cooperative play. The focus on simplicity and clarity, combined with the modular nature of its systems, makes it exactly the kind of tool that exploratory play depends on. Highly recommended for groups comfortable with some table discussion and house-ruling, and especially strong for those seeking genuine alternatives to GM-centric play.`
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
- **Experience:** Experienced (3-10 years)
- **Playstyle:** Converting, Comfortable with Abstraction, GMless Advocate, Simplicity Seeker

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
