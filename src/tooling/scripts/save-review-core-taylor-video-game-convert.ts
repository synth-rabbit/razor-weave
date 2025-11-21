import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CampaignClient } from '../reviews/campaign-client.js';
import { writeReviewMarkdown } from '../reviews/markdown-writer.js';
import { ReviewDataSchema } from '../reviews/schemas.js';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Review Data from Taylor the Video Game Convert's perspective
const reviewData = {
  ratings: {
    clarity_readability: 7,
    rules_accuracy: 6,
    persona_fit: 5,
    practical_usability: 6
  },
  narrative_feedback: `Okay, so I just finished going through this rulebook, and I have... mixed feelings. I came to TTRPGs from about a decade of video game RPGs - stuff like Dark Souls, Baldur's Gate 3, Final Fantasy, the whole progression-based deal. My friends said tabletop would scratch a different itch, and they handed me this book.

First impression: where are all the numbers? I was expecting character builds with clear stat breakdowns, damage formulas, maybe a talent tree or two. Instead, I get "fiction first" philosophy plastered everywhere. The Attributes section tells me I start with a 2, two 1s, and a 0. That's... it? In BG3, I spend like an hour optimizing my character's stats. Here, I have four numbers that barely move.

The 4d6 system is interesting - I can get behind rolling dice and adding modifiers. That part clicks. But the Edge/Burden system replacing concrete bonuses feels squishy to me. "+1 Edge means roll 5d6 keep 4" - okay, that's cool math-wise, but I can't mentally calculate my success chance the way I could with a +2 modifier. As someone who likes knowing my DPS output, this ambiguity is frustrating.

The DC ladder (12, 14, 16, 18, 20, 22) is nice and clean. I appreciate that. But then the book says the GM just... picks the DC based on "fictional positioning"? Where's the consistency? In video games, if I'm level 10 fighting a level 15 enemy, I know exactly what debuffs apply. Here, it feels like my success depends on whether I describe my action dramatically enough.

Combat using Resolve Clocks instead of HP is the biggest adjustment. I understand intellectually why they did it - fights are supposed to feel more cinematic - but part of me really misses seeing "45/100 HP" and knowing exactly where I stand. The book says a 6-segment clock works for dangerous enemies, but what's a 4-segment enemy versus an 8-segment enemy in terms of actual threat level? The system expects me to "feel" when someone should go down, but I want benchmarks.

Skills and Proficiencies confuse me. Skills "connect directly to action" and Proficiencies "influence difficulty and consequences" - but the book encourages making custom ones? My video game brain wants a comprehensive skill list with defined effects. Instead, I'm told to collaborate with the GM to define them. That's terrifying for a new player. What if I accidentally make something overpowered or useless?

The Character Creation chapter is honestly pretty good for a newbie. The step-by-step flow makes sense, and the example character Rella helps ground what all this abstract stuff looks like in practice. But I wish there were more example characters with different Attribute spreads - the archetype table showing Scout vs Negotiator vs Analyst was exactly what I needed. More of that, please.

The advancement system is where I really feel the culture shock. "Advancement is not just power escalation" - but that's literally what I came here for! I want to get stronger, unlock new abilities, feel my character grow in measurable ways. The Advancement Menu offers options like "Skill Deepening" which just means... updating your description? That doesn't feel like progress to me. Where's the satisfaction of leveling up?

One thing I do appreciate: the book is really well-organized. Chapters flow logically, cross-references tell me where to look for more detail, and the examples (when they exist) are helpful. The writing is clear, even if the philosophy doesn't always click with me.

The combat actions (Strike, Maneuver, Set Up, Defend/Withdraw) map reasonably well to what I know from tactical games. I can imagine treating this like XCOM - position matters, setting up combos with allies is good, sometimes you need to hunker down. That mental model helps.

I'm still not sold on the "fiction first" thing. The book keeps saying the story comes first and rules serve the fiction, but as a new player, I need the rules to be training wheels while I learn to improvise. This system seems to assume I already know how to roleplay and just need a light framework. For a video game convert like me, it's like being handed a blank canvas when I expected a paint-by-numbers kit.`,
  issue_annotations: [
    {
      section: "Chapter 2 - Core Concepts at a Glance",
      issue: "The 'Fiction First' section doesn't explain what happens when players disagree about what the fiction 'should' allow - video game converts expect rules to arbitrate disputes",
      impact: "High - new players from deterministic game backgrounds need clearer guidance on how narrative authority works",
      location: "Chapter 2, Fiction First section"
    },
    {
      section: "Chapter 6 - Character Creation",
      issue: "No sample character builds or templates for common archetypes - just one example character (Rella) with limited mechanical variety shown",
      impact: "High - video game players expect to see multiple viable 'builds' demonstrating different playstyles",
      location: "Chapter 6, entire chapter"
    },
    {
      section: "Chapter 7 - Characters and Attributes",
      issue: "The Attribute ratings (0-2 at start) feel too compressed for meaningful differentiation - unclear what a '0' versus '1' actually means in practice beyond vague descriptions",
      impact: "Medium - systems-oriented players want to understand the mathematical impact of their choices",
      location: "Chapter 7, Attribute Ratings and What They Mean section"
    },
    {
      section: "Chapter 8 - Actions, Checks, and Outcomes",
      issue: "The margin-based outcome system (Critical Success at +5, Full Success at 0, etc.) is elegant but the book never provides probability tables showing likely outcomes at different bonus levels",
      impact: "High - number-focused players need to understand their actual success rates to make informed tactical decisions",
      location: "Chapter 8, Rolling 4d6 and Calculating Margin section"
    },
    {
      section: "Chapter 10 - Combat Basics",
      issue: "Resolve Clocks replace HP but the book doesn't give clear guidelines for sizing enemy clocks - 'size clocks to match the scene' is too subjective for new players",
      impact: "Medium - players from video games expect consistent enemy stat blocks with predictable difficulty",
      location: "Chapter 10, Resolve Instead of Hit Points section"
    },
    {
      section: "Chapter 6 - Skills and Proficiencies",
      issue: "The open-ended custom Skills/Proficiencies system is intimidating for newbies - we need a comprehensive default list to choose from before feeling confident to customize",
      impact: "High - video game converts are used to picking from defined ability trees, not inventing their own",
      location: "Chapter 6, Before You Choose Skills and Proficiencies section"
    },
    {
      section: "Chapter 19 - Advancement",
      issue: "Advancement options like 'Skill Deepening' and 'Relationship & Reputation' feel narratively meaningful but mechanically unsatisfying - no clear power progression milestones",
      impact: "Medium - Achiever-type players motivated by character progression will feel undernourished",
      location: "Chapter 19, Advancement Menu section"
    },
    {
      section: "Cross-Reference",
      issue: "The book references 'later chapters' frequently without hyperlinks or page numbers in the digital version - makes navigation harder for reference lookup",
      impact: "Low - QOL improvement that would help during play",
      location: "Throughout - Chapters 2, 6, 7"
    }
  ],
  overall_assessment: `As a video game convert with about zero tabletop experience, the Razorweave Core Rulebook is a challenging first TTRPG for me. It's clearly well-designed for people who already know what they want from narrative gaming, but it assumes a level of improvisational confidence and "fiction first" buy-in that I don't have yet.

The system's strengths from my perspective:
- Clear chapter organization and logical flow
- The 4d6 + modifier + Edge/Burden resolution is actually pretty elegant once you grok it
- Combat actions that map to tactical game thinking (positioning, setup, attack, defend)
- Good example character (Rella) that grounds abstract concepts
- DC ladder that provides at least some numerical anchoring

The system's challenges for someone like me:
- "Fiction first" philosophy feels like being thrown in the deep end without floaties
- Attribute spread (2, 1, 1, 0) is too compressed - I want more numbers to optimize
- No probability tables or success rate guidance for the mathematically-minded
- Custom Skills/Proficiencies are terrifying without comprehensive default lists
- Resolve Clocks feel less concrete than HP for tracking combat status
- Advancement feels more like "character development" than "power growth"

I'm rating this book lower than other reviewers might because my persona specifically needs concrete numbers, clear progression, and mechanical scaffolding. The book delivers on its own terms - it's genuinely trying to be a flexible, fiction-forward system - but those terms don't align well with what a video game Achiever is looking for.

If I were advising the designers: add an appendix with probability tables, provide 4-6 pre-built character templates for common archetypes, include comprehensive default Skill/Proficiency lists that players CAN customize but don't HAVE to, and maybe add an optional "crunchy mode" variant with more granular stats for people like me who find comfort in numbers.

Rating Summary:
- Clarity & Readability: 7/10 - Well-organized and clearly written, but philosophy doesn't click
- Rules Accuracy: 6/10 - Internally consistent but intentionally vague where I want precision
- Persona Fit: 5/10 - Not designed for video game converts seeking numerical progression
- Practical Usability: 6/10 - Hard to reference mid-game without probability shortcuts`
};

