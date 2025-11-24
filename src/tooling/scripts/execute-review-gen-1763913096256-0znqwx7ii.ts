/**
 * Execute reviewer prompt for persona gen-1763913096256-0znqwx7ii
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Name: Generated Persona 0znqwx7ii
 * - Archetype: Socializer
 * - Experience: Experienced (3-10 years)
 * - Language: Native speaker
 * - Abstraction: Comfortable with Abstraction
 * - GM Experience: Non-GM (Player only)
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
const personaId = 'gen-1763913096256-0znqwx7ii';
const personaName = 'Generated Persona 0znqwx7ii';

// Review data based on thorough analysis from the Socializer persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `As someone who's been playing TTRPGs for about seven years now, primarily as a player who really values the social and collaborative storytelling aspects, the Razorweave Core Rulebook feels like it was written with people like me in mind. I'm drawn to games that prioritize character relationships, emotional beats, and meaningful interactions over tactical combat or number-crunching, and this system delivers beautifully on those fronts.

The fiction-first philosophy resonated deeply with me from the opening chapters. Chapter 4's "Core Principles of Play" articulates something I've felt but struggled to express: that the table is a creative team, and the GM presents the world honestly while players own their characters' responses. This framing makes me feel like my contributions to the story are valued beyond just "what can my character do mechanically."

What truly excites me is Chapter 13 on "Roleplaying Guidance and Working with the GM." The sections on spotlight sharing, party cohesion, and creating memorable characters speak directly to my play priorities. The advice about stepping forward when your character's moment arrives and stepping back to support others' arcs is exactly the kind of social awareness that makes sessions memorable. The example of supporting someone else's spotlight scene by running interference or providing Set Up actions rather than trying to solve their problems captures collaborative play perfectly.

The social interaction rules in Chapter 11 feel genuinely robust without being mechanically heavy. I appreciate that Presence-based Skills lead social scenes but other Attributes can matter contextually - a Reasoned argument or a Might-backed display can shift attitudes when grounded in fiction. The negotiation and leverage section acknowledges that effective social play starts with understanding what the other party values, not just rolling dice at problems.

The Tag and Condition system creates wonderful opportunities for roleplay. When my character gains "Frightened" or "Exhausted," those aren't just penalties - they're prompts for how I should behave, react, and describe my character's state. The game actively encourages me to "let Conditions show up in your description" and "react when others suffer." This is the kind of mechanical-to-narrative bridge that makes a system sing for Socializers.

I particularly love the relationship and faction standing mechanics in Chapter 12. Tracking faction standing on a ladder from Hostile to Honored gives structure to something I care about deeply - how our characters' actions ripple through the social fabric of the world. The concept that neglecting important relationships can create a "fading trust Clock" feels emotionally authentic.

The character creation process (Chapter 6) emphasizes identity elements, background, relationships, goals, and personal threads before it even touches mechanical choices. Building Rella as a "former telegraph engineer who searches for meaning in strange message patterns" before assigning attributes tells me this game understands that characters are people first, stat blocks second.

That said, I did find a few areas where the book could better serve social-focused players. The combat chapter, while well-written, feels slightly overweighted compared to the social and exploration content. I understand combat needs clear structure, but I'd love to see equally detailed "structured turns" for complex negotiations or multi-party social encounters. The popcorn initiative approach works, but translating it to a tense negotiation scene isn't explicitly covered.

The Clocks system is brilliant for tracking long-term social goals ("Trust Established," "Deal Secured"), but the examples lean heavily toward physical threats and investigations. More social Clock examples - relationship repair, reputation building, community organizing - would help GMs and players like me see the full potential.

For downtime, I adore that relationship-building is explicitly called out as a valid activity alongside training and crafting. The faction standing system creates real stakes for social investment. However, I wish there were more mechanical hooks for purely social downtime activities - perhaps relationship Clocks that grant bonuses in future interactions, or community standing that unlocks narrative permissions.

The session zero guidance is excellent. The emphasis on discussing tone, content boundaries, and agreeing on safety tools shows mature game design that recognizes play happens between real people who need to feel safe and heard.

Overall, Razorweave feels like a game that will let me play the character I want to play and engage with the stories I want to tell. The abstract thinking required to move between Tags, Conditions, and narrative outcomes feels comfortable rather than demanding - the system trusts me to understand the conceptual connections without spelling out every interaction. That's exactly the level of abstraction I prefer.`,
  issue_annotations: [
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Combat receives structured turn mechanics (popcorn order, conversational order) but equivalent structures for complex social scenes are not provided",
      impact: "Social-focused players may struggle to apply the same tactical clarity to multi-party negotiations or extended social encounters",
      location: "Turns and Order section, comparison to Chapter 11 Social Interaction"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock examples predominantly feature physical threats (flood, structural collapse, cover-up) rather than social relationship dynamics",
      impact: "GMs may not immediately see how to apply Clocks to purely social stakes like reputation, trust-building, or community standing",
      location: "Advancing Clocks and Example sections"
    },
    {
      section: "Chapter 11 - Exploration and Social Play",
      issue: "Social interaction rules, while good, are less detailed than combat rules - no equivalent to 'core combat actions' for social scenes",
      impact: "Players seeking tactical depth in social encounters have less framework than combat-focused players",
      location: "Social Interaction section"
    },
    {
      section: "Chapter 12 - Downtime, Recovery, and Advancement",
      issue: "Relationship-building as downtime activity lacks mechanical specificity compared to Training or Research",
      impact: "Social investment during downtime feels less mechanically rewarding than skill training; social players may feel underserved",
      location: "Downtime Activities and Relationships sections"
    },
    {
      section: "Chapter 15 - Skills Reference by Attribute",
      issue: "Social Skills (Persuasion, Negotiation, Insight, Deception, Comfort) are listed but receive less detailed treatment than Technical or Combat skills in examples",
      impact: "Social-focused players have fewer worked examples to reference when applying social Skills in play",
      location: "Skill Categories and Reading Skill Entries sections"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exceptionally well-suited for Socializer players who prioritize collaborative storytelling, character relationships, and meaningful social interactions. The fiction-first philosophy, robust spotlight-sharing guidance, and relationship/faction mechanics demonstrate deep understanding of what makes social play satisfying. The system's abstract approach to Tags, Conditions, and narrative consequences creates space for the kind of emergent social complexity that makes campaigns memorable. While combat mechanics receive slightly more structural detail than social mechanics, and Clock examples lean toward physical threats over relationship dynamics, these are minor imbalances in an otherwise excellent system. For players who come to the table seeking connection, collaboration, and character-driven drama, Razorweave provides strong mechanical and philosophical foundations. I would enthusiastically recommend this game to my regular group, and I'm already imagining the character concepts and relationship webs we could explore together. Rating: A collaborative storyteller's dream with room for even deeper social toolkits.`
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
- **Experience:** Experienced (3-10 years)
- **Language:** Native speaker
- **Abstraction Comfort:** Comfortable with Abstraction
- **GM Experience:** Non-GM (Player only)
- **Cognitive Style:** Abstract Thinker

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
