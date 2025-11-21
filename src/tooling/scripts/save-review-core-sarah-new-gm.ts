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

// Review Data from Sarah the New GM's perspective (Socializer/Newbie, Curious, Concrete Thinker)
const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 6,
    practical_usability: 5
  },
  narrative_feedback: `As someone new to running games, I found myself both excited and a little overwhelmed by this rulebook. The writing itself is really clear - I could follow the explanations and I appreciate how the book keeps telling me I don't need to memorize everything before playing. That takes some pressure off!

The "fiction first" concept makes so much sense to me because I want my games to feel like collaborative stories with my friends, not math homework. The book does a great job explaining WHY we do things a certain way, which helps me understand the spirit of the rules.

However, I struggled with some of the more abstract parts. When the book talks about Tags and Conditions as a "shared vocabulary," I get the idea, but I kept wishing for more concrete examples of exactly what to say at the table. The character creation chapter is well-structured with numbered steps, which I loved - but then the Skills and Proficiencies chapters felt like reference material I'd need to flip back to constantly.

The thing that worried me most was running combat. The "Resolve instead of hit points" concept sounds interesting, but as a new GM, I'm not sure I have the confidence yet to narrate what happens when someone "loses Resolve." I'd love more step-by-step examples of actual play, showing what the GM says, what the player says, and what gets written down.

The table of contents sidebar is super helpful for finding things, and I appreciate that examples are highlighted in blue boxes - they're easy to spot when I'm frantically looking something up mid-session.

Overall, I think this is a good rulebook that respects my intelligence without assuming I already know everything. But I might need to run a few sessions to really feel comfortable with it.`,
  issue_annotations: [
    {
      section: "Combat Basics (Chapter 10)",
      issue: "Resolve system explanation lacks concrete step-by-step examples",
      impact: "As a new GM, I'm unclear on exactly what to narrate when characters lose Resolve. The concept is explained but the practical application at the table needs more guidance.",
      location: "ch-10-combat-basics, 'Resolve Instead of Hit Points' section"
    },
    {
      section: "Skills System Overview (Chapter 14)",
      issue: "Abstract descriptions may overwhelm concrete thinkers",
      impact: "The skills chapter feels very reference-heavy. I understand skills are important but the presentation made my eyes glaze over. I wish there were more 'here's exactly how this plays out at the table' examples.",
      location: "ch-14-skills-system-overview"
    },
    {
      section: "Tags, Conditions, and Clocks (Chapter 9)",
      issue: "Conceptual explanation excellent but practical application unclear",
      impact: "I understand WHAT Tags and Conditions are, but I'm less certain about WHEN to introduce them during play. More GM-facing guidance on timing would help.",
      location: "ch-09-tags-conditions-clocks"
    },
    {
      section: "Running Sessions (Chapter 21)",
      issue: "GM section feels designed for experienced GMs adapting to this system",
      impact: "As a brand new GM, I was hoping for more foundational guidance. The chapter assumes I know the basics of running games and focuses on Razorweave-specific approaches.",
      location: "ch-21-running-sessions (GM Section)"
    },
    {
      section: "Character Creation (Chapter 6)",
      issue: "Example character build mentioned but could be expanded",
      impact: "The Rella example is helpful but brief. A longer, annotated walkthrough showing the player's thought process at each step would help me guide my players through creation.",
      location: "ch-06-character-creation, 'Example Character Build: Rella' section"
    }
  ],
  overall_assessment: `This is a thoughtfully written rulebook that genuinely wants to help people play collaboratively. The fiction-first philosophy appeals to me as someone who cares more about the stories we create together than crunching numbers. The structure is logical, the writing is accessible, and the visual design makes key information easy to find.

However, as a new GM who thinks concretely, I found myself wanting more explicit "do this, then this, then this" guidance, especially for combat and running scenes. The book is better at explaining concepts than demonstrating execution. I think experienced GMs will love the flexibility this system offers, but I might need a "quick start" companion guide or some actual play examples to feel fully confident running my first session.

My recommendation: This book earns a solid 6.5/10 for a new GM like me. It's good, and I want to play this game, but I'll probably need to do some homework (watching actual plays, maybe finding a beginner's guide online) before I feel ready to run it for my group.`
};

// Validate
ReviewDataSchema.parse(reviewData);
console.log('Review data validated successfully');

// Connect to razorweave.db in data folder
const dbPath = join(projectRoot, 'data', 'razorweave.db');
const db = new Database(dbPath);

// Create campaign client and save review
const campaignClient = new CampaignClient(db);

// Check if campaign exists, create if needed
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
    JSON.stringify(['core-sarah-new-gm']),
    'in_progress',
    null
  );
  console.log('Created campaign record');
}

// Create the persona review
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251121-202921-q96njych',
  personaId: 'core-sarah-new-gm',
  reviewData,
  agentExecutionTime: Date.now()
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write markdown file
const markdownPath = join(projectRoot, 'data/reviews/raw/campaign-20251121-202921-q96njych/core-sarah-new-gm.md');
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251121-202921-q96njych',
    personaName: 'Sarah the New GM',
    personaArchetype: 'Socializer',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Curious', 'Concrete Thinker'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  markdownPath
);

console.log(`Wrote review markdown to: ${markdownPath}`);

db.close();
console.log('Review saved successfully');
