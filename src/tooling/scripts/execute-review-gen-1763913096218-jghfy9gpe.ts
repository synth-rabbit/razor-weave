// src/tooling/scripts/execute-review-gen-1763913096218-jghfy9gpe.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 8,
    persona_fit: 6,
    practical_usability: 5
  },
  narrative_feedback: `As someone who's run campaigns and played in others, I approach rulebooks with a specific eye: show me patterns I can exploit, give me clear systems to master, and help me optimize my choices. Razorweave's 4d6 system with its margin-based outcome tiers (Critical Success at +5, Full Success at 0, Partial at -1 to -2, Failure at -3) is elegant and learnable. I appreciate having concrete numbers.

The Attribute spread during character creation (one at 2, two at 1, one at 0) is straightforward, and I can immediately see the optimization space. The Advantage/Disadvantage system capping at plus or minus 2 with extra dice kept or dropped is well-defined and predictable.

However, as an Achiever, I find myself wanting more crunch. The DC ladder (Easy 12 to Legendary 22) is serviceable but the book is overly reliant on "fiction first" philosophy. I understand the design intent, but when I'm prepping for a session or building a character, I want tables, benchmarks, and clear progressions. The Skills and Proficiencies chapters deliver some of this with their structured entries (description, default actions, synergies, counters), but the advancement system feels vague. "Milestone-based," "XP-based," and "Session-based" are mentioned but not detailed enough for me to plan a character arc mechanically.

The Resolve Clocks replacing hit points is an interesting design choice. I can see the narrative benefits, but as a pattern-driven player, I lose some of the satisfaction of tracking precise damage values and calculating exactly how much punishment I can take or dish out. The system trades granularity for narrative flexibility, which will appeal to some but leaves Achievers wanting more tactical depth.

The combat chapter explicitly states it uses the same resolution tools as everything else - no separate combat system. For someone who enjoys mastering distinct subsystems, this unified approach feels like it reduces opportunities for specialization and system mastery.`,
  issue_annotations: [
    {
      section: "Chapter 19 - Advancement and Long Term Growth",
      issue: "Advancement rules lack mechanical detail",
      impact: "Cannot plan character progression strategically; unclear what XP costs are, how milestones are defined, or what the actual mechanical benefits of advancement are beyond vague descriptions",
      location: "Section references advancement options but defers specifics to 'genre-specific advice' without providing concrete examples or tables"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks lack standardized benchmarks",
      impact: "As a GM, I cannot easily balance encounters because there are no guidelines for how many segments different enemy types should have, or how much a 'solid Strike' ticks a clock",
      location: "The section on 'Resolve Instead of Hit Points' describes the concept but provides no concrete values or examples of typical clock sizes"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "Skill bonuses not clearly defined",
      impact: "When a Check uses 'an Attribute and relevant Skill,' what numerical bonus does the Skill provide? The procedure says 'applies modifiers' but never specifies what those modifiers are",
      location: "The Core Check Procedure section and Rolling 4d6 section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "No numeric Skill values specified during creation",
      impact: "The step-by-step creation flow mentions 'choose Skills' but never establishes whether Skills have ranks, how many you get, or what mechanical benefit they provide beyond triggering Advantage",
      location: "Steps Four and Five of the Creation Flow"
    },
    {
      section: "Chapter 14 - Skills System Overview",
      issue: "Skills appear to be binary (have/don't have) without progression",
      impact: "Limits meaningful character growth options; cannot differentiate between a novice and expert in the same Skill mechanically",
      location: "The entire chapter discusses Skills conceptually but avoids establishing a rank or proficiency tier system"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook presents a coherent fiction-first system that will appeal to narrative-focused groups. The 4d6 core mechanic with margin-based outcomes is mathematically sound and the Advantage/Disadvantage system is well-implemented. The extensive examples throughout help illustrate the design philosophy.

However, for an Achiever who thrives on mastering systems, optimizing builds, and tracking measurable progress, the book feels frustratingly incomplete. Key mechanical details are either absent or deliberately vague: Skill bonuses aren't quantified, advancement costs aren't listed, and combat balance guidelines are missing. The unified resolution approach, while elegant, removes opportunities for tactical specialization.

The book would benefit significantly from: (1) a clear table showing what Skills add to rolls, (2) concrete advancement costs and milestone definitions, (3) enemy stat blocks with Resolve Clock guidelines, and (4) optional tactical modules for groups wanting more crunch. As written, this is a solid 6-7/10 for general use but drops to a 5/10 for Achiever-type players seeking mechanical depth and character build optimization paths.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096218-jghfy9gpe',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 621392',
    personaArchetype: 'Achiever',
    personaExperience: 'Hybrid GM/Player',
    personaTraits: ['Skeptical', 'Pattern-Driven'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096218-jghfy9gpe.md'
);

console.log('Review saved for gen-1763913096218-jghfy9gpe');
