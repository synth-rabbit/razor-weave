// src/tooling/scripts/execute-review-morgan-method-actor.ts
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const db = new Database(join(process.cwd(), 'data', 'project.db'));

/**
 * Review from: Morgan the Method Actor (Method Actor / Experienced)
 *
 * As Morgan the Method Actor, I bring years of experience in inhabiting characters
 * deeply at the gaming table. My Experienced (3-10 years) background has taught me
 * what systems support immersive play and which ones pull me out of character.
 *
 * With a Native fiction-first alignment and Intuitive cognitive style, I approach
 * games as opportunities for character embodiment. I'm comfortable with abstraction
 * and enjoy genre flexibility. As a Non-GM player, I focus on the player experience
 * and how well the system supports deep character work.
 */

const reviewData = {
  ratings: {
    clarity_readability: 8,
    rules_accuracy: 9,
    persona_fit: 9,
    practical_usability: 8
  },
  narrative_feedback: `When I first sit down with a new rulebook, I ask myself one question: will this help me disappear into my character, or will it pull me out of the moment? After spending time with the Razorweave Core Rulebook, I can say it does something rare - it gets out of my way while still giving me meaningful structure to work with.

Let me start with what matters most to me as someone who lives for deep character immersion. Chapter 13, Roleplaying Guidance and Working with the GM, speaks directly to how I approach play. The section on 'Creating Memorable Characters' articulates exactly what I've learned through years of inhabiting characters: distinct voice, clear motivations, and the crucial importance of flaws and strengths. This isn't revolutionary, but seeing it codified validates my instincts and gives me language to help newer players understand what I've been doing intuitively.

The 'Engaging with the Fiction' guidance hits perfectly. 'Go beyond I attack. Show how you move, what you say, what it looks like.' Yes. This is what transforms a mechanical exercise into lived experience. The advice to react to outcomes - letting successes, partials, and failures change how your character feels and behaves - that's the soul of method acting at the gaming table. When my character fails a check, that failure becomes part of who they are now. The system explicitly encourages this.

The fiction-first philosophy throughout the book is native to how I already play. The explanation in Chapter 2 that 'you do not start with a rule and then try to force the fiction to match it' describes my approach perfectly. I've played systems where I felt like I was constantly translating between the story I wanted to tell and the mechanics demanding attention. Here, the mechanics feel like they're waiting politely until I need them.

Character creation (Chapter 6) encourages exactly the kind of character building I love. Starting with concept before touching any numbers, defining core identity elements, then building outward - this mirrors my own process of developing a character's inner life before worrying about what they can mechanically do. The nine-step flow from concept through final review gives me a structured path while leaving room for the intuitive leaps that make characters come alive.

The Attributes themselves feel right for fiction-first play. The intent and approach system means I'm never pigeonholed into one way of solving problems. If I've established that my character avoids direct confrontation, I can describe talking my way through a situation and use Presence instead of being forced into a Might check because the obstacle is 'physical.' This flexibility rewards consistent characterization.

Conditions as narrative states rather than mechanical penalties feel natural to embody. When my character becomes Frightened, that's not just -2 to something - it's an invitation to show fear in how I play the scene. When they're Exhausted, I get to communicate that through my performance. Tags in the environment give me concrete details to react to and incorporate into my portrayal.

The combat chapter surprised me pleasantly. The Resolve Clock system means combat isn't about tracking hit points but about dramatic tension. The explicit question 'what does taken out mean in this scene?' before combat even begins is perfect for my style. I want to know the emotional and narrative stakes so I can play toward them, not just optimize dice.

Chapter 13's advice on spotlight sharing resonates deeply. As someone who commits fully to my character, I've had to learn when my intensity needs to make room for others. The concept of 'stepping forward' when your character's elements are central and 'stepping back' to support others matches what I've learned over years of play. It's good to see this wisdom written down for everyone.

The safety tools section is handled with appropriate seriousness without being heavy-handed. For immersive roleplay to work, everyone needs to feel safe enough to go deep. The example of pausing mid-scene when something hits too close to home shows the system understands that character work touches real emotions.

I'm comfortable with the abstraction level here. Skills and Proficiencies have clear purposes, but they don't try to cover every conceivable situation with a specific rule. This leaves room for judgment, collaboration, and the kind of organic play where my character's unique approach to a problem matters more than which skill I have the highest bonus in.

What I value most is how the whole system supports character-driven play without demanding it. Players who want tactical depth can find it. Players like me who want to get lost in their character's headspace have tools and explicit encouragement to do so. Neither approach is positioned as 'playing wrong.'`,
  issue_annotations: [
    {
      section: "Chapter 6: Character Creation",
      issue: "The example character Rella appears after all the detailed steps rather than alongside them or at the beginning",
      impact: "When I'm preparing to embody a character, I want to see the destination before the journey. Understanding where we're heading helps me make intuitive choices at each step. Currently, I have to work through nine steps abstractly before seeing how they come together in an actual character. For players who think intuitively like me, presenting Rella upfront as a complete portrait - then unpacking how each step contributed - would make the creative process feel more natural.",
      location: "Section 6.13 'Example Character Build: Rella' - currently at chapter end"
    },
    {
      section: "Chapter 13: Roleplaying Guidance",
      issue: "The excellent character embodiment guidance could benefit from more extended examples of deep roleplay",
      impact: "The advice in this chapter is solid, but it reads somewhat like principles rather than lived experience. For method actors and immersion-focused players, seeing extended scenes that demonstrate embodied play - not just 'here is a technique' but 'here is what it looks like when someone uses that technique for several exchanges' - would make the guidance more concrete and inspiring.",
      location: "Throughout Chapter 13 - currently uses brief examples"
    },
    {
      section: "Chapter 9: Tags, Conditions, and Clocks",
      issue: "The emotional and psychological Conditions could use more detailed guidance for roleplay expression",
      impact: "Frightened and Dazed are mentioned as Conditions, but I'd love more guidance on how to embody these states beyond their mechanical effects. What does Frightened look like in different characters? How might different personalities express Exhaustion? This kind of guidance would help method actors translate mechanical states into nuanced performances.",
      location: "Section on Conditions - currently focuses primarily on mechanical effects"
    },
    {
      section: "Chapter 7: Characters and Attributes",
      issue: "The 'Working with Low Attributes' section is good but could go deeper on character expression",
      impact: "The section correctly notes that low Attributes are not punishments and create interesting story moments. For immersion-focused players, more explicit guidance on how to roleplay around weaknesses - not just avoid situations, but actively embody the limitation as part of character identity - would strengthen the already-good advice.",
      location: "Section 7.4 'Working with Low Attributes'"
    },
    {
      section: "Overall Structure",
      issue: "No dedicated section on voice and physicality for character embodiment",
      impact: "Chapter 13 mentions 'distinct voice' as important for memorable characters, but doesn't expand on techniques for developing voice, mannerisms, or physical presence at the table. Method actors often work extensively on these elements. A brief sidebar or subsection addressing how players can develop their character's verbal and physical presence would support deep immersion play.",
      location: "Would fit naturally in Chapter 6 or Chapter 13"
    }
  ],
  overall_assessment: `The Razorweave Core Rulebook is exceptionally well-suited for fiction-first, character-immersive play. As someone who has spent years developing the craft of inhabiting characters fully at the gaming table, I found the system's philosophy aligned with my approach and its mechanical structure supportive rather than intrusive.

The fiction-first principle isn't just marketing language - it's embedded in how Checks work, how Attributes connect to described approaches, and how the entire resolution system flows from narrative to mechanics rather than the reverse. For method actors who want to stay in character as much as possible, this reduces the cognitive friction that can break immersion.

Chapter 13's roleplaying guidance demonstrates genuine understanding of collaborative character play. The spotlight sharing advice, the emphasis on letting consequences change how your character behaves, and the safety tools integration all support the kind of vulnerable, committed performance that makes tabletop RPGs transcendent.

The Conditions and Tags system gives me concrete fictional elements to react to and embody. Combat through Resolve Clocks keeps dramatic stakes at the center rather than mathematical attrition. The flexibility of approaching any situation through any Attribute based on described intent rewards consistent characterization.

My suggestions center on deepening the already-strong support for immersive play: more extended examples of embodied roleplay in action, guidance on expressing psychological Conditions through performance, and explicit attention to voice and physicality development. These aren't flaws but opportunities to serve method actors even better.

For experienced players who prioritize character immersion and narrative collaboration, Razorweave feels like a system designed with us in mind. I'm excited to bring characters to life within its fiction-first framework.`
};

