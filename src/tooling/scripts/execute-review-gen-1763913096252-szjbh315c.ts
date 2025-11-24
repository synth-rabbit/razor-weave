/**
 * Execute reviewer prompt for persona gen-1763913096252-szjbh315c
 * Campaign: campaign-20251123-222404-g1zvdflh
 *
 * Persona Profile:
 * - Archetype: Method Actor
 * - Experience: Experienced (3-10 years)
 * - Fiction-First: Skeptical, Needs Concrete Numbers
 * - GM Philosophy: Collaborative Storyteller
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
const personaId = 'gen-1763913096252-szjbh315c';
const personaName = 'Method Actor - Experienced (3-10 years)';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As a Method Actor with years of experience inhabiting characters at the table, I approach rulebooks with one fundamental question: will this system help me disappear into my character, or will it constantly remind me that I'm playing a game? The Razorweave Core Rulebook presents an interesting tension for someone like me.

The fiction-first philosophy is philosophically aligned with Method Acting principles. When Chapter 4 states "the story is always the starting point" and emphasizes that mechanics should emerge from the fiction rather than the other way around, that resonates deeply with how I want to play. The intent-and-approach framework in Chapter 8 particularly excites me—the idea that I describe what my character wants and how they're trying to achieve it before any dice roll happens is exactly how immersive roleplay should work.

However, and this is where my skepticism emerges, the system's commitment to fiction-first sometimes feels incomplete when it comes to concrete mechanical guidance. I need to know the numbers to plan my character's actions realistically within the fiction. When I'm embodying a desperate former telegraph engineer trying to save lives, I need to understand—precisely—what that character can and cannot accomplish so I can make authentic choices.

The 4d6 resolution system is elegant and learnable. The margin-based outcome tiers (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse) give me a predictable framework. But the DC ladder (12-22) feels somewhat arbitrary without more guidance on what makes a DC 16 "Tough" versus a DC 18 "Hard" in specific fictional contexts. As an experienced player, I've seen too many GMs set DCs inconsistently, breaking immersion when suddenly a task that should be routine becomes impossibly difficult.

The Attribute system (MIG, AGI, PRE, RSN at 0-2 range) with the starting spread of 2/1/1/0 creates characters with defined strengths and meaningful limitations. This is excellent for Method Acting—limitations force creative, authentic choices. The examples in Chapter 7 showing how the same fictional goal can use different Attributes based on approach (prying a door with MIG, picking its lock with AGI, coaxing someone to open it with PRE, or analyzing weak points with RSN) demonstrate exactly the kind of flexibility that supports deep character embodiment.

Tags, Conditions, and Clocks (Chapter 9) are the standout mechanical innovation for me as a Method Actor. These aren't abstract numbers—they're narrative states that my character actually experiences. When my character is Exhausted or Frightened, that's something I can portray, something that affects how I play them. Clocks create visible narrative pressure that characters would feel. A 6-segment "Flood Waters Rise" Clock isn't just a countdown—it's the growing dread my character experiences watching the water creep higher.

Combat (Chapter 10) using Resolve Clocks instead of hit points is philosophically perfect for Method Acting. My character isn't tracking an arbitrary number—they're experiencing mounting pressure until they break or flee or triumph. The framing that "taken out" can mean many things (fleeing, captured, convinced, killed) depending on stakes lets me think about combat as my character would: what are they actually fighting for?

Where I struggle is the Skills system (Chapters 14-15). The fiction-first approach means Skills are "not abstract numbers" but are "grounded in your character's experiences." Beautiful philosophy—but the reference tables give me action-focused Skills without clear difficulty benchmarks for specific tasks. When my character with Stealth & Evasion tries to cross a foggy yard past Alert guards, the example shows DC 16 but doesn't tell me how to calibrate similar situations. I need those concrete anchors to make informed character choices.

The Proficiencies system (Chapters 16-17) particularly frustrates my need for concrete numbers. Proficiencies "do not add numbers to Checks. Instead, they influence difficulty, consequences, and access to information." This is narratively elegant but mechanically vague. How much does my Telegraph Instruments Proficiency actually help? "Lowers the effective DC" or "grants Advantage" are possibilities—but when? By how much? These questions break my immersion because I'm forced to negotiate with the GM rather than making choices based on what my character knows they can do.

The social rules (Chapter 11) exemplify both the system's strengths and my concerns. The faction standing ladder (Hostile to Honored) is concrete and useful. But social Checks like persuading a guild leader at DC 16 with Partial meaning "a promised favor" feel arbitrary without more guidance on how relationships, leverage, and circumstances modify that baseline.

As a Collaborative Storyteller GM, I appreciate how the GM sections (Chapters 21-26) emphasize shared authority and honest world-presentation. The principles around "failure creates momentum" and "partial success is a core story beat" align perfectly with how I run games. But even as GM, I want clearer numerical scaffolding to maintain consistency.

Character creation (Chapter 6) follows a logical nine-step process that builds characters from concept through mechanical choices back to narrative integration. This works well for Method Actors because it starts with "who is this person" before assigning numbers. The example character Rella demonstrates exactly the kind of grounded, specific character I want to create.

The downtime and advancement systems (Chapters 12 and 19) use Clock-based training and milestone progression, which I appreciate conceptually. But "growth triggers" and advancement thresholds need more concrete definition. When does my character actually improve? What specific accomplishments or timeframes should I expect?

My abstract thinking style actually helps me appreciate the system's philosophical coherence. The entire rulebook is built around a consistent vision: fiction drives mechanics, outcomes change situations, failure generates story. Every subsystem connects back to these principles. That internal consistency is impressive and, when the table shares that vision, produces excellent collaborative storytelling.

But abstract principles need concrete implementation. The system asks GMs to make many judgment calls about DCs, Advantage/Disadvantage, and Proficiency applications. For tables with experienced, aligned GMs, this flexibility is liberating. For mixed tables or those transitioning from crunchier systems, it may create friction that breaks immersion—the opposite of what fiction-first intends.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "DC ladder (12-22) lacks concrete examples mapping fictional circumstances to specific DCs beyond abstract descriptors like 'Tough' or 'Hard'",
      impact: "Method Actors need to understand their character's realistic capabilities to make authentic in-character decisions; vague DCs force out-of-character negotiation",
      location: "Setting DCs section, DC 12-22 ladder"
    },
    {
      section: "Chapter 14-15 - Skills System",
      issue: "Skills are described as 'fiction-first capabilities' without standardized difficulty benchmarks for common actions within each Skill",
      impact: "Players cannot reliably assess what their character 'knows they can do' which undermines both strategic planning and character immersion",
      location: "Skill entries, Default Actions subsections"
    },
    {
      section: "Chapter 16-17 - Proficiencies System",
      issue: "Proficiencies 'do not add numbers to Checks' but their actual mechanical effects (lowered DC, Advantage, information access) are left to GM discretion without guidelines",
      impact: "Method Actors embodying experts in specific fields cannot accurately portray their competence level without GM confirmation each time",
      location: "Proficiency mechanical effects, GM interpretation guidance"
    },
    {
      section: "Chapter 11 - Social Interaction",
      issue: "Social Check DCs appear arbitrary without systematic guidance on how relationship status, leverage, and NPC motivations modify difficulty",
      impact: "Social scenes require constant meta-negotiation about what's possible, breaking the collaborative storytelling flow the system aims to create",
      location: "Social Interaction, Negotiation and Leverage sections"
    },
    {
      section: "Chapter 12/19 - Advancement",
      issue: "Three advancement models (XP, Milestone, Session-based) are listed but 'growth triggers' lack quantified thresholds or comparative pacing guidance",
      impact: "Players cannot set realistic expectations for character development arcs, making it harder to plan meaningful character growth narratives",
      location: "Advancement Overview, Progression Models"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a thoughtfully designed system that genuinely attempts to serve fiction-first play. Its philosophical coherence is admirable, and for Method Actors who find the right table, it offers exactly the kind of character-driven, immersive experience we seek.

The 4d6 margin-based resolution, Tag/Condition/Clock framework, and Resolve-based combat are mechanical innovations that support narrative roleplay better than most systems I've encountered. These tools let me think as my character rather than as a player optimizing numbers.

However, my persistent need for concrete numerical anchors—a common trait among experienced players—leaves me wanting more from this rulebook. Fiction-first philosophy should not mean fiction-only implementation. The best narrative systems I've played give me clear mechanical frameworks that fade into the background because they're consistent and predictable. Razorweave's reliance on GM judgment for DCs, Proficiency effects, and advancement pacing introduces variability that can break immersion.

For Method Actors at collaborative tables with experienced, aligned GMs, I rate this system highly. For mixed groups or players transitioning from crunchier systems, the lack of concrete benchmarks may create friction. My ratings reflect this tension: excellent design philosophy partially undermined by insufficient mechanical scaffolding for consistent implementation.

I would enthusiastically play Razorweave with the right group, and I would recommend it to fellow Method Actors with the caveat that session zero should include explicit agreement on how the table will handle DC calibration and Proficiency interpretation to ensure everyone shares expectations.`
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

- **Archetype:** Method Actor
- **Experience:** Experienced (3-10 years)
- **Fiction-First Stance:** Skeptical, Needs Concrete Numbers
- **GM Philosophy:** Collaborative Storyteller
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
