// src/tooling/scripts/execute-review-gen-1763913096215-ojnj9oyej.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

/**
 * Review from: Generated Persona 300740 (Tactician / Hybrid GM/Player)
 *
 * As a Tactician who is a Hybrid GM/Player with an Evangelical stance on fiction-first play,
 * I approach this rulebook looking for concrete procedures I can use at the table while
 * appreciating how the narrative framework enables tactical decision-making.
 *
 * My Railroad Conductor GM philosophy means I value clear structure and defined procedures,
 * though I apply them flexibly. As a Concrete Thinker, I need explicit examples rather than
 * abstract principles. My preference for Focused Systems means I want rules that do their
 * job well without unnecessary complexity.
 */

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 7,
    practical_usability: 6
  },
  narrative_feedback: `As someone who lives for the tactical puzzle of roleplay, I found Razorweave's approach refreshingly honest about what it wants to be. The fiction-first framework actually enables tactical thinking rather than constraining it - when I know the narrative stakes, I can make better tactical choices. That's something I can preach to my table.

The 4d6 system with margin-based outcomes gives me something to work with. I appreciate that the spread (mean around 14, range 4-24) creates meaningful variance without wild swings. The Advantage/Disadvantage system caps at +/-2, which is elegant - I can evaluate positioning and setup actions with real math behind them.

However, as a Concrete Thinker, I struggled with several sections. The book establishes excellent principles but sometimes leaves me hanging when I need the actual procedure. When do I set DC 16 versus DC 18? The ladder exists, but the guidance for choosing between adjacent tiers feels abstract. I found myself wanting more concrete benchmarks.

The combat system using Clocks instead of hit points is philosophically interesting, but I'm not sure it delivers for tactical play. How many segments do I put on a Resolve Clock for different enemy tiers? The book says "size clocks to match the scene" but that's exactly the kind of Railroad Conductor guidance I need spelled out. Without that, I'm making it up every session, which introduces inconsistency.

Skills and Proficiencies are flexible by design, which I appreciate - I can pair any Skill with any Attribute based on approach. But for my Focused Systems preference, I want clearer guidelines on when a Proficiency grants Advantage versus when it lowers DC versus when it grants auto-success. The current guidance says "let the fiction guide" which is true but not sufficient for someone who wants to run a tight, fair game.`,
  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "DC setting guidance is too abstract for practical use",
      impact: "As a GM who values consistency, I need concrete benchmarks. 'Easy 12, Routine 14, Tough 16' is helpful but I need examples of what makes something 'Tough' versus 'Hard' in different contexts. The current guidance to 'use lower DCs when characters have strong fictional positioning' is true but doesn't help me calibrate.",
      location: "Section 8.4 'Setting DCs' - the DC ladder table and surrounding guidance"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Resolve Clock sizing lacks concrete guidelines",
      impact: "For tactical combat to feel fair, I need to know how many segments different threats should have. The book says '2-3 segments for quick threats, more for major foes' but doesn't give me a threat tier system. When players ask 'how tough is this guy?' I need a consistent answer framework, not just narrative judgment.",
      location: "Section 10.3 'Resolve Instead of Hit Points' - subsection on why clocks over HP"
    },
    {
      section: "Chapter 16: Proficiencies System Overview",
      issue: "Proficiency benefit modes need clearer decision criteria",
      impact: "Proficiencies can grant Advantage, lower DC, reduce time, or grant auto-success. The book says to let fiction guide which benefit applies, but I want a clearer framework. When does 'Harbor Operations' grant Advantage on a Check versus automatically succeeding? The examples help but don't establish a pattern I can generalize.",
      location: "Section 16.4 'Using Proficiencies in Play' - the bullet list of possible benefits"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "Clock advancement rates not specified consistently",
      impact: "The book says successful Checks tick progress Clocks forward, but doesn't establish how many segments per success. Some examples show Full Success = 2 segments, Partial = 1, but this isn't stated as a default rule. For planning tactical encounters, I need to know the baseline before I can modify it.",
      location: "Section 9.7 'Advancing Clocks' - the three advancement methods"
    },
    {
      section: "Chapter 15: Skills Reference",
      issue: "Skill entries excellent but inconsistent depth",
      impact: "Some Skills like 'Systems & Diagnostics' have great worked examples with specific DCs and outcomes. Others are thinner. As someone who wants to run consistent games, I wish every Skill had the same depth of tactical guidance. The flexible Skills section is good but the variance in entry quality makes reference-checking inconsistent.",
      location: "Throughout Chapter 15 - compare 'Systems & Diagnostics' to other entries"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a well-designed fiction-first system that genuinely supports tactical play through its framework rather than despite it. The core resolution engine (4d6 + margin outcomes + Advantage/Disadvantage) is mathematically sound and creates meaningful decision space. The integration of Tags, Conditions, and Clocks gives tactical players like me concrete board state to manipulate.

My enthusiasm for the system is tempered by gaps in operational detail. The book excels at explaining why things work the way they do and demonstrating principles through examples, but sometimes fails to codify those examples into generalizable rules. For a Tactician running a Railroad Conductor-style game, I need those rules explicit so I can apply them fairly and consistently.

The book earns high marks for clarity - it's well-written, logically organized, and genuinely helpful for understanding the design philosophy. Rules accuracy is good but could be tighter - some procedures feel more like suggestions than rules. Persona fit is decent; the system works for tactical play but requires more GM interpretation than I'd prefer. Practical usability suffers most because I'll need to create my own reference sheets for things like Clock sizing and DC calibration.

I will use this system and I will evangelize its fiction-first approach to my tactical gaming friends. But I'll also be writing house documents to fill the operational gaps. A dedicated GM chapter with concrete benchmark tables would address most of my concerns. The bones are excellent; the flesh could use more definition.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096215-ojnj9oyej',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 300740',
    personaArchetype: 'Tactician',
    personaExperience: 'Hybrid GM/Player',
    personaTraits: ['Evangelical (Fiction-First)', 'Comfortable with Abstraction', 'Railroad Conductor', 'Prefers Focused Systems', 'Concrete Thinker'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096215-ojnj9oyej.md'
);

console.log('Review saved for gen-1763913096215-ojnj9oyej');
