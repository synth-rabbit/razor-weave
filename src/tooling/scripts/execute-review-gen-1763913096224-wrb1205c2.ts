import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 7
  },
  narrative_feedback: `As a Killer-archetype GM with long-term campaign experience, I approached this rulebook looking for clear mechanical frameworks, consistent resolution systems, and tools that reward system mastery and tactical play.

**Strengths from a Killer Perspective:**

The 4d6 resolution system with its clean margin-based outcome tiers (Critical Success at +5, Full Success at 0+, Partial at -1 to -2, Failure at -3 or worse, Critical Failure at -7) provides exactly the kind of predictable probability curve I want. Players can engage with the math and make informed tactical decisions. The DC ladder (12/14/16/18/20/22) is intuitive and consistent.

The Advantage/Disadvantage system capping at +/-2 prevents runaway stacking while still rewarding clever play. Rolling 5d6 or 6d6 and keeping the best/worst 4 is elegant and feels meaningful without being overwhelming.

Combat's Resolve Clock system is interesting - it shifts away from hit point attrition toward narrative beats, which I appreciate for pacing. The four core actions (Strike, Maneuver, Set Up, Defend/Withdraw) provide clear tactical options without overwhelming complexity.

**Concerns and Frustrations:**

The "fiction first" emphasis, while philosophically sound, sometimes creates ambiguity about when rules actually trigger. For a Killer player wanting to optimize and master the system, clearer mechanical triggers would be welcome. The repeated refrain of "the GM decides" can feel like a lack of firm rules.

The Skills and Proficiencies system is intentionally open-ended, which cuts both ways. While flexibility is good, the lack of a definitive skill list makes it harder to plan character builds or compare characters mechanically. The guidance that "the GM has final approval over scope" adds uncertainty.

The absence of hit points is double-edged. While Resolve Clocks are narratively elegant, they can feel less concrete for players who enjoy tracking resource attrition and making calculated risk decisions based on remaining health pools.

**Long-term GM Observations:**

The Clocks system is excellent for campaign management - progress Clocks, threat Clocks, and faction Clocks give GMs powerful tools for tracking consequences across sessions. The Fronts and Factions guidance (referenced but not fully reviewed here) seems well-suited to long-form play.

The Downtime and Advancement systems provide good scaffolding for character growth between sessions, though advancement feels somewhat abstract compared to XP-based systems.

**Experimental Notes:**

The system invites house-ruling and customization, which aligns with my experimental cognitive style. However, I would have appreciated more optional variant rules for players who want harder mechanical edges - perhaps optional hit point tracking or more granular combat modifiers.`,
  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "The criteria for when to roll ('uncertainty, consequence, agency') are philosophically sound but could use more concrete examples of edge cases",
      impact: "GMs may apply the three-criteria test inconsistently, leading to table variance",
      location: "Section 8.1 When to Roll"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Resolve Clocks replace hit points but the book doesn't provide default Clock sizes for different threat tiers",
      impact: "GMs must intuit appropriate Clock sizes, which may lead to inconsistent combat pacing until calibrated",
      location: "Section 10.2 Resolve Instead of Hit Points"
    },
    {
      section: "Chapter 14-15: Skills System",
      issue: "The intentionally open skill list lacks benchmark examples for scope comparison",
      impact: "Players creating custom skills have no clear guidance on appropriate breadth vs. narrowness",
      location: "Skills System Overview"
    },
    {
      section: "Chapter 7: Characters and Attributes",
      issue: "Attribute growth is described as 'slow across a campaign' but specific milestone triggers are deferred to Chapter 19",
      impact: "Players cannot plan character development without reading multiple chapters",
      location: "Section 7.8 Attribute Growth Preview"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "While Tags and Conditions are well-explained, the examples of mechanical effects (Advantage, DC adjustment) lack consistency guidance",
      impact: "Tables may struggle to determine whether a Tag grants Advantage vs. lowering DC vs. changing position",
      location: "Section 9.3 What Tags Do"
    }
  ],
  overall_assessment: `**Summary:** Razorweave presents a thoughtful, fiction-first system with solid mechanical bones. The 4d6+margin resolution engine is elegant and consistent. For Killer-archetype players, the system offers satisfying tactical decisions within combat through positioning, Set Ups, and action economy, though the emphasis on narrative interpretation over hard rules may frustrate those seeking pure mechanical optimization.

**Recommendation:** 7/10 for Killer playstyle. The system rewards clever play and tactical thinking but requires buy-in to its collaborative, fiction-first philosophy. Long-term campaigns will benefit from the robust Clock and Faction systems.

**Key Strengths:** Clean resolution math, capped Advantage system, versatile Clock mechanics, strong GM tools for campaign management.

**Key Gaps:** Needs clearer mechanical triggers, more prescriptive combat scaling guidance, and optional rules for players wanting harder mechanical edges.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096224-wrb1205c2',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaName: 'Generated Persona 552693',
  personaArchetype: 'Killer',
  personaExperience: 'Long-term GM',
  personaTraits: ['Curious', 'Experimental'],
  contentTitle: 'Razorweave Core Rulebook',
  reviewData
}, 'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096224-wrb1205c2.md');

console.log('Review saved');
