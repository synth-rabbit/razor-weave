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

// Review Data from Morgan the Method Actor's perspective
const reviewData = {
  ratings: {
    clarity_readability: 9,
    rules_accuracy: 8,
    persona_fit: 10,
    practical_usability: 9
  },
  narrative_feedback: `Reading this rulebook felt like coming home. As someone who lives inside my characters - who needs to feel their fears, their hopes, their muscle memory before I can play them honestly - Razorweave gets it. This system understands that the character isn't a collection of numbers. The character is the person I become at the table.

The fiction-first approach isn't just a design philosophy here; it's permission. Permission to describe what my character does before anyone asks what dice to roll. Permission to let the story breathe. When I read Chapter 4 on Core Principles, specifically the section on "Player Intent Drives Action," I felt seen. Intent and approach - that's exactly how I think about scenes. What does my character want? How are they trying to get it? The mechanics follow that, not the other way around.

Character creation in Chapter 6 is a masterclass. Starting with concept, then building identity elements, then layering in the mechanical pieces - this mirrors how I naturally build characters. I don't start with "I want a +2 in Agility." I start with Rella, a relay operator who listens for patterns in the static, who carries the weight of an unresolved argument with a former mentor. The Skills and Proficiencies grow from that foundation like branches from a trunk. That's how it should be.

The way Conditions work speaks directly to method acting. When my character is Frightened or Exhausted, it isn't just a mechanical penalty - it's a state I can embody. The book explicitly encourages playing Conditions as roleplay hooks in Chapter 9. "Let Conditions and Resolve Clocks show up in your description," it says. Stagger when hurt. Hesitate when frightened. Push through when it matters. Yes. This is what makes a character feel real.

I particularly love the guidance on Partial Success outcomes. Chapter 8 makes clear that success with a cost isn't failure - it's a story beat. That's where the richest roleplay lives. My character succeeded but now owes someone a favor. She opened the door but drew unwanted attention. These complications deepen the character moment by moment. They're gifts, not punishments.

The section on Roleplaying Guidance in Chapter 13 is genuinely thoughtful. The advice about creating memorable characters through distinct voice, clear motivations, and honest flaws - that's practical wisdom I can use. The discussion of engaging with the fiction by reacting to outcomes, by building on details other players contribute - this encourages the kind of collaborative immersion that makes sessions unforgettable.

One area where I wanted more: the guidance on playing internal conflict and character growth. The book touches on arcs and threads, but I'd welcome deeper mechanical or procedural support for moments of character transformation - the scene where a drive shifts, where a belief breaks, where the character emerges different on the other side. For a method actor, those transformation moments are sacred ground.

Overall, this is a system that trusts players to bring real characters to the table and gives them the structural support to do it well.`,
  issue_annotations: [
    {
      section: "Chapter 6 - Character Creation",
      issue: "The 'Personal Threads' concept is introduced but mechanics for resolving or transforming threads during play are underdeveloped",
      impact: "Medium - method actors want clear pathways for character evolution and transformation beats",
      location: "Chapter 6, Step Eight (Goals, Drives, and Personal Threads)"
    },
    {
      section: "Chapter 9 - Tags, Conditions, and Clocks",
      issue: "Emotional or psychological Conditions (beyond Frightened) could be expanded - states like Conflicted, Driven, Grieving would support deeper roleplay",
      impact: "Medium - the emotional palette for Conditions feels narrower than the physical/tactical options",
      location: "Chapter 9 and Chapter 18 (Extended Tags and Conditions Reference)"
    },
    {
      section: "Chapter 13 - Roleplaying Guidance",
      issue: "The section on 'Making Meaningful Choices' could include more guidance on playing against type or character growth moments",
      impact: "Low - experienced method actors will intuit this, but explicit support would help",
      location: "Chapter 13, Making Meaningful Choices section"
    },
    {
      section: "Chapter 7 - Characters and Attributes",
      issue: "Attribute descriptions are functional but could include more narrative hooks - what does a PRE 2 character feel like from the inside?",
      impact: "Low - the mechanical explanations are clear, but immersive descriptions would deepen player connection",
      location: "Chapter 7, Attribute Ratings and What They Mean section"
    },
    {
      section: "Chapter 12 - Downtime and Advancement",
      issue: "Character transformation through advancement is mentioned but the narrative arc guidance is brief - how do I mechanically represent a character who has fundamentally changed?",
      impact: "Medium - the Narrative Arcs and Growth section feels like it's scratching the surface of rich territory",
      location: "Chapter 12, Narrative Arcs and Growth subsection"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exactly the system I've been looking for as a method actor. It understands that characters are not optimized builds - they are people we choose to become for a few hours at a time. The fiction-first philosophy isn't decoration; it's the foundation everything else rests on.

What makes this book exceptional for character-immersive players:
- Intent and approach as the entry point for every action
- Character creation that starts with concept and identity, not numbers
- Conditions as roleplay hooks, not just mechanical penalties
- Partial success outcomes that deepen character rather than blocking action
- Explicit encouragement to inhabit your character's emotional states

The system gives me room to breathe into a character while providing enough structure that the table can resolve uncertain moments together. The Tags and Clocks create a shared language for consequences that makes the world feel responsive to our choices.

Areas for growth center on supporting character transformation - the mechanics and guidance for pivotal moments where a character fundamentally changes. This is precious territory for method actors, and while the book gestures toward it, I'd love to see more developed support.

Rating Summary:
- Clarity & Readability: 9/10 - Beautifully written with consistent voice and clear organization
- Rules Accuracy: 8/10 - Internally consistent with minor gaps in emotional/transformation mechanics
- Persona Fit: 10/10 - This system was designed for players who live inside their characters
- Practical Usability: 9/10 - Easy to reference, fiction-first structure keeps play flowing

I will absolutely bring this to my table. This is a system that respects the art of character immersion while providing the collaborative framework that makes shared storytelling possible. For method actors, narrative gamers, and anyone who plays to discover who their character becomes - this is your book.`
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
    JSON.stringify(['core-morgan-method-actor']),
    'in_progress',
    null
  );
  console.log('Created campaign record');
}

// Create the persona review
const reviewId = campaignClient.createPersonaReview({
  campaignId: 'campaign-20251121-202921-q96njych',
  personaId: 'core-morgan-method-actor',
  reviewData,
  agentExecutionTime: Date.now()
});

console.log(`Created persona review with ID: ${reviewId}`);

// Write the markdown file
const markdownPath = join(projectRoot, 'data/reviews/raw/campaign-20251121-202921-q96njych/core-morgan-method-actor.md');
writeReviewMarkdown(
  {
    campaignId: 'campaign-20251121-202921-q96njych',
    personaName: 'Morgan the Method Actor',
    personaArchetype: 'Method Actor',
    personaExperience: 'Experienced (3-10 years)',
    personaTraits: ['Native', 'Intuitive', 'Fiction-First', 'Comfortable with Abstraction'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  markdownPath
);

console.log(`Wrote review markdown to: ${markdownPath}`);

// Close database
db.close();

console.log('Review saved successfully');
