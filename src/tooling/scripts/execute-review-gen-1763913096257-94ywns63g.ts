/**
 * Execute reviewer prompt for persona gen-1763913096257-94ywns63g
 * Campaign: campaign-20251123-210100-7r2kk4tm
 *
 * Persona Profile:
 * - Name: Generated Persona 123551
 * - Archetype: Explorer
 * - Experience: Forever GM
 * - Fiction-First: Curious
 * - Narrative/Mechanics: Needs Concrete Numbers
 * - GM Philosophy: Non-GM
 * - Genre Flexibility: Genre-Specific Purist
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
const campaignId = 'campaign-20251123-210100-7r2kk4tm';
const personaId = 'gen-1763913096257-94ywns63g';
const personaName = 'Generated Persona 123551';

// Review data based on thorough analysis from the persona's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 8
  },
  narrative_feedback: `After decades of running games, I've learned that mechanics exist to serve stories, not the other way around. As an Explorer at heart, I'm drawn to systems that open possibilities rather than constrain them. Razorweave intrigues me precisely because it tries to strike that balance - though I have some sharp observations.

First, let me praise what works: The organizational clarity is exceptional. From the moment I opened this book, I could sense a designer who understands how GMs actually think. The progression from first principles through mechanics to application is methodical and respectful. For someone like me who has absorbed countless rulesets, this is refreshing - the architecture supports exploration rather than demanding adherence to dogma.

The 4d6 resolution system is elegant. I appreciate that it provides concrete numbers - a Systems Integrator like myself needs to understand *how* the probabilities actually shake out. The fact that I can calculate success likelihood based on attribute differences, skill ranks, and difficulty gives me confidence when improvising. Too many "narrative first" systems hand-wave this away, and I lose trust in the mechanics' fairness.

However - and this is significant - the system struggles with what I call "genre coherence." As a Genre-Specific Purist, I want mechanics that *feel* appropriate to the fictional world. The Tags system works mechanically, but the narrative justification for why a "Distracted" tag gives a -2 penalty sometimes feels abstract. In sci-fi, perhaps "Electromagnetic Interference" makes sense. In fantasy, the thematic connection loosens. I'm curious whether this system's mechanics would translate equally well to noir, horror, or western play without substantial retuning.

The Skills and Proficiencies reference sections demonstrate serious mathematical work. I respect that the designers included these tables - it shows they cared about mechanical rigor. The DC tier system (10, 15, 20, 25, 30) provides the numerical scaffolding I need to improvise confidently. But I want to understand *why* these tiers were chosen. What failure rate do they represent? I'm inferring 50% success at equal skill vs. DC, but I'd prefer explicit probability tables.

The Clocks mechanic deserves special mention. As someone who values systemic integration, I love how Clocks connect preparation, pacing, and consequences. But the book doesn't fully explain how Clocks interact with character agency - when a Clock progresses on a failure, do players know? Can they trigger it deliberately? These mechanics need clarity for true exploration to happen at my table.

The downtime and advancement system is solid, though brief. I'm intrigued by how character growth works mechanically, but I wish there was more guidance on how advancement interacts with campaign arcs. As someone who runs long campaigns, I'm thinking about power scaling, mechanical mastery curves, and whether the system has math to support epic-level play.

My curiosity around the "Non-GM" philosophy troubles me slightly. The book mentions alternative play modes (GMless, solo, asynchronous), but these feel grafted on rather than deeply integrated. As someone who doesn't GM in every group I play in, I wonder if this system actually serves players without a GM or if it's merely "compatible" with such play. I'd want concrete mechanics, not aspirational design.

What impresses most is the faction system. Standing ladders (Hostile to Honored) provide mathematical structure while allowing narrative interpretation. This is systems design done right - mechanics that enable rather than constrain exploration.

Overall, this is a rulebook written by someone who understands both games and stories. It rewards the kind of systematic exploration that excites me. But it occasionally falls short of its fiction-first promises when the mechanical details don't reinforce the narrative premise. Nevertheless, this is exactly the kind of system I'd grab when starting a new campaign.`,
  issue_annotations: [
    {
      section: "Chapter 8 - Actions, Checks, Outcomes",
      issue: "The resolution probabilities are implied but never explicitly stated. What's the actual success rate at DC 15 with +3 versus target number mechanics?",
      impact: "A Systems Integrator like myself needs to understand probability distributions to improvise confidently. Without explicit math, I'm working on faith rather than knowledge",
      location: "4d6 Resolution System section - probability curves not displayed"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Tags are mechanically clear but narratively abstract. Why does 'Distracted' impose the same penalty across all genres?",
      impact: "When exploring different genres, the mechanical framework feels disconnected from the fictional premise, reducing immersion",
      location: "Tags application section - lack of genre-specific guidance"
    },
    {
      section: "Chapter 5 - Ways to Play",
      issue: "GMless and solo play are listed as supported but lack concrete mechanics. How do Clocks advance? Who interprets success/failure?",
      impact: "Someone wanting to explore play without a GM gets aspirational language rather than actionable mechanics",
      location: "GMless Cooperative Play and Solo Play subsections"
    },
    {
      section: "Chapter 9 - Tags, Conditions, Clocks",
      issue: "Clock progression on failure isn't explicitly tied to player knowledge or agency. Can players deliberately push Clocks toward triggering?",
      impact: "Reduces player exploration of mechanical systems. A transparent clock system would enable more creative interaction",
      location: "Clocks Mechanics and Interpretation section"
    },
    {
      section: "Chapter 12 - Downtime, Recovery, Advancement Overview",
      issue: "Advancement is described functionally but without discussion of mechanical power scaling across campaign levels",
      impact: "Long-term campaign explorers can't assess whether the system handles epic-level play or if characters hit a mechanical ceiling",
      location: "Advancement Mechanics section - missing scaling analysis"
    },
    {
      section: "Chapter 20 - Optional Variant Rules",
      issue: "Variant rules are presented without guidance on how they affect probability curves or system balance",
      impact: "When exploring alternative rules, System Integrators lack the math needed to understand trade-offs",
      location: "Each variant rule section"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a system designed for explorers like myself, but it occasionally asks us to explore blind. The mechanical infrastructure is sound and the fiction-forward philosophy is genuine. The 4d6 system, faction mechanics, and Clock framework show careful design that respects both story and system. However, the book would be stronger with deeper numerical analysis: probability tables, genre-specific guidance, and explicit mechanics for alternative play modes.

As a Forever GM who embraces exploration, I see this as a system with significant promise. The organizational clarity and systematic thinking underlying the rules inspire confidence. But true exploration requires transparency - showing me the mathematical scaffolding so I can understand how to push boundaries safely. The book hints at systems integration without always delivering it explicitly.

I would run this system, particularly for campaigns exploring fantasy or sci-fi domains. I would pay special attention to how Clocks and factions evolve over play, as these are the mechanical innovations that excite my Systems Integrator mind. I would request probability tables as a house rule and consider variant mechanics for exploring GMless play. This is a competent, thoughtful rulebook that rewards the systematic curiosity it's designed for - mostly.`
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
- **Experience:** Forever GM
- **Playstyle:** Curious, Systems Integrator

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
