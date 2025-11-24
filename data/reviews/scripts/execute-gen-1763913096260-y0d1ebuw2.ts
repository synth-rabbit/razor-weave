// Execute reviewer prompt for persona gen-1763913096260-y0d1ebuw2
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const startTime = Date.now();

// Database connection
const dbPath = join(process.cwd(), 'data', 'project.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Review data from the Killer/Early Intermediate persona perspective
// - Archetype: Killer (focused on competition, challenge, winning)
// - Experience: Early Intermediate (1-3 years)
// - Fiction-First: Native (comfortable with fiction-first approaches)
// - Narrative/Mechanics: Prefers Narrative Tools
// - GM Philosophy: Non-GM (player-focused perspective)
// - Genre Flexibility: Neutral
// - Cognitive Style: Complexity Tolerant

const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As someone who's been playing for a couple of years and really gets into the tactical side of combat, I find this rulebook has solid bones but doesn't quite scratch my itch for decisive confrontation. The fiction-first approach is well explained, and I appreciate how Tags and Conditions integrate into the resolution system - that gives me levers to pull in fights. The Resolve Clock system instead of hit points is actually pretty clever; I like that visible progress means I can feel when an enemy is about to break.

The combat chapter does a decent job explaining Strike, Maneuver, Set Up, and Defend/Withdraw actions. I can see how to build toward impactful moments - setting up Advantage before committing to Strikes makes tactical sense. But here's my frustration: the book keeps emphasizing narrative tools and collaborative storytelling when I want more crunch about *winning*. What makes one Strike more devastating than another? How do I stack Tags effectively? The guidance feels aimed at players who want story beats rather than players who want to dominate the battlefield.

The 4d6 system with margin-based outcomes is clean enough to keep combat moving, which I appreciate. I don't want to be bogged down in calculation when there's a fight to win. But I wish there was more discussion of optimal builds, powerful Skill combinations, or how to specialize a character for combat excellence. The character creation chapter feels balanced toward well-rounded characters rather than focused specialists.

I genuinely appreciate the Clocks mechanic for long-term projects and threats - that gives strategic depth to planning engagements. And the Tags system creates meaningful tactical terrain. Those are my favorite mechanical elements.`,
  issue_annotations: [
    {
      section: "Combat Basics (Chapter 10)",
      issue: "Insufficient mechanical differentiation between Strike types and damage scaling",
      impact: "Killer players lack clarity on how to optimize for maximum combat effectiveness; all attacks feel mechanically similar regardless of setup or approach",
      location: "Core Combat Actions subsection, specifically the Strike action description"
    },
    {
      section: "Character Creation (Chapter 6)",
      issue: "No guidance on building combat-focused specialists vs generalists",
      impact: "Players seeking to create dominant combatants cannot easily identify which Skill/Proficiency combinations maximize combat performance",
      location: "Skill selection guidance and attribute prioritization"
    },
    {
      section: "Actions, Checks, and Outcomes (Chapter 8)",
      issue: "Critical Success and outcome tier bonuses feel under-specified for combat contexts",
      impact: "Rolling exceptionally well doesn't feel proportionally rewarding; margin +5 should feel dramatically different from margin +0 in combat",
      location: "Interpreting Outcomes subsection"
    },
    {
      section: "Tags, Conditions, and Clocks (Chapter 9)",
      issue: "Tag stacking rules and interaction priority unclear",
      impact: "Cannot plan tactical sequences confidently when multiple Tags and Conditions interact; uncertain whether advantages compound meaningfully",
      location: "Using Tags and Conditions with Checks subsection"
    },
    {
      section: "Exploration and Social Play (Chapter 11)",
      issue: "Disproportionate page space given to non-combat activities relative to combat tactics",
      impact: "Killer players must piece together advanced combat strategies while other playstyles receive extensive guidance",
      location: "Chapter-level balance throughout Part I"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a competent fiction-first system that will serve many tables well, but it doesn't fully meet the needs of players who prioritize tactical combat mastery. The mechanical foundation is sound - the 4d6 resolution, Advantage/Disadvantage system, and Clock mechanics all work together elegantly. The Resolve Clock system is a genuine innovation that I prefer over traditional hit points.

However, the book's strong narrative emphasis comes at the cost of tactical depth for combat-focused players. I can see *how* to fight, but the book rarely discusses *how to fight well*. Advanced combat optimization, build theory, and tactical stacking of effects are left as exercises for the reader. For a Killer archetype with a few years of experience, this creates frustration - I understand the basics but want guidance on mastery that simply isn't here.

The book earns solid marks for clarity and internal consistency. Rules are well-explained and examples are helpful. But the persona fit is middling because the design philosophy clearly prioritizes collaborative storytelling over competitive tactical excellence. I can make this work, but I'll need to develop house rules and interpretations to get the combat depth I'm looking for.`
};

// Write to database
const reviewDataJson = JSON.stringify(reviewData);
const stmt = db.prepare(`
  INSERT INTO persona_reviews (
    campaign_id, persona_id, review_data,
    agent_execution_time, status
  ) VALUES (?, ?, ?, ?, ?)
`);

const result = stmt.run(
  'campaign-20251123-192801-j6p4e486',
  'gen-1763913096260-y0d1ebuw2',
  reviewDataJson,
  Date.now() - startTime,
  'completed'
);

console.log(`Created persona review with ID: ${result.lastInsertRowid}`);

// Write markdown file
const markdownPath = 'data/reviews/raw/campaign-20251123-192801-j6p4e486/gen-1763913096260-y0d1ebuw2.md';

const markdown = `# Review: Generated Persona 717764 - Book Review

Campaign: campaign-20251123-192801-j6p4e486 | Date: ${new Date().toISOString()}

## Persona Profile

- **Archetype:** Killer
- **Experience:** Early Intermediate (1-3 years)
- **Playstyle:** Native, Complexity Tolerant

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

mkdirSync(dirname(markdownPath), { recursive: true });
writeFileSync(markdownPath, markdown, 'utf-8');

console.log(`Wrote markdown review file to ${markdownPath}`);
console.log('Review complete!');
console.log('\nRatings Summary:');
console.log(`  Clarity & Readability: ${reviewData.ratings.clarity_readability}/10`);
console.log(`  Rules Accuracy: ${reviewData.ratings.rules_accuracy}/10`);
console.log(`  Persona Fit: ${reviewData.ratings.persona_fit}/10`);
console.log(`  Practical Usability: ${reviewData.ratings.practical_usability}/10`);

db.close();
