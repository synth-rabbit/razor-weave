// src/tooling/scripts/execute-review-sarah-new-gm.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { writeReviewMarkdown } from '../reviews/markdown-writer.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

/**
 * Review from: Sarah the New GM (Socializer / Newbie)
 *
 * As Sarah the New GM, I'm brand new to running tabletop RPGs (0-1 years).
 * My Socializer archetype means I prioritize the social experience of gaming.
 * I'm curious about fiction-first play but wary of abstraction. As a Prepared
 * Sandbox GM, I like having structure with room for player-driven exploration.
 * I prefer focused systems and think concretely - show me examples!
 */

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 8,
    persona_fit: 7,
    practical_usability: 7
  },
  narrative_feedback: `As a new GM who's only been running games for a few months, I approached this rulebook with both excitement and trepidation. The fiction-first philosophy really resonates with me - I've always wanted my games to feel more like collaborative stories than number-crunching exercises. And honestly? This book delivers on that promise in ways I didn't expect.

The character creation chapter (Chapter 6) is probably the best onboarding experience I've seen in a TTRPG. The "Quick Start: 15-Minute Character Creation" box is exactly what I needed for my first session - it got my players making characters immediately without feeling overwhelmed. The worked examples showing Rella, Kira, and Delian step-by-step? Those are gold. I kept referencing them when my players asked "what should my Skills be?"

What I appreciate most is how the book anticipates my questions. The "New to TTRPGs?" boxes, the "Your First Check as GM" guidance, and the "Common New-GM Mistakes" callouts make me feel like the designers actually remember what it's like to be starting out. That's rare and valuable.

However, I have to be honest about where I struggled. The Tags, Conditions, and Clocks chapter (Chapter 9) is where things got conceptually dense for me. I understand the individual pieces - Tags describe places, Conditions describe states, Clocks track progress - but knowing when to use each one in the heat of a session still feels uncertain. The "When to Use What" table helps, but I found myself wishing for more concrete decision trees or flowcharts I could reference at the table.

The Combat chapter (Chapter 10) is a mixed experience. On one hand, the "Combat at a Glance" box and the Rella vs. Dock Thug example are brilliantly concrete - I can actually see how the system flows. The cross-genre examples showing the same combat structure in fantasy, noir, and sci-fi settings helped me understand the flexibility. On the other hand, the Tactical Decision Matrix and Action Economy Tips sections assume a level of tactical thinking that I'm not quite at yet. I'm still learning the basics; optimizing action economy feels like advanced material.

The probability tables in Chapter 8 are interesting but honestly a bit intimidating. I don't need to know the exact percentage chance of success right now - I need to know if my players' actions feel fair and fun. The qualitative descriptions ("You succeed more often than not. Expertise shows.") are more useful to me than "62%".

One thing that would really help: more "first session" scenarios beyond the three provided. I ran the "Investigating a Crime Scene" and "Convincing a Guard" examples almost verbatim in my first game because I trusted them. More of these ready-to-run moments would be incredibly valuable.

Overall, this is a rulebook that genuinely tries to meet new GMs where they are. It's not perfect - some sections still feel written more for experienced players who are translating from other systems - but the effort to be accessible is real and appreciated.`,
  issue_annotations: [
    {
      section: "Tags, Conditions, and Clocks",
      issue: "The distinction between Tags, Conditions, and Clocks is explained clearly in isolation, but applying all three systems simultaneously during actual play remains challenging without more practice-oriented guidance.",
      impact: "New GMs may default to using only one system or none at all, missing the texture these tools provide. During my first combat, I forgot to apply Tags entirely because I was focused on tracking the Resolve Clock.",
      location: "Chapter 9: Tags, Conditions, and Clocks"
    },
    {
      section: "Advanced Tactical Content in Core Combat Chapter",
      issue: "The Tactical Decision Matrix and Action Economy Tips, while useful for experienced players, create cognitive overload when included alongside foundational combat rules.",
      impact: "New GMs may feel they need to master optimization before running their first combat, creating unnecessary anxiety. Suggests moving advanced tactics to a separate section or labeling them clearly as 'Advanced' content.",
      location: "Chapter 10: Combat Basics - Tactical Decision Matrix and Action Economy Tips sections"
    },
    {
      section: "Probability Tables Presentation",
      issue: "The probability reference tables (4d6 distribution, success probability by DC) are presented without sufficient context for new players about why these numbers matter or how to use them.",
      impact: "New GMs may skip these tables entirely (missing useful context) or become overwhelmed trying to internalize probability curves before running their first session.",
      location: "Chapter 8: Actions, Checks, and Outcomes - 4d6 Probability Reference section"
    },
    {
      section: "Limited First Session Ready-to-Run Content",
      issue: "Only three first-session scenarios are provided in Chapter 8. New GMs benefit enormously from pre-built examples they can run with minimal preparation.",
      impact: "After exhausting the provided scenarios, new GMs must create their own content without many templates to follow. More examples would extend the 'safe zone' for learning the system.",
      location: "Chapter 8: Actions, Checks, and Outcomes - Common First-Session Scenarios"
    },
    {
      section: "Fiction-First vs. Mechanics Balance",
      issue: "While the book emphasizes 'fiction first, mechanics second,' new GMs need more explicit guidance on when mechanics ARE needed. The three-part test (Uncertainty, Consequence, Agency) is excellent but could use more worked examples showing borderline cases.",
      impact: "New GMs may call for too many or too few rolls, not yet having developed the instinct for when mechanical resolution adds value.",
      location: "Chapter 8: Actions, Checks, and Outcomes - When to Roll section"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is an admirably new-GM-friendly text that takes genuine care to explain not just the "what" but the "why" of its systems. The character creation chapter is exemplary, the worked examples throughout are consistently helpful, and the explicit acknowledgment of new-GM concerns (with dedicated callout boxes) shows thoughtful design.

For someone in my position - running my first campaign, wanting story-focused play, and still building confidence - this book provides a solid foundation. The 4d6 resolution system is intuitive once you see it in action, and the Resolve Clock approach to combat makes narrative sense in a way that hit points never quite did for me.

My main struggles center on the middle complexity tier: Tags, Conditions, and Clocks feel like powerful tools I haven't quite mastered, and some of the tactical optimization content in Combat Basics feels premature for where I am in my GM journey. I'd recommend new GMs start with Chapters 1-8 and the character creation material, then layer in Tags/Conditions/Clocks gradually as comfort grows.

This is a rulebook I'll grow into rather than grow out of. It respects my intelligence while acknowledging my inexperience, and that balance is hard to achieve. With a few more ready-to-run first-session resources and clearer "beginner vs. advanced" labeling on tactical content, this could be the definitive entry point for new GMs looking for fiction-first play.

Recommendation: Strong buy for new GMs interested in story-focused play. Plan to re-read sections after your first few sessions - the advice lands differently once you've experienced the situations it describes.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251124-140640-b5nf5qll',
  personaId: 'core-sarah-new-gm',
  reviewData,
  agentExecutionTime: 120000
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251124-140640-b5nf5qll',
    personaName: 'Sarah the New GM',
    personaArchetype: 'Socializer',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Curious (Fiction-First)', 'Wary of Abstraction', 'Prepared Sandbox GM', 'Prefers Focused Systems', 'Concrete Thinker'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251124-140640-b5nf5qll/core-sarah-new-gm.md'
);

console.log('Review saved for core-sarah-new-gm');
db.close();
