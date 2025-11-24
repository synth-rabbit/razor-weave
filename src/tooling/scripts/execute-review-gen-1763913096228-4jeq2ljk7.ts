// src/tooling/scripts/execute-review-gen-1763913096228-4jeq2ljk7.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient, writeReviewMarkdown } from '../reviews/index.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

/**
 * Review from: Generated Persona (Method Actor / Newbie)
 *
 * As a Method Actor who is new to tabletop RPGs (0-1 years experience), I am drawn to
 * games that let me become my character. My Evangelical stance on fiction-first play
 * means I actively seek systems that prioritize story over numbers. As a Narrative Purist,
 * I want mechanics that fade into the background while I explore who my character is.
 *
 * Being Complexity Tolerant, I don't mind learning detailed systems - I just want those
 * details to serve character immersion rather than tactical optimization. I'm looking
 * for a rulebook that teaches me how to inhabit a character, not just build one.
 */

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 7,
    persona_fit: 9,
    practical_usability: 7
  },
  narrative_feedback: `I've only been playing tabletop RPGs for about eight months now, but I knew from my first session that what I loved most was disappearing into a character. When someone recommended Razorweave as a "fiction-first" game, I wasn't sure what that meant. Now I understand, and I'm genuinely excited.

The book opens by telling me the story comes first. That's not just marketing - the mechanics actually support it. When I read about intent and approach before rolling dice, something clicked. I don't have to think about "using my Athletics skill" - I describe what my character is trying to do and how they're doing it, and then we figure out which numbers matter. This is exactly how I want to play.

Character creation spoke to me on a deep level. The nine steps aren't just about filling in numbers - they're about discovering who my character is. Step Seven asks me to establish background and relationships. Step Eight has me define goals, drives, and personal threads. These aren't mechanical checkboxes; they're invitations to think about my character as a person with a past and a future. The example character Rella felt like a real person by the time I finished reading her build.

The Attributes (Might, Agility, Presence, Reason) map naturally to how I think about characters. When the book explains that "A high RSN character spots patterns, recalls obscure details, and notices when something does not fit," I immediately know what kind of person that is. I'm not thinking about +2 bonuses - I'm thinking about who my character is at their core.

What surprised me was how much I liked the Conditions and Tags system. As a Method Actor, I want to feel what my character feels. When my character becomes "Exhausted" or "Frightened," that's not just a -2 penalty - it's a dramatic state I can embody. The book even says Conditions "shape how the world and characters behave." That's beautiful. I'm not tracking debuffs; I'm tracking emotional and physical states that change how I roleplay.

The social play chapter made me want to run a character who lives in conversation. The guidance on negotiation, deception, and reading people isn't about winning social encounters - it's about understanding what NPCs want and how relationships shift. When the book describes using Insight to "sense what people need or fear, even when they are not saying it directly," I felt permission to play characters who live in subtext.

As a newer player, I did struggle with some sections. The resolution system makes sense conceptually, but I'm not always sure how all the pieces fit together in the moment. What exactly does it mean when the GM "sets DC based on your opponent's awareness, cover, and Tags"? I understand each word, but putting it all together at the table still feels daunting.

The Clocks system is evocative but took me several read-throughs to grasp. I love the idea of visible progress and pressure - watching a "Waters Rise" clock fill while we scramble to cross a floodplain is exactly the kind of dramatic tension I crave. But I'm not confident I could run this as a GM yet, and even as a player, I'd need a patient table to help me understand when and how Clocks advance.`,
  issue_annotations: [
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Resolution procedure could use a clearer step-by-step walkthrough for new players",
      impact: "The individual pieces (intent, approach, Attribute selection, DC, Advantage/Disadvantage, outcome tiers) are explained well, but I struggled to hold them all in mind simultaneously. A single-page flowchart or numbered procedure for 'what happens when you roll' would help newer players like me internalize the flow.",
      location: "Section 8.3 and 8.4 - The core resolution mechanics"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "Clocks need more examples of table-level management for beginners",
      impact: "I understand what Clocks represent narratively, but I'm unclear on the practical table experience. Who tracks them? Where do they live (index cards, shared screen, GM notes)? How do you decide when to reveal a hidden Clock? The book explains the what and why beautifully but leaves the how feeling abstract for someone who has never seen it done.",
      location: "Section 9.6 'Clock Types and Use' and 9.7 'Advancing Clocks'"
    },
    {
      section: "Chapter 6: Character Creation",
      issue: "Some Steps assume familiarity with TTRPG conventions",
      impact: "Step Three tells me to choose a starting spread of 2/1/1/0 for Attributes, but doesn't explain why these specific numbers or what kind of character each spread creates. The table in Chapter 7 with example archetypes helps, but I found it after I was confused. Consider integrating that guidance earlier or adding a 'if this is your first character' sidebar.",
      location: "Step Three in the Character Creation Flow"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "Action types feel clear in isolation but overwhelming together",
      impact: "Strike, Maneuver, Set Up, and Defend/Withdraw each make sense individually. But when I imagine actually being in combat, I'm not sure how to choose between them or what a typical round should feel like. More examples of multi-round combat with different characters using different actions would help me visualize the flow.",
      location: "Section 10.5 'Core Combat Actions'"
    },
    {
      section: "Chapter 13: Roleplaying Guidance and Working with the GM",
      issue: "This chapter is gold but buried too late in the book",
      impact: "As a Method Actor, Chapter 13's guidance on embodying characters, collaborative storytelling, and working with the GM is exactly what I needed. But I almost missed it because it comes after combat. For narrative-focused newcomers, this material might work better earlier, perhaps as part of or immediately after Character Creation.",
      location: "Entire chapter - especially the sections on character embodiment"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is almost exactly what I've been looking for as a new player who wants to become their characters. The fiction-first philosophy isn't just stated - it's woven through every chapter in ways that make me trust the system. When I read about intent and approach, about Tags and Conditions as dramatic states, about relationships and personal threads in character creation, I see a game that cares about the things I care about.

The book earns high marks for clarity. Despite being my first time with a system this detailed, I never felt talked down to or lost in jargon. The examples throughout are excellent - they show real moments of play, not just abstract mechanics. The Rella character build example is particularly helpful for understanding how all the pieces come together.

For persona fit, this is nearly perfect for Method Actors. The system explicitly supports "playing to find out who your character becomes," which is my favorite way to engage with roleplay. The Conditions and Tags systems give me handles for embodying different states. The social mechanics encourage thinking about what NPCs want rather than just rolling to win.

My struggles are mostly about being new to the hobby. The resolution procedure works once you've internalized it, but getting there takes effort. Clocks are evocative but unfamiliar. Combat is well-designed but assumes comfort with structured turn-taking that I'm still developing. None of these are design flaws - they're just learning curves that a patient group can smooth out.

I would enthusiastically recommend this game to other Method Actors and narrative-focused players. I would bring it to my table and ask my more experienced friends to help me run it. And I would tell other newbies that if they want a system that treats their characters as real people with inner lives, Razorweave delivers.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251123-222404-g1zvdflh',
  personaId: 'gen-1763913096228-4jeq2ljk7',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251123-222404-g1zvdflh',
    personaName: 'Generated Persona (Method Actor / Newbie)',
    personaArchetype: 'Method Actor',
    personaExperience: 'Newbie (0-1 years)',
    personaTraits: ['Evangelical (Fiction-First)', 'Narrative Purist', 'Complexity Tolerant'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251123-222404-g1zvdflh/gen-1763913096228-4jeq2ljk7.md'
);

console.log('Review saved for gen-1763913096228-4jeq2ljk7');
