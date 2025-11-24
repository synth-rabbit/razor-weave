// src/tooling/scripts/execute-review-gen-1763913096213-wmu00ukpy.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `Look, I appreciate what this system is trying to do, but as someone who likes to really dig into mechanics and find optimal builds, I'm left with more questions than answers. Let me break this down.

The 4d6 system with the Advantage/Disadvantage mechanic is actually elegant - I can work with that. Rolling 5d6 or 6d6 and keeping best/worst 4 is mathematically interesting and creates meaningful differentiation. The DC ladder from 12-22 gives clear targets, and the margin-based outcome tiers (Critical Success at +5, Full Success at 0, Partial at -1 to -2, Failure at -3 or worse) are well-defined.

But here's where my power gamer brain starts itching: the character creation spread of 2/1/1/0 for Attributes feels extremely tight. With only a +2 in your best stat and most checks sitting at DC 14-18, you're looking at a lot of Partial Successes even in your specialty. I ran some mental math - on 4d6 you're averaging around 14, so with a +2 and relevant Skill you're maybe hitting 16-17 average? That means DC 16 Tough checks are coin flips for your BEST stat. That's narratively interesting but mechanically frustrating.

The Skills and Proficiencies system drives me absolutely crazy. The book explicitly says there's no fixed or exhaustive list and players should work with GMs to define custom entries. That's fine for narrative-focused players, but I want to know exactly what I'm getting. How broad can a Skill be? The examples given (Observation, Stealth, Technical Work, Machinery Handling) vary wildly in scope. And Proficiencies don't add numbers but 'influence the fiction' - how am I supposed to optimize that?

Combat using Resolve Clocks instead of hit points is intriguing. I actually like that a 6-segment Clock with Full Successes ticking 2 and Partials ticking 1 gives me something to calculate. But the book is vague on exactly how many segments different enemies should have, what determines whether a Strike ticks 1 or 2 segments, and how weapon/armor differences factor in. The system says 'flexible scales' but doesn't give me the levers to pull.

The Strike/Maneuver/Set Up/Defend action economy is solid game design. I can see the tactical depth in using Set Ups to create Advantage before committing to Strikes. That's satisfying to theory-craft around. But again - what exactly qualifies as 'meaningful pressure' for a Maneuver to tick a Resolve Clock? The fiction-first approach leaves too much to GM discretion for my taste.

The advancement system offers three options (XP-based, Milestone, Session-based) but doesn't give concrete XP costs or milestone definitions. Chapter 19 apparently has details, but the overview in Chapter 12 just says 'it reflects narrative change.' I want a progression path I can plan toward.

I'll give credit where it's due: the Tag and Condition systems are comprehensive and well-organized. Environmental Tags (Dim Light, Slick, Cramped, Elevated, Cover types) have clear mechanical effects. Conditions like Exhausted, Bleeding, Frightened have defined impacts. The tables in Chapter 18 are reference gold. If the whole book was this concrete, I'd be much happier.

The Clock mechanic throughout is genuinely powerful. Progress Clocks vs. Pressure Clocks for investigations, parallel Clocks for combat and timed events - this gives me something to strategize around. I can see myself enjoying the racing-clock scenarios.

Bottom line: There's a good system hiding in here for someone who likes tactical thinking and visible progress tracking, but the fiction-first philosophy keeps pulling mechanical specificity away right when I want it most. I need harder numbers on Skill scope, weapon differentiation, enemy scaling, and advancement costs to really sink my teeth into this.`,
  issue_annotations: [
    {
      section: "Chapter 6: Character Creation",
      issue: "Open-ended Skills and Proficiencies without scope guidelines",
      impact: "Impossible to evaluate build choices or compare character effectiveness; too much depends on individual GM rulings",
      location: "Step Four: Choose Skills and Step Five: Choose Proficiencies"
    },
    {
      section: "Chapter 7: Characters and Attributes",
      issue: "Attribute spread of 2/1/1/0 creates very narrow capability bands",
      impact: "With 4d6 averaging 14 and most DCs at 14-18, even specialists face significant failure rates; limits build differentiation",
      location: "Choosing Your Starting Spread"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "No concrete guidance on Resolve Clock sizing for enemies or damage scaling",
      impact: "Cannot plan tactics without knowing how many Strikes/Maneuvers will typically end a fight; makes encounter balance opaque",
      location: "Resolve Instead of Hit Points and Strike action"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Weapon and equipment mechanical differentiation is absent",
      impact: "No way to optimize gear choices; a dagger and a greatsword appear mechanically identical",
      location: "Action: Strike"
    },
    {
      section: "Chapter 12: Downtime, Recovery, and Advancement Overview",
      issue: "Advancement costs and progression rates not specified",
      impact: "Cannot plan character development arc or estimate time to reach goals; references Chapter 19 without core details",
      location: "Advancement Overview"
    },
    {
      section: "Chapter 15: Skills Reference",
      issue: "Skill descriptions emphasize flexibility over boundaries",
      impact: "The 'Flexible Skills Case Studies' actively encourage mixing Attributes with any Skill, making it impossible to identify optimal Skill selections",
      location: "Flexible Skills Case Studies"
    }
  ],
  overall_assessment: "Razorweave has solid bones for a narrative-tactical hybrid: the 4d6 resolution, Clock mechanics, and Tag/Condition systems are well-designed and give players meaningful choices. However, the fiction-first philosophy creates too much ambiguity for power-gamer optimization. The lack of concrete Skill scopes, weapon stats, enemy scaling guidelines, and advancement costs means I cannot theory-craft builds effectively. The system trusts GM judgment for exactly the things I want codified. Rating: 6/10 for a power gamer - the tactical framework is there, but the mechanical specificity is not."
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096213-wmu00ukpy',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 519868',
    personaArchetype: 'Power Gamer',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Native', 'Systems Integrator'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096213-wmu00ukpy.md'
);

console.log('Review saved for gen-1763913096213-wmu00ukpy');
