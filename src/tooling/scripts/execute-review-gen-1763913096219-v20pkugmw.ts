// src/tooling/scripts/execute-review-gen-1763913096219-v20pkugmw.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `After twenty years of running and playing systems from crunchy simulationist to rules-lite narrative games, I appreciate what Razorweave is attempting here. The fiction-first approach is clearly articulated early and consistently reinforced throughout the text. The 4d6 resolution system with the margin-based outcome tiers (Critical Success through Critical Failure) is elegant and provides that satisfying crunch I look for without becoming tedious.

The character creation flow in Chapter 6 is particularly well-structured. The nine-step process moves logically from concept to mechanical realization, and the running example with Rella provides exactly the kind of worked example that helps players understand how the pieces fit together. As someone who's guided dozens of new players through their first character builds, this chapter would serve that purpose admirably.

The Attribute system (MIG, AGI, PRE, RSN) is tight and purposeful. The 2/1/1/0 starting spread creates meaningful differentiation without overwhelming complexity. I especially appreciate how Chapter 7 explicitly connects Attributes to intent and approach rather than treating them as simple bonuses to be optimized.

Where my Achiever sensibilities raise concerns is in the open-ended nature of Skills and Proficiencies. The text explicitly states these lists are not fixed and encourages GM/player collaboration to define custom entries. While I understand this supports genre flexibility, it creates potential for table variance that could frustrate players seeking consistent mastery. When I invest in learning a system, I want to know the boundaries of what's achievable.

The Tags, Conditions, and Clocks system (Chapter 9) is the mechanical heart that makes this system shine. The way environmental Tags interact with personal Conditions to create compound tactical situations is genuinely sophisticated. The paired Clock examples (investigation vs. cover-up, evacuation vs. flood) demonstrate elegant design thinking.

Combat's use of Resolve Clocks instead of hit points is a bold choice that I respect. The argument for why Clocks beat hit points is compelling - visible progress, flexible stakes, pacing control. However, the lack of concrete numbers for damage scaling means I'll need to calibrate during play rather than being able to plan character builds around known quantities.

The GM sections, while I only skimmed them for this review, appear comprehensive. The emphasis on honest world presentation and failure as momentum aligns with my preferred GMing style after years of running prepared sandbox campaigns.

Overall, this is a mature system designed by someone who has clearly played extensively. It rewards system mastery through understanding interactions rather than through numerical optimization, which suits my converting-to-fiction-first journey while still providing the tactical depth I crave.`,
  issue_annotations: [
    {
      section: "Chapter 6: Character Creation - Step Four: Choose Skills",
      issue: "Open-ended Skills without bounded reference list creates uncertainty for players seeking mastery",
      impact: "Players cannot reliably plan character progression or evaluate relative effectiveness of choices. Table variance may frustrate players moving between groups.",
      location: "Pages describing Skills selection (around 'Skills are action based competencies')"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes - Setting DCs",
      issue: "DC ladder (12-22) provides guidance but lacks concrete examples of what constitutes each tier in different genres",
      impact: "GM calibration may vary significantly. An 'Easy' DC 12 task in a cozy mystery may differ substantially from DC 12 in hard sci-fi survival, making cross-genre play difficult to standardize.",
      location: "DC ladder table and surrounding explanation"
    },
    {
      section: "Chapter 10: Combat Basics - Resolve Instead of Hit Points",
      issue: "No concrete guidance on how many Clock segments a Strike should tick under various circumstances",
      impact: "Combat pacing will require significant GM calibration. Experienced players cannot reliably predict how many exchanges a fight will take or plan tactics accordingly.",
      location: "Section explaining Resolve Clocks and Strike outcomes"
    },
    {
      section: "Chapter 7: Characters and Attributes - Attribute Growth Preview",
      issue: "Advancement teased but details deferred to later chapter, leaving character build planning incomplete at this point",
      impact: "Players who want to plan long-term character arcs cannot evaluate starting choices without reading ahead. This fragments the character creation experience.",
      location: "Final paragraphs of Chapter 7"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks - Common Tag Categories",
      issue: "Reference to 'extended reference' in Chapter 18 without providing minimum viable examples inline",
      impact: "Players and GMs need to flip between chapters during play to understand what Tags actually do mechanically. The few examples given are helpful but insufficient for confident application.",
      location: "Section introducing Environmental, Situational, and Atmospheric Tags"
    }
  ],
  overall_assessment: `Razorweave presents a thoughtfully designed fiction-first system that respects player intelligence while providing genuine mechanical depth. For a veteran Achiever like myself who's converting toward more narrative play, this sits in a compelling middle ground - it has enough crunch to satisfy my tactical brain while teaching me to engage with the fiction more directly.

The core resolution engine (4d6, margin-based outcomes, Advantage/Disadvantage) is clean and scalable. The Tags/Conditions/Clocks infrastructure provides emergent complexity without rules bloat. Character creation is well-scaffolded with the Rella example serving as an excellent teaching tool.

My reservations center on calibration uncertainty: open Skills/Proficiencies lists, genre-agnostic DC scaling, and undefined damage progression all require GM interpretation that may frustrate players seeking reproducible mastery. These aren't flaws per se - they're deliberate design choices for flexibility - but they shift cognitive load in ways that matter for my playstyle.

I would confidently run this system for a medium-to-long campaign with my regular group, where we could establish shared calibration over time. I'd be more hesitant to recommend it for convention one-shots or drop-in play where table variance could create friction.

Rating: 7.5/10 - A strong system that rewards investment but requires buy-in to its flexibility-over-consistency philosophy.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096219-v20pkugmw',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 611102',
    personaArchetype: 'Achiever',
    personaExperience: 'Veteran (10-20 years)',
    personaTraits: ['Converting', 'Intuitive'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096219-v20pkugmw.md'
);

console.log('Review saved for gen-1763913096219-v20pkugmw');
