// src/tooling/scripts/execute-review-gen-1763913096224-zgpvfi91e.ts
// Review script for persona: Generated Persona 550693 (Storyteller/Early Intermediate)
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As someone who lives for collaborative storytelling and prefers fiction to drive everything, this rulebook immediately speaks my language. The opening chapters establish exactly what I need: fiction first, always. The emphasis on "the story comes first, mechanics support the story" resonates deeply with how I want to play.

The core loop is elegantly simple - describe what happens, reach for dice only when uncertainty matters. That's beautiful. I appreciate that the book explicitly states you don't need to memorize everything before playing - that removes a lot of pressure I used to feel with crunchier systems.

However, I do get lost in some sections. The Skills and Proficiencies chapters, while comprehensive, feel like I'm swimming in options. As someone who seeks simplicity, I want more guidance on "just pick these if you're starting out." The open-ended nature of custom Skills and Proficiencies is liberating in theory, but as an early intermediate player, it also feels intimidating when I just want to get to the story.

The Clocks system is wonderful for pacing narrative tension - I can already see how it creates that ticking urgency in dramatic moments. Tags and Conditions give me vocabulary to describe what's happening without needing to track numbers endlessly.

The examples throughout the book are my favorite parts. Rella's character creation walkthrough shows exactly how to connect concept to mechanics. I wish there were more examples like this in the later, denser chapters.

My biggest concern is the sheer volume of content. For someone who wants to understand the system well enough to focus on the story, there's a lot to wade through before getting to the parts that matter most to me - the collaborative, narrative-driven play.`,
  issue_annotations: [
    {
      section: "Chapter 14-17: Skills and Proficiencies",
      issue: "Overwhelming number of options without clear starter recommendations",
      impact: "As a simplicity seeker, I feel paralyzed by choice rather than empowered. The open list philosophy is elegant but needs a 'recommended starting set' for each archetype.",
      location: "Chapters 14-17, particularly the domain proficiency tables"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Nine steps feels like a lot for getting started",
      impact: "While thorough, the step count could discourage new players who want to jump into storytelling quickly. A 'quick start' variant with 4-5 essential steps would help.",
      location: "Section 'The Creation Flow' listing Steps One through Nine"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "The margin calculation and outcome tier system requires memorization",
      impact: "I love that there are only 5 outcome tiers, but the specific margin numbers (-7 for critical failure, +5 for critical success) are abstract. A quick reference card would help until these become second nature.",
      location: "Section 'Rolling 4d6 and Calculating Margin'"
    },
    {
      section: "GM Guidance Boxes",
      issue: "GM-specific content mixed throughout player-focused chapters",
      impact: "As a player-focused storyteller, I sometimes skip GM boxes but then miss important context. Clearer signposting about which GM boxes contain player-relevant info would help.",
      location: "Various GM boxes throughout Part I"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is a genuinely fiction-first system that puts collaborative storytelling at the center. The philosophy aligns perfectly with how I want to play - describe the moment, let dice resolve uncertainty, keep the story moving.

The 4d6 system with its advantage/disadvantage mechanic is intuitive once you grasp it. The absence of hit points in favor of Resolve Clocks and Conditions feels narratively honest - characters don't just lose numbers, they accumulate dramatic consequences that shape future scenes.

For my playstyle as a Storyteller who prefers simplicity, the book succeeds in its foundations but stumbles in its reference sections. The early chapters (1-10) are excellent - clear, well-paced, with good examples. The middle reference chapters (14-20) feel like they're designed for a different reader who wants encyclopedic coverage.

My recommendation: add a "Quick Start" appendix that distills the essential loop into 2-3 pages with pre-generated characters and a simple scenario. This would let narrative-focused players like me get into the story faster, then explore the depths of the system as we grow comfortable.

Overall, this is a system I want to play. It just needs a gentler on-ramp for those of us who prioritize story over system mastery.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096224-zgpvfi91e',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona 550693',
    personaArchetype: 'Storyteller',
    personaExperience: 'Early Intermediate (1-3 years)',
    personaTraits: ['Evangelical', 'Simplicity Seeker'],
    contentTitle: 'Book Review',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096224-zgpvfi91e.md'
);

console.log('Review saved');