// Validate the review data
ReviewDataSchema.parse(reviewData);
console.log('Review data validated successfully');

// Connect to the razorweave database
const dbPath = join(projectRoot, 'data', 'razorweave.db');
const db = new Database(dbPath);

// Create campaign client and save review
const campaignClient = new CampaignClient(db);

// First, ensure the campaign exists (create if needed for this review)
const existingCampaign = campaignClient.getCampaign('campaign-20251121-202921-q96njych');
if (!existingCampaign) {
  // Create the campaign record
  const createStmt = db.prepare(`
    INSERT INTO review_campaigns (
      id, campaign_name, content_type, content_id,
      persona_selection_strategy, persona_ids, status, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  createStmt.run(
    'campaign-20251121-202921-q96njych',
    'Core Rulebook Review Campaign',
    'book',
    'book-49b2d22f75f2',
    'all_core',
    JSON.stringify(['core-taylor-video-game-convert']),
    'in_progress',
    null
  );
  console.log('Created campaign record');
}

// Create the persona review
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251121-202921-q96njych',
  personaId: 'core-taylor-video-game-convert',
  reviewData,
  agentExecutionTime: Date.now()
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
const markdownPath = join(projectRoot, 'data/reviews/raw/campaign-20251121-202921-q96njych/core-taylor-video-game-convert.md');
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251121-202921-q96njych',
    personaName: 'Taylor the Video Game Convert',
    personaArchetype: 'Achiever',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Skeptical', 'Systems Integrator'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  markdownPath
);

console.log(`Wrote review markdown to: ${markdownPath}`);

// Close database
db.close();

console.log('Review saved successfully');
