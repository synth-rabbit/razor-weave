// src/tooling/scripts/execute-review-alex-indie-convert.ts
import { getDatabase } from '../database/index.js';
import { CampaignClient } from '../reviews/campaign-client.js';
import { writeReviewMarkdown } from '../reviews/markdown-writer.js';

const db = getDatabase();
const campaignClient = new CampaignClient(db.getDb());

/**
 * Review from: Alex the Indie Convert (Storyteller / Experienced)
 *
 * As Alex the Indie Convert, I spent years in traditional gaming before discovering
 * indie and story-focused RPGs. With 3-10 years of experience, I've seen what works
 * and what doesn't across different design philosophies. My Evangelical stance on
 * fiction-first play means I actively champion narrative tools over mechanical crunch.
 *
 * As a Collaborative Storyteller GM, I believe the best games emerge from shared
 * authorship. I enjoy genre flexibility and approach games intuitively rather than
 * analytically. I'm looking for systems that trust the table and put story first.
 */

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 9,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `After years of playing D&D and Pathfinder, I finally found my people when I discovered Blades in the Dark and Dungeon World. That shift changed everything about how I think about games. So when I picked up Razorweave, I was reading it with a very specific lens: Does this actually deliver on fiction-first, or is it just marketing language slapped onto traditional mechanics?

The answer is yes, it really delivers. And as someone who has spent a lot of time convincing skeptical players that narrative games aren't "just making stuff up," this book gives me exactly the tools I need.

The opening chapters establish the philosophy beautifully. When Chapter 2 says "The story is always the starting point," it doesn't leave that as an abstract principle. It immediately follows up with concrete guidance about when to reach for rules and when to just narrate. The three-part test of uncertainty, consequence, and agency for calling for rolls is exactly the kind of framework I can teach to players who are transitioning from more traditional games.

What really won me over is how the Attribute system works. Instead of having fixed skill-attribute pairings, the GM chooses the Attribute based on how you describe your approach. The same task of opening a stuck hatch could be MIG (brute force), AGI (picking the lock), PRE (convincing someone to open it), or RSN (analyzing for weak points). This is elegant design that reinforces the fiction-first philosophy at a mechanical level. Every roll becomes a conversation about what your character is actually doing, not just which number is highest on your sheet.

The Tags, Conditions, and Clocks system is where I see my indie gaming heart most reflected. These aren't bolted-on narrative mechanics - they're integrated from the ground up. Tags like "Dim Light," "Cramped," and "Unstable" aren't just modifiers; they're prompts for description and decision-making. When the book says Tags "shape decisions," it means it. And Conditions as dramatic states rather than hit point proxies? That's exactly the kind of design I've been hoping traditional-leaning systems would adopt.

Clocks deserve special praise. The dual-clock structure for investigation scenes - a "Progress" clock for solving the mystery and a "Pressure" clock for things getting worse - is elegant and immediately usable. I've run similar mechanics in Blades and PbtA games, and seeing them integrated here with clear guidance makes me confident I could introduce them to players who've never seen anything like them before.

The combat chapter pleasantly surprised me. Instead of hit points, the system uses Resolve Clocks and Conditions. This keeps combat tied to narrative stakes rather than attrition math. When the book asks "Before a fight begins, what does 'taken out' mean in this scene?" I literally cheered. That question alone transforms combat from a tactical mini-game into a dramatic scene with actual stakes that the table agrees on.

The Skills and Proficiencies system strikes a nice balance between structure and flexibility. Having example lists grouped by Attribute helps new players understand what's possible, but the explicit encouragement to create custom entries with GM collaboration means we're not trapped by pre-written options. The guidance on writing Skills ("Lead with actions," "Avoid totalizing labels") shows the designers understand what makes these systems work.

Chapter 13 on Roleplaying Guidance and Working with the GM contains everything I wish I'd had when I was first learning to run collaborative games. The sections on spotlight sharing, reading the table, and handling disagreements are practical and wise. The safety tools guidance is present without being preachy - it acknowledges that tables need to talk about this stuff and provides simple frameworks without mandating specific approaches.

As a GM who runs for different groups with different comfort levels, I appreciate how the book supports multiple modes of play. The reference to shared authority, solo play, and duet play in the early chapters signals that this system understands modern play styles. The GM section (Part III) looks comprehensive based on the table of contents, and I'm looking forward to diving into it.

There are areas where I think the book could be even stronger for someone in my position. The character creation chapter is thorough, but it front-loads a lot of information before you see the example character (Rella). I'd love to see the example character presented first as a complete picture, then broken down step-by-step. That's how I tend to teach character creation to new players anyway.

The resolution system explanation in Chapter 8 is clear, but the relationship between DC, margin, and outcome tiers took me a couple of read-throughs to fully internalize. A single consolidated example showing a complete resolution from start to finish - including DC setting, Advantage/Disadvantage application, roll, margin calculation, and outcome tier interpretation - would be valuable for reference during play.

I noticed the book doesn't include sample scenarios or starter adventures. For someone like me who often introduces new players to systems, having a ready-to-run one-shot with pre-generated characters would be incredibly helpful. I understand this might be planned for supplementary materials, but its absence means more prep work for GMs trying to onboard new groups.`,
  issue_annotations: [
    {
      section: "Chapter 6: Character Creation",
      issue: "Example character (Rella) appears after all the detailed steps rather than alongside them",
      impact: "For players transitioning from traditional games, seeing a complete character first helps them understand where the process is going. Currently, you need to read through nine steps before seeing how they come together. Consider presenting Rella as a complete snapshot early in the chapter, then unpacking how each step contributed to that result.",
      location: "Section 6.13 'Example Character Build: Rella' - currently at the end of the chapter"
    },
    {
      section: "Chapter 8: Actions, Checks, and Outcomes",
      issue: "Resolution procedure could benefit from a consolidated walkthrough example",
      impact: "The components (intent, approach, Attribute selection, DC setting, Advantage/Disadvantage, outcome tiers) are all clearly explained individually, but I had to mentally piece together how they flow in sequence. A single worked example showing a complete roll from declaration to consequence interpretation would serve as a valuable quick-reference during play.",
      location: "Chapter 8 overall - suggest adding a 'Complete Resolution Example' subsection"
    },
    {
      section: "Chapter 10: Combat Basics",
      issue: "The Resolve Clock / 'taken out' stakes discussion is excellent but could be more prominent",
      impact: "The question 'what does taken out mean in this scene?' is transformative for players coming from HP-attrition games. Currently it appears mid-chapter. Consider elevating this to a highlighted callout box or placing it earlier, as it's the conceptual key that unlocks the entire combat system's narrative potential.",
      location: "Section 10.3 'Resolve Instead of Hit Points' - the stakes-setting paragraph"
    },
    {
      section: "Part I Overall",
      issue: "No starter scenario or quick-start materials for new groups",
      impact: "As someone who regularly introduces new players to systems, the absence of a ready-to-run scenario with pre-generated characters means I need to do significant prep work before running a first session. Even a simple '2-hour introduction scenario' with 3-4 pre-made characters would dramatically lower the barrier to getting tables started.",
      location: "Not present - would suggest adding to Chapter 27 (Sheets and Play Aids) or as a dedicated supplement"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "Dual-clock investigation structure deserves more visual prominence",
      impact: "The Progress/Pressure dual-clock pattern for investigation scenes is brilliant and immediately usable, but it's buried in prose. A diagram or highlighted callout showing how these clocks interact would make this pattern more memorable and easier to reference during prep.",
      location: "The investigation example mentions dual clocks but doesn't visually highlight the pattern"
    }
  ],
  overall_assessment: `Razorweave Core Rulebook is exactly the kind of system I've been waiting for: one that takes the best insights from narrative-focused indie games and presents them in a form that's accessible to players coming from traditional gaming backgrounds.

For someone like me - an indie convert who GMs for mixed groups - this book solves a real problem. I no longer need to choose between "a system my traditional-gaming friends will accept" and "a system that supports the collaborative storytelling I love." Razorweave does both.

The fiction-first philosophy isn't just stated; it's structurally embedded in the rules. The Attribute-based approach selection, the Tags and Conditions as narrative states, the Resolve Clocks instead of hit points, the explicit guidance on setting stakes before combat - these aren't optional modules or advanced rules. They're the foundation of play.

The writing is clear and welcoming without being condescending. The examples are practical and varied. The organization generally supports both learning and reference, though there's room for improvement in how some concepts are consolidated.

My main feedback centers on making the book even more accessible for onboarding new players: present complete examples before detailed breakdowns, add visual highlighting to key patterns like dual-clock investigations, and provide starter materials that let GMs run a first session without extensive prep.

But these are refinements, not fundamental issues. As it stands, Razorweave Core Rulebook is the game I will be recommending to everyone in my gaming circles who has been curious about narrative games but intimidated by unfamiliar terminology or abstract mechanics. This is how you bridge the gap between traditional and indie gaming - by building a system that honors both while committing fully to fiction-first principles.

I'm already planning my first campaign.`
};

campaignClient.createPersonaReview({
  campaignId: 'campaign-20251124-010827-3hy9kg3y',
  personaId: 'core-alex-indie-convert',
  reviewData,
  agentExecutionTime: Date.now()
});

writeReviewMarkdown(
  {
    campaignId: 'campaign-20251124-010827-3hy9kg3y',
    personaName: 'Alex the Indie Convert',
    personaArchetype: 'Storyteller',
    personaExperience: 'Experienced (3-10 years)',
    personaTraits: ['Evangelical (Fiction-First)', 'Intuitive', 'Collaborative Storyteller'],
    contentTitle: 'Razorweave Core Rulebook',
    reviewData
  },
  'data/reviews/raw/campaign-20251124-010827-3hy9kg3y/core-alex-indie-convert.md'
);

console.log('Review saved for core-alex-indie-convert');