// Insert review into database
const reviewDataJson = JSON.stringify(reviewData);
const stmt = db.prepare(`
  INSERT INTO persona_reviews (
    campaign_id, persona_id, review_data,
    agent_execution_time, status
  ) VALUES (?, ?, ?, ?, ?)
`);

const result = stmt.run(
  'campaign-20251124-010827-3hy9kg3y',
  'core-morgan-method-actor',
  reviewDataJson,
  Date.now(),
  'completed'
);

console.log('Review saved to database with ID:', result.lastInsertRowid);

// Write markdown file
const markdown = `# Review: Morgan the Method Actor - Book Review

Campaign: campaign-20251124-010827-3hy9kg3y | Date: ${new Date().toISOString()}

## Persona Profile

- **Archetype:** Method Actor
- **Experience:** Experienced (3-10 years)
- **Playstyle:** Native, Intuitive

## Structured Ratings

- **Clarity & Readability:** ${reviewData.ratings.clarity_readability}/10
- **Rules Accuracy:** ${reviewData.ratings.rules_accuracy}/10
- **Persona Fit:** ${reviewData.ratings.persona_fit}/10
- **Practical Usability:** ${reviewData.ratings.practical_usability}/10

## Narrative Feedback

${reviewData.narrative_feedback}

## Issue Annotations

${reviewData.issue_annotations
  .map(
    (annotation, idx) => `### ${idx + 1}. ${annotation.section}

**Issue:** ${annotation.issue}

**Impact:** ${annotation.impact}

**Location:** ${annotation.location}
`
  )
  .join('\n')}

## Overall Assessment

${reviewData.overall_assessment}
`;

const outputPath = 'data/reviews/raw/campaign-20251124-010827-3hy9kg3y/core-morgan-method-actor.md';
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown, 'utf-8');
console.log('Markdown written to:', outputPath);

db.close();
