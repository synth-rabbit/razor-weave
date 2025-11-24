// src/tooling/scripts/execute-review-gen-1763913096216-tivz62gzi.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 9,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `Okay, so I've been playing TTRPGs casually for a couple years now—mostly D&D with friends on weekends—and I picked up this Razorweave rulebook because someone said it was more "story-focused." I gotta say, it's definitely a shift from what I'm used to, but in a good way!

The book does a really solid job explaining what "fiction first" means. Like, I've heard that term thrown around but never really *got* it until reading chapters 3 and 4. The examples really clicked for me—especially the one about the sealed laboratory door where you describe what you're doing first before even thinking about dice. That's different from how I usually play where someone just says "I roll Perception!"

The character creation chapter (Chapter 6) is super approachable. I love that you start with a concept and build from there instead of picking numbers from a table. The Rella example they use throughout is great—it shows you exactly how each step works without being overwhelming. Though I'll be honest, the Skills and Proficiencies distinction took me a few reads to really understand. They're both things your character is good at, but Skills are for rolling and Proficiencies change how the GM sees your actions? I think I get it now, but a side-by-side comparison box would've helped.

The 4d6 system is interesting! Coming from d20 games, the bell curve feels more... predictable? Like you're not going to randomly crit and one-shot a boss or fail a simple task spectacularly. The margin system (Full Success, Partial Success, Failure) is actually really cool because even when you "fail," the story keeps moving. That's huge. No more "you fail to pick the lock, roll again" loops.

Combat feels streamlined but I'm a little nervous about running it. The Resolve Clocks instead of HP is a neat idea, but I'm worried my group might miss having that concrete number going down. We're used to tracking HP pretty closely. The Strike/Maneuver/Set Up/Defend options seem tactical enough though—I can see my tactician friend getting into the Set Up and Maneuver combos.

Tags and Conditions are brilliant. Having labels like "Dim Light" or "Slick" on a scene tells everyone immediately what kind of modifiers are in play. It's so much easier than trying to remember "does the GM think this counts as difficult terrain or not?"

The GM section looks comprehensive (I skimmed it for when I eventually want to run a game), and the Skills Reference tables are really helpful. I appreciate that they organized everything by Attribute with clear examples.

My main concern is that some of my more "mechanics-first" friends might find this hard to adjust to. The book keeps saying "fiction first" but doesn't give you a ton of tactical crunch to optimize. That's probably the point, but it's a shift.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "Skills vs Proficiencies distinction is initially confusing",
      impact: "New players may conflate the two systems or misunderstand when Proficiencies apply versus Skills. This could lead to character builds that don't function as intended.",
      location: "Steps 4 and 5 (Choose Skills / Choose Proficiencies)"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks may feel too abstract for players accustomed to HP systems",
      impact: "Groups transitioning from D&D-style games may struggle with the lack of concrete numerical feedback during combat, potentially leading to confusion about threat assessment.",
      location: "Resolve Instead of Hit Points subsection"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The margin thresholds could benefit from a quick-reference summary",
      impact: "During play, looking up margin ranges (Critical Success >= +5, Full Success >= 0, etc.) will slow things down until memorized. A standalone reference card would help casual players.",
      location: "Rolling 4d6 and Calculating Margin subsection"
    },
    {
      section: "Chapter 15 - Skills Reference",
      issue: "Extensive skill entries may overwhelm casual players seeking quick lookups",
      impact: "The detailed format (Description, Default actions, Synergies, Counters, GM notes, Example) is thorough but lengthy. A condensed one-page summary table would be helpful for at-the-table reference.",
      location: "Individual skill entries (Athletic Movement, Stealth & Evasion, etc.)"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is a well-written, thoughtful system that successfully bridges the gap between traditional RPG mechanics and narrative-focused play. For someone like me—a casual gamer with a few years of experience who's curious about more story-driven games—it hits a sweet spot. The book doesn't talk down to you, but it also doesn't assume you've been playing indie RPGs for a decade.

The fiction-first philosophy is explained clearly and reinforced throughout with practical examples. Character creation is inviting and concept-driven rather than stat-focused. The 4d6 margin system and outcome tiers (especially Partial Success) keep the game moving and eliminate the frustrating "fail and nothing happens" loops.

That said, it's not a perfect fit for every casual group. Players who want tactical depth and number-crunching optimization may find the system too abstract. The Resolve Clock system for combat, while elegant, might need some table discussion to help HP-accustomed players adjust.

Overall rating: Strong recommendation for casual gamers looking to transition toward narrative play. The complexity is manageable, the examples are excellent, and the core loop is satisfying. Just be prepared to spend a session or two helping your group adjust to the fiction-first mindset.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096216-tivz62gzi',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 123214',
    personaArchetype: 'Casual Gamer',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Converting', 'Complexity Tolerant'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096216-tivz62gzi.md'
);

console.log('Review saved for gen-1763913096216-tivz62gzi');
